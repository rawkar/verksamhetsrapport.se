import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { generatePDFBuffer } from '@/lib/pdf/report-pdf'
import type { TemplateSection } from '@/types/database'

export async function POST(
  request: NextRequest,
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

  const admin = getSupabaseAdmin()

  const body = await request.json()
  const format = (body.format as string) || 'pdf'

  // Get report
  const { data: report } = await admin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapport hittades inte' }, { status: 404 })
  }

  if (!report.generated_content) {
    return NextResponse.json({ error: 'Rapporten har inget genererat innehåll' }, { status: 400 })
  }

  // Check membership
  const { data: member } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', report.org_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Get org
  const { data: org } = await admin
    .from('organizations')
    .select('name, subscription_plan')
    .eq('id', report.org_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organisation saknas' }, { status: 400 })
  }

  if (format === 'txt') {
    return new NextResponse(report.generated_content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${report.title}.txt"`,
      },
    })
  }

  if (format === 'pdf') {
    // Get template sections for TOC
    let sections: { title: string; level: number }[] = []
    if (report.template_id) {
      const { data: template } = await admin
        .from('report_templates')
        .select('sections')
        .eq('id', report.template_id)
        .single()

      if (template?.sections) {
        sections = (template.sections as TemplateSection[]).map((s) => ({
          title: s.title,
          level: s.level,
        }))
      }
    }

    try {
      const pdfBuffer = generatePDFBuffer({
        title: report.title,
        orgName: org.name,
        year: report.report_year,
        period: report.report_period,
        content: report.generated_content as string,
        sections,
      })

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report.title}.pdf"`,
        },
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      return NextResponse.json(
        { error: 'PDF-generering misslyckades: ' + (err as Error).message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Format stöds inte' }, { status: 400 })
}
