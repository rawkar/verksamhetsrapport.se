import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTemplateSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/templates – Lista tillgängliga mallar (globala + organisationens)
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')

  // Hämta globala mallar
  let query = supabase
    .from('report_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (orgId) {
    // Globala + organisationens mallar
    query = query.or(`is_global.eq.true,org_id.eq.${orgId}`)
  } else {
    // Bara globala mallar
    query = query.eq('is_global', true)
  }

  const { data: templates, error } = await query

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: templates })
}

// POST /api/templates – Skapa ny mall
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
  const { org_id, ...templateData } = body

  if (!org_id) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'org_id krävs' } },
      { status: 400 }
    )
  }

  // Kontrollera membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', org_id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
      { status: 403 }
    )
  }

  const result = createTemplateSchema.safeParse(templateData)

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

  const { data: template, error } = await supabase
    .from('report_templates')
    .insert({
      ...result.data,
      org_id,
      is_global: false,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: template }, { status: 201 })
}
