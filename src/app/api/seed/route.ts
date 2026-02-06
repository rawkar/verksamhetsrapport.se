import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { globalTemplates } from '@/seed/global-templates'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/seed – Ladda in globala mallar (force=true ersätter befintliga)
export async function POST(request: NextRequest) {
  const admin = getSupabaseAdmin()

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  if (force) {
    await admin
      .from('report_templates')
      .delete()
      .eq('is_global', true)
  } else {
    const { data: existing } = await admin
      .from('report_templates')
      .select('id')
      .eq('is_global', true)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        data: { message: 'Globala mallar finns redan. Använd ?force=true för att ersätta.', skipped: true },
      })
    }
  }

  const results = []

  for (const template of globalTemplates) {
    const { data, error } = await admin
      .from('report_templates')
      .insert({
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        sections: template.sections,
        is_default: template.is_default,
        is_global: template.is_global,
        org_id: null,
      })
      .select()
      .single()

    if (error) {
      results.push({ name: template.name, error: error.message })
    } else {
      results.push({ name: template.name, id: data.id })
    }
  }

  return NextResponse.json({ data: { seeded: results } }, { status: 201 })
}
