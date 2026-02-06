// Token counting with approximation fallback
// tiktoken has wasm issues with Turbopack, so we use dynamic import

let _encoder: { encode: (text: string) => { length: number } } | null = null
let _initAttempted = false

async function getEncoder() {
  if (_encoder) return _encoder
  if (_initAttempted) return null
  _initAttempted = true
  try {
    const { get_encoding } = await import('tiktoken')
    _encoder = get_encoding('cl100k_base')
    return _encoder
  } catch {
    return null
  }
}

// Synchronous version using approximation (1 token ≈ 4 chars)
export function countTokens(text: string): number {
  if (!text) return 0
  // Use cached encoder if already loaded
  if (_encoder) {
    try {
      const tokens = _encoder.encode(text)
      return tokens.length
    } catch {
      // fallback
    }
  }
  return Math.ceil(text.length / 4)
}

// Async version that tries tiktoken first
export async function countTokensAsync(text: string): Promise<number> {
  if (!text) return 0
  const encoder = await getEncoder()
  if (encoder) {
    try {
      const tokens = encoder.encode(text)
      return tokens.length
    } catch {
      // fallback
    }
  }
  return Math.ceil(text.length / 4)
}

export function countMessagesTokens(
  messages: { role: string; content: string }[]
): number {
  let total = 0
  for (const msg of messages) {
    total += 4
    total += countTokens(msg.role)
    total += countTokens(msg.content)
  }
  total += 2
  return total
}
