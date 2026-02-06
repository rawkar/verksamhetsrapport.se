import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createOrgSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/organizations – Lista användarens organisationer
export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Inte inloggad' } },
      { status: 401 }
    )
  }

  // Använd admin-klienten för att undvika RLS-problem
  const admin = getSupabaseAdmin()

  const { data: memberships, error: memberError } = await admin
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)

  if (memberError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: memberError.message } },
      { status: 500 }
    )
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const orgIds = memberships.map((m) => m.org_id)
  const { data: organizations, error: orgError } = await admin
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .order('created_at', { ascending: false })

  if (orgError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: orgError.message } },
      { status: 500 }
    )
  }

  // Lägg till roll per organisation
  const orgsWithRole = organizations?.map((org) => ({
    ...org,
    role: memberships.find((m) => m.org_id === org.id)?.role || 'member',
  }))

  return NextResponse.json({ data: orgsWithRole })
}

// POST /api/organizations – Skapa ny organisation
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Inte inloggad' } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const result = createOrgSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ogiltig data',
          details: result.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const { name, org_type, sector, description } = result.data

  // Generera slug från namn
  const slug = name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Använd admin-klienten för att kringgå RLS
  const admin = getSupabaseAdmin()

  // Kontrollera att slug är unik
  const { data: existing } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .limit(1)

  const uniqueSlug =
    existing && existing.length > 0
      ? `${slug}-${Date.now().toString(36)}`
      : slug

  // Skapa organisation
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name,
      slug: uniqueSlug,
      org_type,
      sector: sector || null,
      description: description || null,
      style_profile: body.style_profile || {},
    })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: orgError.message } },
      { status: 500 }
    )
  }

  // Lägg till användaren som owner
  const { error: memberError } = await admin.from('org_members').insert({
    user_id: user.id,
    org_id: org.id,
    role: 'owner',
  })

  if (memberError) {
    // Rulla tillbaka organisationen om membership misslyckas
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: memberError.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { ...org, role: 'owner' } }, { status: 201 })
}
