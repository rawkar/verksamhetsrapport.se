import { z } from 'zod'

// Malltyper
export const templateTypeSchema = z.enum([
  'annual_report',
  'semi_annual',
  'activity_plan',
  'board_report',
  'custom',
])

// Mallsektion
export const templateSectionSchema = z.object({
  id: z.string().uuid('Ogiltig sektions-ID'),
  title: z
    .string()
    .min(1, 'Sektionstitel krävs')
    .max(200, 'Sektionstitel får inte överstiga 200 tecken'),
  level: z.number().int().min(1).max(3),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(500).optional(),
  required: z.boolean().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order: z.number().int().min(0),
  ai_instructions: z.string().max(1000).optional(),
})

// Skapa mall
export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Mallnamn krävs')
    .max(200, 'Mallnamnet får inte överstiga 200 tecken'),
  description: z.string().max(500, 'Beskrivningen får inte överstiga 500 tecken').optional(),
  template_type: templateTypeSchema,
  sections: z.array(templateSectionSchema).min(1, 'Minst en sektion krävs'),
})

// Uppdatera mall
export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Mallnamn krävs')
    .max(200, 'Mallnamnet får inte överstiga 200 tecken')
    .optional(),
  description: z.string().max(500).optional(),
  template_type: templateTypeSchema.optional(),
  sections: z.array(templateSectionSchema).optional(),
})

// Lägg till sektion
export const addSectionSchema = z.object({
  title: z
    .string()
    .min(1, 'Sektionstitel krävs')
    .max(200, 'Sektionstitel får inte överstiga 200 tecken'),
  level: z.number().int().min(1).max(3).default(1),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(500).optional(),
  required: z.boolean().default(false),
  parent_id: z.string().uuid().nullable().optional(),
  ai_instructions: z.string().max(1000).optional(),
  insert_after: z.string().uuid().optional(), // ID för sektion att infoga efter
})

// Uppdatera sektion
export const updateSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  level: z.number().int().min(1).max(3).optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(500).optional(),
  required: z.boolean().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order: z.number().int().min(0).optional(),
  ai_instructions: z.string().max(1000).optional(),
})

// Typer
export type TemplateType = z.infer<typeof templateTypeSchema>
export type TemplateSection = z.infer<typeof templateSectionSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type AddSectionInput = z.infer<typeof addSectionSchema>
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>
