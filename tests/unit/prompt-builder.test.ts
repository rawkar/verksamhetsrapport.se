import { describe, it, expect } from 'vitest'
import { PromptBuilder } from '@/lib/ai/prompt-builder'
import type { Organization, ReportTemplate, StyleProfile, StyleAnalysis } from '@/types/database'

function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    name: 'Testföreningen',
    slug: 'testforeningen',
    org_type: 'association',
    sector: 'culture',
    description: null,
    logo_url: null,
    style_profile: {},
    stripe_customer_id: null,
    subscription_plan: 'free',
    subscription_status: 'active',
    reports_used_this_year: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  } as Organization
}

function makeTemplate(overrides: Partial<ReportTemplate> = {}): ReportTemplate {
  return {
    id: 'tpl-1',
    org_id: null,
    name: 'Testmall',
    description: null,
    template_type: 'annual_report',
    sections: [
      { id: '1', title: 'Sammanfattning', level: 1, required: true, order: 0 },
      { id: '2', title: 'Verksamhet', level: 1, required: true, order: 1 },
    ],
    is_default: false,
    is_global: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  } as ReportTemplate
}

describe('PromptBuilder.buildSystemPrompt', () => {
  it('includes organization name', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg({ name: 'Min Organisation' }),
      template: makeTemplate(),
      styleProfile: { tonality: 'semi-formal' },
    })
    expect(prompt).toContain('Min Organisation')
  })

  it('includes org type description', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg({ org_type: 'foundation' }),
      template: makeTemplate(),
      styleProfile: { tonality: 'formal' },
    })
    expect(prompt).toContain('Stiftelse')
  })

  it('applies formal tonality instructions', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: { tonality: 'formal' },
    })
    expect(prompt).toContain('formellt')
  })

  it('applies conversational tonality instructions', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: { tonality: 'conversational' },
    })
    expect(prompt).toContain('engagerande')
  })

  it('defaults to semi-formal when tonality is missing', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: {},
    })
    expect(prompt).toContain('professionellt men tillgängligt')
  })

  it('includes section structure from template', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: { tonality: 'semi-formal' },
    })
    expect(prompt).toContain('Sammanfattning')
    expect(prompt).toContain('Verksamhet')
  })

  it('includes reference analysis when provided', () => {
    const analysis: StyleAnalysis = {
      tonality: 'formal',
      formality_score: 0.8,
      common_phrases: ['under verksamhetsåret', 'styrelsen beslutade'],
      person_reference: 'vi',
      analysis_summary: 'Formell stil med vi-form.',
    }
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: { tonality: 'semi-formal' },
      referenceAnalysis: analysis,
    })
    expect(prompt).toContain('under verksamhetsåret')
    expect(prompt).toContain('Formell stil med vi-form')
  })

  it('includes custom instructions when provided', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: {
        tonality: 'semi-formal',
        custom_instructions: 'Använd alltid vi-form och undvik passiv form.',
      },
    })
    expect(prompt).toContain('ANVÄNDARENS EGNA INSTRUKTIONER')
    expect(prompt).toContain('Använd alltid vi-form')
  })

  it('includes critical rules', () => {
    const prompt = PromptBuilder.buildSystemPrompt({
      organization: makeOrg(),
      template: makeTemplate(),
      styleProfile: { tonality: 'semi-formal' },
    })
    expect(prompt).toContain('KRITISKA REGLER')
    expect(prompt).toContain('INGA PÅHITT')
  })
})

describe('PromptBuilder.buildUserPrompt', () => {
  it('includes the content text', () => {
    const prompt = PromptBuilder.buildUserPrompt('Här är vårt underlag för rapporten.')
    expect(prompt).toContain('Här är vårt underlag')
  })

  it('includes chunk info when provided', () => {
    const prompt = PromptBuilder.buildUserPrompt('Text', { current: 1, total: 3 })
    expect(prompt).toContain('del 1 av 3')
    expect(prompt).toContain('första delen')
  })

  it('describes last chunk', () => {
    const prompt = PromptBuilder.buildUserPrompt('Text', { current: 3, total: 3 })
    expect(prompt).toContain('sista delen')
  })

  it('describes middle chunks', () => {
    const prompt = PromptBuilder.buildUserPrompt('Text', { current: 2, total: 3 })
    expect(prompt).toContain('mellendel')
  })
})
