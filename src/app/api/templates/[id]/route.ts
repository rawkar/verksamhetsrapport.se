import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateTemplateSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/templates/[id] – Hämta mall
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

  const { data: template, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !template) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Mall hittades inte' } },
      { status: 404 }
    )
  }

  // Kontrollera åtkomst: globala mallar kan alla se, org-mallar kräver membership
  if (!template.is_global && template.org_id) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', template.org_id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
        { status: 403 }
      )
    }
  }

  return NextResponse.json({ data: template })
}

// PATCH /api/templates/[id] – Uppdatera mall
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

  // Hämta mallen först
  const { data: existing } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Mall hittades inte' } },
      { status: 404 }
    )
  }

  // Globala mallar kan inte redigeras av användare
  if (existing.is_global) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Globala mallar kan inte redigeras' } },
      { status: 403 }
    )
  }

  // Kontrollera membership
  if (existing.org_id) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', existing.org_id)
      .single()

    if (!membership || membership.role === 'member') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Behörighet krävs' } },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const result = updateTemplateSchema.safeParse(body)

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

  return NextResponse.json({ data: template })
}

// DELETE /api/templates/[id] – Radera mall
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
    .from('report_templates')
    .select('org_id, is_global')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Mall hittades inte' } },
      { status: 404 }
    )
  }

  if (existing.is_global) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Globala mallar kan inte raderas' } },
      { status: 403 }
    )
  }

  if (existing.org_id) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', existing.org_id)
      .single()

    if (!membership || membership.role === 'member') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Behörighet krävs' } },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { deleted: true } })
}
