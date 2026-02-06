import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateOrgSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/organizations/[id] – Hämta organisation
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Kontrollera membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst till denna organisation' } },
      { status: 403 }
    )
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !org) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Organisation hittades inte' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: { ...org, role: membership.role } })
}

// PATCH /api/organizations/[id] – Uppdatera organisation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Kontrollera att användaren är owner eller admin
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', id)
    .single()

  if (!membership || membership.role === 'member') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Behörighet krävs (admin/owner)' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = updateOrgSchema.safeParse(body)

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

  const { data: org, error } = await supabase
    .from('organizations')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: org })
}
