import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET - list versions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  // Get report to check org membership
  const { data: report } = await supabase
    .from('reports')
    .select('org_id')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapport hittades inte' }, { status: 404 })
  }

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', report.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  const { data: versions } = await supabase
    .from('report_versions')
    .select('id, version_number, created_at, created_by')
    .eq('report_id', reportId)
    .order('version_number', { ascending: false })

  return NextResponse.json({ data: versions || [] })
}

// POST - create a new version snapshot
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapport hittades inte' }, { status: 404 })
  }

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', report.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Get latest version number
  const { data: latest } = await supabase
    .from('report_versions')
    .select('version_number')
    .eq('report_id', reportId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (latest?.version_number || 0) + 1

  const { data: version, error } = await supabase
    .from('report_versions')
    .insert({
      report_id: reportId,
      version_number: nextVersion,
      sections_content: report.sections_content,
      generated_content: report.generated_content,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Kunde inte skapa version' }, { status: 500 })
  }

  return NextResponse.json({ data: version })
}
