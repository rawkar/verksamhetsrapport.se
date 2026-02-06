import { countTokens } from './token-counter'
import { chunkContent } from './document-chunker'
import { PromptBuilder } from './prompt-builder'
import type { LLMClient } from './clients/types'
import type { Organization, ReportTemplate, StyleProfile, StyleAnalysis, SectionsContent } from '@/types/database'

export interface GenerationResult {
  content: string
  metadata: {
    model: string
    chunks: number
    totalTokens: number
    processingMethod: 'single_pass' | 'chunked' | 'chunked_with_coherence_pass'
    generationTimeMs: number
  }
}

export interface GenerationCallbacks {
  onProgress?: (step: string, current: number, total: number) => void
}

const MAX_SAFE_INPUT_TOKENS = 100000

export async function generateReport(params: {
  client: LLMClient
  organization: Organization
  template: ReportTemplate
  sectionsContent: SectionsContent
  styleProfile: StyleProfile
  referenceAnalysis?: StyleAnalysis
  model?: string
  callbacks?: GenerationCallbacks
}): Promise<GenerationResult> {
  const {
    client,
    organization,
    template,
    sectionsContent,
    styleProfile,
    referenceAnalysis,
    model,
    callbacks,
  } = params

  const startTime = Date.now()

  const systemPrompt = PromptBuilder.buildSystemPrompt({
    organization,
    template,
    styleProfile,
    referenceAnalysis,
  })

  // Convert sections to text
  const contentText = Object.entries(sectionsContent)
    .filter(([, sc]) => sc.raw_input?.trim())
    .map(([sectionId, sc]) => {
      const section = template.sections.find((s) => s.id === sectionId)
      const title = section?.title || sectionId
      return `${title}:\n${sc.raw_input}`
    })
    .join('\n\n')

  const systemTokens = countTokens(systemPrompt)
  const contentTokens = countTokens(contentText)
  const totalInputTokens = systemTokens + contentTokens

  const completionOptions = {
    model,
    maxTokens: 16000,
    temperature: 0.4,
  }

  if (totalInputTokens <= MAX_SAFE_INPUT_TOKENS) {
    // Single pass
    callbacks?.onProgress?.('Genererar rapport...', 1, 1)

    const userPrompt = PromptBuilder.buildUserPrompt(contentText)
    const result = await client.generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      completionOptions
    )

    return {
      content: result.content,
      metadata: {
        model: model || 'default',
        chunks: 1,
        totalTokens: result.usage.total_tokens,
        processingMethod: 'single_pass',
        generationTimeMs: Date.now() - startTime,
      },
    }
  }

  // Chunked processing
  const contentObj: Record<string, string> = {}
  for (const [sectionId, sc] of Object.entries(sectionsContent)) {
    if (!sc.raw_input?.trim()) continue
    const section = template.sections.find((s) => s.id === sectionId)
    contentObj[section?.title || sectionId] = sc.raw_input
  }

  const chunks = chunkContent(contentObj, systemTokens)
  const chunkResults: string[] = []
  let totalTokensUsed = 0

  for (let i = 0; i < chunks.length; i++) {
    callbacks?.onProgress?.(`Bearbetar del ${i + 1} av ${chunks.length}...`, i + 1, chunks.length)

    const chunkText = Object.entries(chunks[i])
      .map(([title, text]) => `${title}:\n${text}`)
      .join('\n\n')

    const userPrompt = PromptBuilder.buildUserPrompt(chunkText, {
      current: i + 1,
      total: chunks.length,
    })

    const result = await client.generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      completionOptions
    )

    chunkResults.push(result.content)
    totalTokensUsed += result.usage.total_tokens

    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  let finalContent = chunkResults.join('\n\n---\n\n')
  let processingMethod: GenerationResult['metadata']['processingMethod'] = 'chunked'

  // Coherence pass for 3+ chunks
  if (chunks.length > 2) {
    callbacks?.onProgress?.('Slutgiltig sammanslagning...', chunks.length, chunks.length)

    try {
      const coherencePrompt = `Du har fått en rapport som genererats i flera delar. Säkerställ att rapporten är sammanhängande och professionell.

VIKTIGT:
- Behåll ALLT innehåll
- Ta bort eventuella dupliceringar mellan delarna
- Säkerställ smidiga övergångar
- Kontrollera konsekvent numrering

Rapport:

${finalContent}`

      const coherenceResult = await client.generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: coherencePrompt },
        ],
        { ...completionOptions, temperature: 0.5 }
      )

      finalContent = coherenceResult.content
      totalTokensUsed += coherenceResult.usage.total_tokens
      processingMethod = 'chunked_with_coherence_pass'
    } catch {
      // If coherence pass fails, use combined chunks
    }
  }

  return {
    content: finalContent,
    metadata: {
      model: model || 'default',
      chunks: chunks.length,
      totalTokens: totalTokensUsed,
      processingMethod,
      generationTimeMs: Date.now() - startTime,
    },
  }
}
