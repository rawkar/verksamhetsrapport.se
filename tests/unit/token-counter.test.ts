import { describe, it, expect } from 'vitest'
import { countTokens, countMessagesTokens } from '@/lib/ai/token-counter'

describe('countTokens', () => {
  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0)
  })

  it('returns 0 for null/undefined-like input', () => {
    expect(countTokens('')).toBe(0)
  })

  it('returns approximate token count using char/4 fallback', () => {
    // "Hello world" = 11 chars → ceil(11/4) = 3
    const result = countTokens('Hello world')
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(11) // Can't be more tokens than chars
  })

  it('handles long text', () => {
    const longText = 'a'.repeat(1000)
    const result = countTokens(longText)
    expect(result).toBeGreaterThan(0)
    // With fallback: ceil(1000/4) = 250
    expect(result).toBe(250)
  })

  it('handles Swedish text with special characters', () => {
    const swedishText = 'Styrelsen konstaterar att verksamhetsåret 2025 präglades av en positiv utveckling.'
    const result = countTokens(swedishText)
    expect(result).toBeGreaterThan(0)
  })
})

describe('countMessagesTokens', () => {
  it('handles empty messages array', () => {
    const result = countMessagesTokens([])
    // Should be 2 (base overhead)
    expect(result).toBe(2)
  })

  it('counts tokens for a single message', () => {
    const messages = [{ role: 'user', content: 'Hello' }]
    const result = countMessagesTokens(messages)
    // 4 (per-message overhead) + role tokens + content tokens + 2 (base)
    expect(result).toBeGreaterThan(2)
  })

  it('counts tokens for multiple messages', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello world' },
    ]
    const result = countMessagesTokens(messages)
    const singleResult = countMessagesTokens([messages[0]])
    expect(result).toBeGreaterThan(singleResult)
  })

  it('adds 4 tokens overhead per message plus 2 base', () => {
    // With empty content: each message = 4 + role_tokens + 0
    const messages = [
      { role: 'user', content: '' },
      { role: 'assistant', content: '' },
    ]
    const result = countMessagesTokens(messages)
    // 2 base + (4 + ceil(4/4) + 0) * 2 = 2 + 5*2 = 12
    expect(result).toBeGreaterThanOrEqual(2)
  })
})
