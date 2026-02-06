import type { Organization, ReportTemplate, StyleProfile, StyleAnalysis, TemplateSection } from '@/types/database'

export class PromptBuilder {
  static buildSystemPrompt(params: {
    organization: Organization
    template: ReportTemplate
    styleProfile: StyleProfile
    referenceAnalysis?: StyleAnalysis
  }): string {
    const { organization, template, styleProfile, referenceAnalysis } = params

    let prompt = `Du är expert på att skriva verksamhetsrapporter på svenska. Du skriver korrekt, sakligt och naturligt.

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
- BEVARA ALLA DETALJER – namn, datum, procentsatser, specifika händelser
- INGA PÅHITT – lägg aldrig till information som inte finns i underlaget
- KONSISTENS – enhetlig ton och stil genom hela rapporten
- Skriv i aktiv form med korta, klara meningar

STILREGLER (MYCKET VIKTIGT):
- VARIERA dina formuleringar. Använd ALDRIG samma övergångsord eller fras mer än 2 gånger i hela rapporten.
- Undvik helt följande typiska AI-formuleringar: "detta visar på", "detta är ett tydligt tecken", "detta understryker", "sammantaget visar", "det är glädjande", "mycket positiv utveckling", "det är värt att notera"
- Avsluta INTE varje stycke med en värderande eller sammanfattande mening. Låt fakta tala för sig själva.
- Var INTE överdrivet positiv. Beskriv saker sakligt. Skriv "ökade med 15 %" – inte "ökade med hela 15 %, vilket är mycket glädjande".
- Variera meningsbyggnaden. Börja inte varje stycke på samma sätt.
- Texten ska låta som om en erfaren kommunikatör har skrivit den – inte som en AI.
- Håll texten koncis. Skriv det som behövs, inte mer. Undvik utfyllnadsmeningar.

FORMATREGLER (KRITISKT – undvik AI-fingeravtryck):
- Använd INTE tankstreck (–) eller m-streck (—) förutom i undantagsfall där det verkligen tjänar texten. Använd kommatecken, kolon eller punkt istället.
- Använd INTE punktlistor om det inte rör sig om en faktisk uppräkning av 4+ distinkta poster. Skriv hellre löpande text. En rapport är inte en PowerPoint.
- Håll meningarna KORTA. Max 25–30 ord per mening som regel. Bryt upp långa meningar.
- Undvik meningar med mer än 2 kommatecken. Dela upp dem i flera meningar.
- Skriv i löpande text och sammanhängande stycken. Rubriker följs av prosa, inte av listor.

OUTPUT-KRAV:
- Komplett rapport i textformat
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
        chunkContext += ' Detta är sista delen – avsluta rapporten.'
      } else {
        chunkContext += ' Fortsätt med samma stil.'
      }
      chunkContext += '\n'
    }

    return `Skriv om följande underlag till en verksamhetsrapport:

${contentText}
${chunkContext}
VIKTIGT: Behåll ALLA detaljer, exempel, namn, datum och specifik information. Förbättra språk och struktur. Skriv sakligt och naturligt – undvik AI-mässiga formuleringar och överdriven positivitet. Variera övergångar och meningsbyggnad.`
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
