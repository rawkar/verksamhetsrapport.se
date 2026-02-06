import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createReportSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// GET /api/reports – Lista rapporter (filtrerat per org)
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

  if (!orgId) {
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
    .eq('org_id', orgId)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Ingen åtkomst' } },
      { status: 403 }
    )
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, title, report_year, report_period, status, created_at, updated_at, template_id, created_by')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: reports })
}

// POST /api/reports – Skapa ny rapport
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
  const { org_id, ...reportData } = body

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

  const result = createReportSchema.safeParse(reportData)

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

  // Hämta mallen för att initiera tomma sektioner
  const { data: template } = await supabase
    .from('report_templates')
    .select('sections')
    .eq('id', result.data.template_id)
    .single()

  // Initiera sections_content med tomma fält för varje sektion
  const sectionsContent: Record<string, { raw_input: string; is_locked: boolean }> = {}
  if (template?.sections) {
    const sections = template.sections as Array<{ id: string }>
    for (const section of sections) {
      sectionsContent[section.id] = { raw_input: '', is_locked: false }
    }
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      ...result.data,
      org_id,
      created_by: user.id,
      sections_content: sectionsContent,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: report }, { status: 201 })
}
