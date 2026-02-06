import { describe, it, expect } from 'vitest'
import { canExportPDF } from '@/lib/subscription-guard'

describe('canExportPDF', () => {
  it('returns false for free plan', () => {
    expect(canExportPDF('free')).toBe(false)
  })

  it('returns true for bas plan', () => {
    expect(canExportPDF('bas')).toBe(true)
  })

  it('returns true for pro plan', () => {
    expect(canExportPDF('pro')).toBe(true)
  })

  it('returns true for enterprise plan', () => {
    expect(canExportPDF('enterprise')).toBe(true)
  })
})
