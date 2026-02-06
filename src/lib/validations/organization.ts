import { z } from 'zod'

// Organisationstyper
export const orgTypeSchema = z.enum([
  'association',
  'foundation',
  'cooperative',
  'company',
  'municipality',
  'faith',
  'union',
  'other',
])

// Sektorer
export const sectorSchema = z.enum([
  'culture',
  'sports',
  'social',
  'education',
  'healthcare',
  'other',
])

// Tonalitet
export const tonalitySchema = z.enum(['formal', 'semi-formal', 'conversational'])

// Vokabulärnivå
export const vocabularyLevelSchema = z.enum(['simple', 'professional', 'academic'])

// Stilprofil
export const styleProfileSchema = z.object({
  tonality: tonalitySchema.optional(),
  formality_score: z.number().min(0).max(1).optional(),
  avg_sentence_length: z.number().positive().optional(),
  vocabulary_level: vocabularyLevelSchema.optional(),
  active_voice_preference: z.boolean().optional(),
  custom_instructions: z.string().max(2000, 'Anpassade instruktioner får inte överstiga 2 000 tecken').optional(),
  extracted_patterns: z.record(z.string(), z.unknown()).optional(),
})

// Skapa organisation
export const createOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisationsnamn krävs')
    .max(200, 'Organisationsnamnet får inte överstiga 200 tecken'),
  org_type: orgTypeSchema,
  sector: sectorSchema.optional(),
  description: z
    .string()
    .max(1000, 'Beskrivningen får inte överstiga 1 000 tecken')
    .optional(),
})

// Uppdatera organisation
export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisationsnamn krävs')
    .max(200, 'Organisationsnamnet får inte överstiga 200 tecken')
    .optional(),
  org_type: orgTypeSchema.optional(),
  sector: sectorSchema.optional(),
  description: z
    .string()
    .max(1000, 'Beskrivningen får inte överstiga 1 000 tecken')
    .optional(),
  style_profile: styleProfileSchema.optional(),
})

// Bjud in medlem
export const inviteMemberSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  role: z.enum(['admin', 'member']).default('member'),
})

// Ändra medlemsroll
export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
})

// Typer
export type OrgType = z.infer<typeof orgTypeSchema>
export type Sector = z.infer<typeof sectorSchema>
export type Tonality = z.infer<typeof tonalitySchema>
export type StyleProfile = z.infer<typeof styleProfileSchema>
export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
