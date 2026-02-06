import type { Organization, ReportTemplate, StyleProfile, StyleAnalysis, TemplateSection } from '@/types/database'

export class PromptBuilder {
  static buildSystemPrompt(params: {
    organization: Organization
    template: ReportTemplate
    styleProfile: StyleProfile
    referenceAnalysis?: StyleAnalysis
  }): string {
    const { organization, template, styleProfile, referenceAnalysis } = params

    let prompt = `Du är expert på att skriva professionella verksamhetsrapporter på svenska.

Din uppgift är att omformulera och förbättra språket i underlaget så att det blir enhetligt och professionellt. Du ska ALDRIG korta ner eller sammanfatta innehållet.

ORGANISATION: ${organization.name}
TYP: ${this.getOrgTypeDescription(organization.org_type)}
SEKTOR: ${organization.sector || 'Ej specificerad'}
`

    prompt += this.buildTonalityInstructions(styleProfile)

    if (referenceAnalysis) {
      prompt += this.buildStyleInstructions(referenceAnalysis)
    }

    prompt += this.buildStructureInstructions(template)

    if (styleProfile.custom_instructions) {
      prompt += `\nANVÄNDARENS EGNA INSTRUKTIONER:\n${styleProfile.custom_instructions}\n`
    }

    prompt += `

KRITISKA REGLER:
- BEHÅLL HELA TEXTLÄNGDEN – varje avsnitt ska bli lika långt eller längre
- BEVARA ALLA DETALJER, namn, datum, procentsatser och specifika händelser
- INGA PÅHITT – lägg aldrig till information som inte finns i underlaget
- KONSISTENS – enhetlig ton och stil genom hela rapporten
- Skriv i aktiv form med korta, klara meningar

OUTPUT-KRAV:
- Komplett rapport i textformat med FULL detaljnivå
- Alla rubriker och underrubriker ska finnas med
- Färdig för direkt kopiering till dokumentmall`

    return prompt
  }

  static buildUserPrompt(
    contentText: string,
    chunkInfo?: { current: number; total: number }
  ): string {
    let chunkContext = ''

    if (chunkInfo) {
      chunkContext = `\nOBSERVERA: Detta är del ${chunkInfo.current} av ${chunkInfo.total} i ett större dokument.`
      if (chunkInfo.current === 1) {
        chunkContext += ' Detta är första delen – etablera struktur och ton.'
      } else if (chunkInfo.current === chunkInfo.total) {
        chunkContext += ' Detta är sista delen – avsluta rapporten professionellt.'
      } else {
        chunkContext += ' Detta är en mellendel – fortsätt med samma stil och struktur.'
      }
      chunkContext += '\n'
    }

    return `Förbättra språket i följande underlag till en komplett verksamhetsrapport:

${contentText}
${chunkContext}
VIKTIGT: Omformulera texten ovan med enhetligt, professionellt och samtalsnära språk. Behåll ALLA detaljer, exempel, namn, datum och specifik information. Din output ska vara lika lång eller längre än input. Sammanfatta INTE – förbättra endast språket och strukturen.`
  }

  private static getOrgTypeDescription(orgType: string): string {
    const map: Record<string, string> = {
      association: 'Ideell förening',
      foundation: 'Stiftelse',
      cooperative: 'Kooperativ',
      company: 'Företag',
      municipality: 'Kommunalt bolag',
      faith: 'Trossamfund',
      union: 'Fackförbund/branschorganisation',
      other: 'Organisation',
    }
    return map[orgType] || 'Organisation'
  }

  private static buildTonalityInstructions(style: StyleProfile): string {
    const map: Record<string, string> = {
      formal:
        'Använd ett formellt, sakligt språk. Skriv i tredje person ("styrelsen", "organisationen"). Undvik talspråk.',
      'semi-formal':
        'Använd ett professionellt men tillgängligt språk. "Vi"-form är acceptabelt. Tydligt och konkret utan att vara stelt.',
      conversational:
        'Använd ett varmt, engagerande språk. Skriv i vi-form. Korta meningar. Tillåt entusiasm men behåll professionalism.',
    }
    return `\nTONALITET: ${map[style.tonality || 'semi-formal'] || map['semi-formal']}\n`
  }

  private static buildStyleInstructions(analysis: StyleAnalysis): string {
    let instructions = '\nSTILANPASSNING BASERAT PÅ REFERENSDOKUMENT:\n'

    if (analysis.common_phrases && analysis.common_phrases.length > 0) {
      instructions += `- Återanvänd gärna dessa typiska uttryck: ${analysis.common_phrases.slice(0, 10).join(', ')}\n`
    }

    if (analysis.person_reference) {
      instructions += `- Referera till organisationen som: "${analysis.person_reference}"\n`
    }

    if (analysis.analysis_summary) {
      instructions += `- Övergripande stilbeskrivning: ${analysis.analysis_summary}\n`
    }

    return instructions
  }

  private static buildStructureInstructions(template: ReportTemplate): string {
    const sections = template.sections as TemplateSection[]
    let instructions = '\nRAPPORTSTRUKTUR:\n'

    sections.forEach((section, index) => {
      const prefix = section.level === 1 ? `${index + 1}.` : '  -'
      instructions += `${prefix} ${section.title}\n`
      if (section.ai_instructions) {
        instructions += `    [${section.ai_instructions}]\n`
      }
    })

    return instructions
  }
}
