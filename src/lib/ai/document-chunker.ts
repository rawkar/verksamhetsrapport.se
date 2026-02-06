import { countTokens } from './token-counter'

const DEFAULT_MAX_TOKENS = 25000

export function chunkContent(
  contentObj: Record<string, string>,
  systemPromptTokens = 0,
  maxTokensPerChunk = DEFAULT_MAX_TOKENS
): Record<string, string>[] {
  const entries = Object.entries(contentObj)
  const chunks: Record<string, string>[] = []
  let currentChunk: Record<string, string> = {}
  let currentTokens = systemPromptTokens

  for (const [title, text] of entries) {
    const sectionText = `${title}:\n${text}`
    const sectionTokens = countTokens(sectionText)

    if (sectionTokens > maxTokensPerChunk) {
      if (Object.keys(currentChunk).length > 0) {
        chunks.push({ ...currentChunk })
        currentChunk = {}
        currentTokens = systemPromptTokens
      }
      chunks.push(...splitLargeSection(title, text, maxTokensPerChunk))
      continue
    }

    if (
      currentTokens + sectionTokens > maxTokensPerChunk &&
      Object.keys(currentChunk).length > 0
    ) {
      chunks.push({ ...currentChunk })
      currentChunk = {}
      currentTokens = systemPromptTokens
    }

    currentChunk[title] = text
    currentTokens += sectionTokens
  }

  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk)
  }

  return chunks.length > 0 ? chunks : [contentObj]
}

function splitLargeSection(
  title: string,
  text: string,
  maxTokensPerChunk: number
): Record<string, string>[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: Record<string, string>[] = []
  let currentText = ''
  let currentTokens = countTokens(title)

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph)

    if (currentTokens + paragraphTokens > maxTokensPerChunk && currentText) {
      chunks.push({ [`${title} (del ${chunks.length + 1})`]: currentText.trim() })
      currentText = ''
      currentTokens = countTokens(title)
    }

    currentText += paragraph + '\n\n'
    currentTokens += paragraphTokens
  }

  if (currentText) {
    chunks.push({ [`${title} (del ${chunks.length + 1})`]: currentText.trim() })
  }

  return chunks
}
