import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { extractText } from '@/lib/document-parser'
import { analyzeStyle } from '@/lib/ai/style-analyzer'
import { AnthropicClient } from '@/lib/ai/clients/anthropic-client'
import { OpenAIClient } from '@/lib/ai/clients/openai-client'
import type { LLMClient } from '@/lib/ai/clients/types'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const orgId = formData.get('org_id') as string | null

  if (!file || !orgId) {
    return NextResponse.json({ error: 'Fil och org_id krävs' }, { status: 400 })
  }

  // Validate membership
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Inte behörig' }, { status: 403 })
  }

  // Validate file
  const fileType = ALLOWED_TYPES[file.type]
  if (!fileType) {
    return NextResponse.json(
      { error: 'Filtypen stöds inte. Använd PDF, DOCX eller TXT.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Filen är för stor. Max 20 MB.' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  // Upload to Supabase Storage
  const filePath = `${orgId}/${Date.now()}-${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await admin.storage
    .from('reference-documents')
    .upload(filePath, buffer, { contentType: file.type })

  if (uploadError) {
    return NextResponse.json(
      { error: 'Kunde inte ladda upp filen' },
      { status: 500 }
    )
  }

  const { data: urlData } = admin.storage
    .from('reference-documents')
    .getPublicUrl(filePath)

  // Create reference_documents row
  const { data: refDoc, error: insertError } = await admin
    .from('reference_documents')
    .insert({
      org_id: orgId,
      uploaded_by: user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: fileType as 'pdf' | 'docx' | 'txt',
      file_size_bytes: file.size,
    })
    .select()
    .single()

  if (insertError || !refDoc) {
    return NextResponse.json(
      { error: 'Kunde inte spara referensdokument' },
      { status: 500 }
    )
  }

  // Extract text and analyze style
  try {
    const extractedText = await extractText(buffer, fileType)

    // Create LLM client
    let client: LLMClient
    if (process.env.ANTHROPIC_API_KEY) {
      client = new AnthropicClient(process.env.ANTHROPIC_API_KEY)
    } else if (process.env.OPENAI_API_KEY) {
      client = new OpenAIClient(process.env.OPENAI_API_KEY)
    } else {
      // Save without analysis
      return NextResponse.json({ data: refDoc })
    }

    const styleAnalysis = await analyzeStyle(client, extractedText)

    // Update reference document with analysis
    await admin
      .from('reference_documents')
      .update({
        style_analysis: styleAnalysis,
        is_analyzed: true,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', refDoc.id)

    // Update organization style_profile
    const { data: org } = await admin
      .from('organizations')
      .select('style_profile')
      .eq('id', orgId)
      .single()

    const currentProfile = (org?.style_profile as Record<string, unknown>) || {}
    await admin
      .from('organizations')
      .update({
        style_profile: {
          ...currentProfile,
          tonality: styleAnalysis.tonality || currentProfile.tonality,
          formality_score: styleAnalysis.formality_score || currentProfile.formality_score,
          vocabulary_level: styleAnalysis.vocabulary_level || currentProfile.vocabulary_level,
          active_voice_preference:
            styleAnalysis.active_voice_ratio !== undefined
              ? styleAnalysis.active_voice_ratio > 0.5
              : currentProfile.active_voice_preference,
        },
      })
      .eq('id', orgId)

    return NextResponse.json({
      data: { ...refDoc, style_analysis: styleAnalysis, is_analyzed: true },
    })
  } catch {
    // Return doc even if analysis fails
    return NextResponse.json({ data: refDoc })
  }
}
