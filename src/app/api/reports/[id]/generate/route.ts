import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AnthropicClient } from '@/lib/ai/clients/anthropic-client'
import { OpenAIClient } from '@/lib/ai/clients/openai-client'
import { generateReport } from '@/lib/ai/report-generator'
import { checkReportLimit } from '@/lib/subscription-guard'
import type { LLMClient } from '@/lib/ai/clients/types'
import type {
  Organization,
  ReportTemplate,
  SectionsContent,
  StyleProfile,
  StyleAnalysis,
} from '@/types/database'

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

  const body = await request.json()
  const sectionsContent: SectionsContent = body.sections_content
  const customInstructions: string | undefined = body.custom_instructions

  // Get report
  const { data: report } = await supabase
    .from('reports')
    .select('*')
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

  // Get org and template
  const [orgRes, templateRes] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', report.org_id).single(),
    report.template_id
      ? supabase.from('report_templates').select('*').eq('id', report.template_id).single()
      : Promise.resolve({ data: null }),
  ])

  const organization = orgRes.data as Organization | null
  const template = templateRes.data as ReportTemplate | null

  if (!organization || !template) {
    return NextResponse.json({ error: 'Organisation eller mall saknas' }, { status: 400 })
  }

  // Check subscription limit
  const limit = await checkReportLimit(report.org_id)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Rapportgränsen nådd (${limit.plan}-plan). Uppgradera för att generera fler rapporter.`,
        remaining: limit.remaining,
        plan: limit.plan,
      },
      { status: 403 }
    )
  }

  // Update status to generating
  await supabase.from('reports').update({ status: 'generating' }).eq('id', reportId)

  // Create LLM client
  let client: LLMClient
  let modelName: string

  if (process.env.ANTHROPIC_API_KEY) {
    client = new AnthropicClient(process.env.ANTHROPIC_API_KEY)
    modelName = 'claude-sonnet-4-5-20250929'
  } else if (process.env.OPENAI_API_KEY) {
    client = new OpenAIClient(process.env.OPENAI_API_KEY)
    modelName = 'gpt-4o'
  } else {
    await supabase.from('reports').update({ status: 'draft' }).eq('id', reportId)
    return NextResponse.json({ error: 'Ingen AI API-nyckel konfigurerad' }, { status: 500 })
  }

  try {
    const styleProfile: StyleProfile = {
      ...((organization.style_profile as StyleProfile) || {}),
      ...(customInstructions ? { custom_instructions: customInstructions } : {}),
    }

    // Fetch latest analyzed reference document for style
    const { data: refDocs } = await supabase
      .from('reference_documents')
      .select('style_analysis')
      .eq('org_id', report.org_id)
      .eq('is_analyzed', true)
      .order('analyzed_at', { ascending: false })
      .limit(1)

    const referenceAnalysis = refDocs?.[0]?.style_analysis as StyleAnalysis | undefined

    const result = await generateReport({
      client,
      organization,
      template,
      sectionsContent,
      styleProfile,
      referenceAnalysis: referenceAnalysis || undefined,
      model: modelName,
    })

    // Save result
    await supabase
      .from('reports')
      .update({
        status: 'review',
        sections_content: sectionsContent,
        generated_content: result.content,
        generation_metadata: {
          model: result.metadata.model,
          tokens_used: result.metadata.totalTokens,
          chunks: result.metadata.chunks,
          processing_method: result.metadata.processingMethod,
          generated_at: new Date().toISOString(),
          generation_time_ms: result.metadata.generationTimeMs,
        },
      })
      .eq('id', reportId)

    // Auto-save version snapshot
    const { data: latestVersion } = await supabase
      .from('report_versions')
      .select('version_number')
      .eq('report_id', reportId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    await supabase.from('report_versions').insert({
      report_id: reportId,
      version_number: (latestVersion?.version_number || 0) + 1,
      sections_content: sectionsContent,
      generated_content: result.content,
      created_by: user.id,
    })

    // Increment reports used
    await supabase
      .from('organizations')
      .update({ reports_used_this_year: (organization.reports_used_this_year || 0) + 1 })
      .eq('id', report.org_id)

    // Log AI usage
    await supabase.from('ai_usage_log').insert({
      org_id: report.org_id,
      report_id: reportId,
      user_id: user.id,
      action: 'generate_report',
      model: result.metadata.model,
      tokens_input: Math.round(result.metadata.totalTokens * 0.6),
      tokens_output: Math.round(result.metadata.totalTokens * 0.4),
      duration_ms: result.metadata.generationTimeMs,
    })

    return NextResponse.json({
      content: result.content,
      metadata: result.metadata,
    })
  } catch (err) {
    await supabase.from('reports').update({ status: 'draft' }).eq('id', reportId)
    return NextResponse.json(
      { error: (err as Error).message || 'Generering misslyckades' },
      { status: 500 }
    )
  }
}
