import { z } from 'zod'

// Rapport-perioder
export const reportPeriodSchema = z.enum(['annual', 'h1', 'h2', 'q1', 'q2', 'q3', 'q4'])

// Rapport-status
export const reportStatusSchema = z.enum(['draft', 'generating', 'review', 'final'])

// Sektionsinnehåll
export const sectionContentSchema = z.object({
  raw_input: z.string().max(100000, 'Sektionsinnehållet får inte överstiga 100 000 tecken'),
  is_locked: z.boolean().optional(),
  last_edited: z.string().optional(),
})

// Sektionsinnehåll (hela objektet)
export const sectionsContentSchema = z.record(z.string(), sectionContentSchema)

// Skapa rapport
export const createReportSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel krävs')
    .max(200, 'Titeln får inte överstiga 200 tecken'),
  template_id: z.string().uuid('Ogiltig mall-ID'),
  report_year: z
    .number()
    .int()
    .min(2000, 'Årtalet måste vara 2000 eller senare')
    .max(2100, 'Årtalet får inte vara senare än 2100')
    .optional(),
  report_period: reportPeriodSchema.optional(),
})

// Uppdatera rapport
export const updateReportSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel krävs')
    .max(200, 'Titeln får inte överstiga 200 tecken')
    .optional(),
  report_year: z
    .number()
    .int()
    .min(2000)
    .max(2100)
    .optional(),
  report_period: reportPeriodSchema.optional(),
  status: reportStatusSchema.optional(),
})

// Autosave
export const autosaveSchema = z.object({
  sections_content: sectionsContentSchema,
})

// Regenerera sektion
export const regenerateSectionSchema = z.object({
  section_id: z.string().uuid('Ogiltig sektions-ID'),
  feedback: z.string().max(1000, 'Feedback får inte överstiga 1 000 tecken').optional(),
  adjustment: z.enum(['more_formal', 'less_formal', 'more_detail', 'shorter']).optional(),
})

// Export-format
export const exportSchema = z.object({
  format: z.enum(['pdf', 'docx', 'txt']),
})

// Typer
export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateReportInput = z.infer<typeof updateReportSchema>
export type AutosaveInput = z.infer<typeof autosaveSchema>
export type RegenerateSectionInput = z.infer<typeof regenerateSectionSchema>
export type ExportInput = z.infer<typeof exportSchema>
