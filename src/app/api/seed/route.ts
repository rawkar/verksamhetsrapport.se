import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { globalTemplates } from '@/seed/global-templates'
import { NextResponse } from 'next/server'

// POST /api/seed – Ladda in globala mallar (kör bara en gång)
export async function POST() {
  // Kontrollera om globala mallar redan finns
  const { data: existing } = await getSupabaseAdmin()
    .from('report_templates')
    .select('id')
    .eq('is_global', true)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({
      data: { message: 'Globala mallar finns redan', skipped: true },
    })
  }

  const results = []

  for (const template of globalTemplates) {
    const { data, error } = await getSupabaseAdmin()
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
