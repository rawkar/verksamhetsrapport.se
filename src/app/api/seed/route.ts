import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { globalTemplates } from '@/seed/global-templates'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/seed – Ladda in globala mallar (force=true uppdaterar befintliga)
export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    if (force) {
      // Hämta befintliga globala mallar
      const { data: existing } = await admin
        .from('report_templates')
        .select('id, name')
        .eq('is_global', true)

      const existingMap = new Map(
        (existing || []).map((t) => [t.name, t.id])
      )

      const results = []

      for (const template of globalTemplates) {
        // Kolla om en mall med exakt samma namn redan finns (med eller utan å/ä/ö)
        // Matcha på template_type + is_global istället
        const matchingId = existingMap.get(template.name)

        if (matchingId) {
          // Uppdatera befintlig mall
          const { data, error } = await admin
            .from('report_templates')
            .update({
              name: template.name,
              description: template.description,
              template_type: template.template_type,
              sections: template.sections,
              is_default: template.is_default,
            })
            .eq('id', matchingId)
            .select()
            .single()

          if (error) {
            results.push({ name: template.name, action: 'update', error: error.message })
          } else {
            results.push({ name: template.name, action: 'updated', id: data.id })
          }
        } else {
          // Försök hitta via template_type (gamla namn utan å/ä/ö)
          const { data: byType } = await admin
            .from('report_templates')
            .select('id')
            .eq('template_type', template.template_type)
            .eq('is_global', true)
            .limit(1)
            .single()

          if (byType) {
            const { data, error } = await admin
              .from('report_templates')
              .update({
                name: template.name,
                description: template.description,
                sections: template.sections,
                is_default: template.is_default,
              })
              .eq('id', byType.id)
              .select()
              .single()

            if (error) {
              results.push({ name: template.name, action: 'update-by-type', error: error.message })
            } else {
              results.push({ name: template.name, action: 'updated-by-type', id: data.id })
            }
          } else {
            // Ny mall – skapa
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
              results.push({ name: template.name, action: 'insert', error: error.message })
            } else {
              results.push({ name: template.name, action: 'created', id: data.id })
            }
          }
        }
      }

      return NextResponse.json({ data: { seeded: results } })
    }

    // Utan force: skapa bara om inga globala mallar finns
    const { data: existing } = await admin
      .from('report_templates')
      .select('id')
      .eq('is_global', true)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        data: {
          message: 'Globala mallar finns redan. Använd ?force=true för att uppdatera.',
          skipped: true,
        },
      })
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
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json(
      { error: 'Seed misslyckades: ' + (err as Error).message },
      { status: 500 }
    )
  }
}
