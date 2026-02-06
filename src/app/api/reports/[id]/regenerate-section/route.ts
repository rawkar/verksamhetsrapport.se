import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AnthropicClient } from '@/lib/ai/clients/anthropic-client'
import { OpenAIClient } from '@/lib/ai/clients/openai-client'
import type { LLMClient } from '@/lib/ai/clients/types'
import type { Organization, StyleProfile } from '@/types/database'

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
  const { section_id, feedback } = body as { section_id: string; feedback?: string }

  if (!section_id) {
    return NextResponse.json({ error: 'section_id krävs' }, { status: 400 })
  }

  // Get report
  const { data: report } = await admin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Rapport hittades inte' }, { status: 404 })
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
    .select('*')
    .eq('id', report.org_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organisation saknas' }, { status: 400 })
  }

  // Get section content
  const sectionsContent = report.sections_content as Record<string, { raw_input: string }>
  const sectionInput = sectionsContent[section_id]?.raw_input

  // Get template for section title
  let sectionTitle = section_id
  if (report.template_id) {
    const { data: template } = await admin
      .from('report_templates')
      .select('sections')
      .eq('id', report.template_id)
      .single()

    if (template?.sections) {
      const sections = template.sections as { id: string; title: string }[]
      const found = sections.find((s) => s.id === section_id)
      if (found) sectionTitle = found.title
    }
  }

  // Get generated content for this section from full output
  const generatedContent = report.generated_content as string | null

  // Create LLM client
  let client: LLMClient
  if (process.env.ANTHROPIC_API_KEY) {
    client = new AnthropicClient(process.env.ANTHROPIC_API_KEY)
  } else if (process.env.OPENAI_API_KEY) {
    client = new OpenAIClient(process.env.OPENAI_API_KEY)
  } else {
    return NextResponse.json({ error: 'Ingen AI API-nyckel konfigurerad' }, { status: 500 })
  }

  const organization = org as Organization
  const styleProfile = (organization.style_profile as StyleProfile) || {}

  const tonalityMap: Record<string, string> = {
    formal: 'formellt, sakligt',
    'semi-formal': 'professionellt men tillgängligt',
    conversational: 'varmt, engagerande',
  }
  const tonalityDesc = tonalityMap[styleProfile.tonality || 'semi-formal'] || 'professionellt'

  let systemPrompt = `Du är expert på att skriva professionella verksamhetsrapporter på svenska.
Du ska regenerera ETT avsnitt i en rapport för ${organization.name}.
Använd ${tonalityDesc} språk.
Behåll ALLA detaljer från originaltexten. Förkorta INTE.`

  if (feedback) {
    systemPrompt += `\n\nAnvändarens feedback: "${feedback}"\nAnpassa texten baserat på denna feedback.`
  }

  let userContent = `Avsnitt: ${sectionTitle}\n\n`
  if (sectionInput) {
    userContent += `ORIGINALTEXT (input):\n${sectionInput}\n\n`
  }
  if (generatedContent) {
    userContent += `NUVARANDE GENERERAD TEXT (förbättra denna):\n${generatedContent}\n\n`
  }
  userContent += `Skriv en förbättrad version av avsnittet "${sectionTitle}".`

  try {
    const result = await client.generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      { maxTokens: 8000, temperature: 0.7 }
    )

    // Log usage
    await admin.from('ai_usage_log').insert({
      org_id: report.org_id,
      report_id: reportId,
      user_id: user.id,
      action: 'regenerate_section',
      model: process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-5-20250929' : 'gpt-4o',
      tokens_input: result.usage.prompt_tokens,
      tokens_output: result.usage.completion_tokens,
    })

    return NextResponse.json({ content: result.content })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Regenerering misslyckades' },
      { status: 500 }
    )
  }
}
