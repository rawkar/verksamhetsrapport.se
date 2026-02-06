import { describe, it, expect } from 'vitest'
import { createReportSchema, autosaveSchema, exportSchema } from '@/lib/validations/report'
import { createOrgSchema, orgTypeSchema, sectorSchema } from '@/lib/validations/organization'

describe('createReportSchema', () => {
  it('validates a correct report input', () => {
    const result = createReportSchema.safeParse({
      title: 'Verksamhetsberättelse 2025',
      template_id: '550e8400-e29b-41d4-a716-446655440000',
      report_year: 2025,
      report_period: 'annual',
    })
    expect(result.success).toBe(true)
  })

  it('requires title', () => {
    const result = createReportSchema.safeParse({
      title: '',
      template_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title over 200 characters', () => {
    const result = createReportSchema.safeParse({
      title: 'a'.repeat(201),
      template_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })

  it('requires valid UUID for template_id', () => {
    const result = createReportSchema.safeParse({
      title: 'Test',
      template_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('allows optional year and period', () => {
    const result = createReportSchema.safeParse({
      title: 'Test',
      template_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid period', () => {
    const result = createReportSchema.safeParse({
      title: 'Test',
      template_id: '550e8400-e29b-41d4-a716-446655440000',
      report_period: 'monthly',
    })
    expect(result.success).toBe(false)
  })
})

describe('autosaveSchema', () => {
  it('validates correct autosave input', () => {
    const result = autosaveSchema.safeParse({
      sections_content: {
        'section-1': { raw_input: 'Lite text', is_locked: false },
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects content exceeding max length', () => {
    const result = autosaveSchema.safeParse({
      sections_content: {
        'section-1': { raw_input: 'a'.repeat(100001) },
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('exportSchema', () => {
  it('accepts pdf format', () => {
    expect(exportSchema.safeParse({ format: 'pdf' }).success).toBe(true)
  })

  it('accepts txt format', () => {
    expect(exportSchema.safeParse({ format: 'txt' }).success).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(exportSchema.safeParse({ format: 'html' }).success).toBe(false)
  })
})

describe('createOrgSchema', () => {
  it('validates correct org input', () => {
    const result = createOrgSchema.safeParse({
      name: 'Testföreningen',
      org_type: 'association',
      sector: 'culture',
    })
    expect(result.success).toBe(true)
  })

  it('requires name', () => {
    const result = createOrgSchema.safeParse({
      name: '',
      org_type: 'association',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid org_type', () => {
    const result = createOrgSchema.safeParse({
      name: 'Test',
      org_type: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })

  it('allows all valid org types', () => {
    const types = ['association', 'foundation', 'cooperative', 'company', 'municipality', 'faith', 'union', 'other']
    for (const type of types) {
      const result = orgTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    }
  })

  it('allows all valid sectors', () => {
    const sectors = ['culture', 'sports', 'social', 'education', 'healthcare', 'other']
    for (const sector of sectors) {
      const result = sectorSchema.safeParse(sector)
      expect(result.success).toBe(true)
    }
  })
})
