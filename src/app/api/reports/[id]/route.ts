import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateReportSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/reports/[id] – Hämta rapport med innehåll
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

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !report) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rapport hittades inte' } },
      { status: 404 }
    )
  }

  // Kontrollera membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', report.org_id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
      { status: 403 }
    )
  }

  // Hämta tillhörande mall
  let template = null
  if (report.template_id) {
    const { data } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', report.template_id)
      .single()
    template = data
  }

  return NextResponse.json({ data: { ...report, template } })
}

// PATCH /api/reports/[id] – Uppdatera rapport (metadata)
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

  // Hämta rapport för att kontrollera org_id
  const { data: existing } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rapport hittades inte' } },
      { status: 404 }
    )
  }

  // Kontrollera membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', existing.org_id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const result = updateReportSchema.safeParse(body)

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

  const { data: report, error } = await supabase
    .from('reports')
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

  return NextResponse.json({ data: report })
}

// DELETE /api/reports/[id] – Radera rapport
export async function DELETE(
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

  const { data: existing } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Rapport hittades inte' } },
      { status: 404 }
    )
  }

  // Kontrollera membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', existing.org_id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
      { status: 403 }
    )
  }

  const { error } = await supabase.from('reports').delete().eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
