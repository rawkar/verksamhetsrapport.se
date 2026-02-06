import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id: reportId, version: versionNumber } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  // Get report
  const { data: report } = await supabase
    .from('reports')
    .select('id, org_id')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapport hittades inte' }, { status: 404 })
  }

  // Check membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', report.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Get the version to restore
  const { data: version } = await supabase
    .from('report_versions')
    .select('sections_content, generated_content')
    .eq('report_id', reportId)
    .eq('version_number', parseInt(versionNumber, 10))
    .single()

  if (!version) {
    return NextResponse.json({ error: 'Version hittades inte' }, { status: 404 })
  }

  // Restore: update the report with the version's content
  const { error } = await supabase
    .from('reports')
    .update({
      sections_content: version.sections_content,
      generated_content: version.generated_content,
      status: 'draft',
    })
    .eq('id', reportId)

  if (error) {
    return NextResponse.json({ error: 'Kunde inte återställa version' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
