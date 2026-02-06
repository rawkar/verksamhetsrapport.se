import { describe, it, expect } from 'vitest'
import { chunkContent } from '@/lib/ai/document-chunker'

describe('chunkContent', () => {
  it('returns single chunk for small content', () => {
    const content = {
      'Sammanfattning': 'Kort text',
      'Verksamhet': 'Mer text här',
    }
    const chunks = chunkContent(content)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toEqual(content)
  })

  it('returns original content as single chunk when empty', () => {
    const content = {}
    const chunks = chunkContent(content)
    expect(chunks).toHaveLength(1)
  })

  it('splits content when exceeding max tokens', () => {
    // Create content that exceeds a small token limit
    const content: Record<string, string> = {}
    for (let i = 0; i < 10; i++) {
      content[`Sektion ${i}`] = 'a'.repeat(500) // ~125 tokens each
    }
    // With maxTokensPerChunk=200, each section is ~125 tokens
    // so each chunk should hold ~1-2 sections
    const chunks = chunkContent(content, 0, 200)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('preserves all content across chunks', () => {
    const content: Record<string, string> = {
      'Avsnitt A': 'Text A',
      'Avsnitt B': 'Text B',
      'Avsnitt C': 'Text C',
    }
    const chunks = chunkContent(content, 0, 50)
    // All keys should appear in some chunk
    const allKeys = chunks.flatMap((c) => Object.keys(c))
    expect(allKeys).toContain('Avsnitt A')
    expect(allKeys).toContain('Avsnitt B')
    expect(allKeys).toContain('Avsnitt C')
  })

  it('handles system prompt token reservation', () => {
    const content: Record<string, string> = {
      'Sektion 1': 'a'.repeat(400),
      'Sektion 2': 'b'.repeat(400),
    }
    // With large system prompt overhead, should split more aggressively
    const chunksWithOverhead = chunkContent(content, 100, 200)
    const chunksWithout = chunkContent(content, 0, 200)
    expect(chunksWithOverhead.length).toBeGreaterThanOrEqual(chunksWithout.length)
  })

  it('splits large sections into parts', () => {
    // splitLargeSection splits on paragraph breaks (\n\n)
    const paragraphs = Array.from({ length: 20 }, (_, i) => `Stycke ${i}: ${'a'.repeat(100)}`).join('\n\n')
    const content = {
      'Stor sektion': paragraphs,
    }
    const chunks = chunkContent(content, 0, 100)
    expect(chunks.length).toBeGreaterThan(1)
    // Check that split sections have "(del X)" suffix
    const allKeys = chunks.flatMap((c) => Object.keys(c))
    expect(allKeys.some((k) => k.includes('del'))).toBeTruthy()
  })
})
