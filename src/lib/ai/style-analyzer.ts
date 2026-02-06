import type { LLMClient } from './clients/types'
import type { StyleAnalysis } from '@/types/database'

const ANALYSIS_PROMPT = `Du är expert på att analysera skrivstil i svenska texter. Analysera följande text och extrahera detaljerade stilmönster. Texten är en verksamhetsberättelse/rapport från en organisation.

ANALYSERA OCH RETURNERA ENBART JSON (ingen annan text):

{
  "tonality": "formal" | "semi-formal" | "conversational",
  "formality_score": 0.0-1.0,
  "avg_sentence_length": <antal ord per mening>,
  "vocabulary_level": "simple" | "professional" | "academic",
  "active_voice_ratio": 0.0-1.0,
  "common_phrases": ["fras1", "fras2", ...],
  "section_transition_style": "beskrivning",
  "number_presentation": "beskrivning",
  "person_reference": "vi" | "organisationen" | "styrelsen" | "blandat",
  "tense_preference": "preteritum" | "presens" | "blandat",
  "paragraph_style": "korta stycken" | "långa stycken" | "blandade",
  "use_of_subheadings": true | false,
  "analysis_summary": "3-5 meningar som sammanfattar stilen"
}`

export async function analyzeStyle(
  client: LLMClient,
  text: string
): Promise<StyleAnalysis> {
  // Truncate to ~50k chars to stay within limits
  const truncated = text.length > 50000 ? text.slice(0, 50000) : text

  const result = await client.generateCompletion(
    [
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user', content: `TEXT ATT ANALYSERA:\n\n${truncated}` },
    ],
    { temperature: 0.3, maxTokens: 4000 }
  )

  // Extract JSON from response
  const jsonMatch = result.content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Kunde inte tolka stilanalys-resultat')
  }

  return JSON.parse(jsonMatch[0]) as StyleAnalysis
}
