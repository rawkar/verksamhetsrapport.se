function uuid() {
  return crypto.randomUUID()
}

export interface SeedTemplateSection {
  id: string
  title: string
  level: number
  description?: string
  placeholder?: string
  required?: boolean
  parent_id: string | null
  order: number
  ai_instructions?: string
}

export interface SeedTemplate {
  name: string
  description: string
  template_type: string
  sections: SeedTemplateSection[]
  is_default: boolean
  is_global: boolean
}

function buildSections(
  items: {
    title: string
    level: number
    required?: boolean
    placeholder?: string
    parent?: string
    ai_instructions?: string
  }[]
): SeedTemplateSection[] {
  const parentMap = new Map<string, string>()
  const sections: SeedTemplateSection[] = []

  items.forEach((item, index) => {
    const id = uuid()
    parentMap.set(item.title, id)

    sections.push({
      id,
      title: item.title,
      level: item.level,
      required: item.required || false,
      placeholder: item.placeholder,
      parent_id: item.parent ? parentMap.get(item.parent) || null : null,
      order: index,
      ai_instructions: item.ai_instructions,
    })
  })

  return sections
}

export const globalTemplates: SeedTemplate[] = [
  {
    name: 'Årsberättelse – Förening',
    description:
      'Komplett årsberättelse för ideella föreningar. Innehåller ordförandes förord, verksamhetsöversikt, ekonomi och framtidsplaner.',
    template_type: 'annual_report',
    is_default: true,
    is_global: true,
    sections: buildSections([
      {
        title: 'Ordförandes förord',
        level: 1,
        placeholder: 'Vad vill ordföranden lyfta fram från det gångna året?',
      },
      {
        title: 'Om föreningen',
        level: 1,
        required: true,
        placeholder: 'Föreningens ändamål, medlemsantal, styrelsesammansättning...',
      },
      {
        title: 'Verksamheten under året',
        level: 1,
        required: true,
        placeholder: 'Övergripande beskrivning av årets verksamhet...',
      },
      {
        title: 'Aktiviteter och evenemang',
        level: 2,
        parent: 'Verksamheten under året',
        placeholder: 'Lista och beskriv årets aktiviteter...',
      },
      {
        title: 'Projekt och satsningar',
        level: 2,
        parent: 'Verksamheten under året',
        placeholder: 'Pågående och avslutade projekt...',
      },
      {
        title: 'Samarbeten och partnerskap',
        level: 2,
        parent: 'Verksamheten under året',
        placeholder: 'Samarbeten med andra organisationer...',
      },
      {
        title: 'Ekonomi',
        level: 1,
        required: true,
        placeholder: 'Intäkter, kostnader, resultat...',
      },
      {
        title: 'Medlemmar och engagemang',
        level: 1,
        placeholder: 'Medlemsutveckling, engagemang, volontärer...',
      },
      {
        title: 'Framtidsutsikter',
        level: 1,
        placeholder: 'Planer och mål för kommande år',
      },
    ]),
  },
  {
    name: 'Verksamhetsberättelse – Stiftelse',
    description:
      'Formell verksamhetsberättelse anpassad för stiftelser med fokus på ändamål, beviljade medel och förvaltning.',
    template_type: 'annual_report',
    is_default: false,
    is_global: true,
    sections: buildSections([
      {
        title: 'Styrelsens berättelse',
        level: 1,
        required: true,
        placeholder: 'Styrelsens sammanfattning av verksamhetsåret...',
      },
      {
        title: 'Ändamål och verksamhet',
        level: 1,
        required: true,
        placeholder: 'Stiftelsens ändamål och hur verksamheten uppfyllt det...',
      },
      {
        title: 'Beviljade medel och stöd',
        level: 1,
        placeholder: 'Beviljade bidrag, stipendier, projekt...',
      },
      {
        title: 'Förvaltning och ekonomi',
        level: 1,
        required: true,
      },
      {
        title: 'Kapitalförvaltning',
        level: 2,
        parent: 'Förvaltning och ekonomi',
        placeholder: 'Avkastning, placeringar, strategi...',
      },
      {
        title: 'Resultat och ställning',
        level: 2,
        parent: 'Förvaltning och ekonomi',
        placeholder: 'Ekonomiskt resultat och balansställning...',
      },
      {
        title: 'Styrelse och organisation',
        level: 1,
        required: true,
        placeholder: 'Styrelseledamöter, revisorer, kansli...',
      },
      {
        title: 'Väsentliga händelser',
        level: 1,
        placeholder: 'Viktiga händelser under året...',
      },
      {
        title: 'Framtida utveckling',
        level: 1,
        placeholder: 'Planer och framtidsutsikter...',
      },
    ]),
  },
  {
    name: 'Halvårsrapport',
    description:
      'Kortare uppföljningsrapport för halvårsvis rapportering. Passar alla organisationstyper.',
    template_type: 'semi_annual',
    is_default: false,
    is_global: true,
    sections: buildSections([
      {
        title: 'Sammanfattning',
        level: 1,
        required: true,
        placeholder: 'Sammanfatta halvåret i några stycken...',
        ai_instructions: 'Skriv en koncis sammanfattning på max 300 ord.',
      },
      {
        title: 'Verksamhetens utveckling',
        level: 1,
        required: true,
        placeholder: 'Hur har verksamheten utvecklats under perioden?',
      },
      {
        title: 'Ekonomisk översikt',
        level: 1,
        placeholder: 'Intäkter, kostnader, budget vs utfall...',
      },
      {
        title: 'Personal och organisation',
        level: 1,
        placeholder: 'Personalförändringar, rekryteringar, organisation...',
      },
      {
        title: 'Viktiga händelser och beslut',
        level: 1,
        placeholder: 'Beslut, händelser och milstolpar...',
      },
      {
        title: 'Framåtblick',
        level: 1,
        placeholder: 'Planer för resten av året...',
      },
    ]),
  },
  {
    name: 'Verksamhetsplan',
    description:
      'Framåtblickande plan för kommande verksamhetsår. Mål, strategier och budget.',
    template_type: 'plan',
    is_default: false,
    is_global: true,
    sections: buildSections([
      {
        title: 'Vision och mål',
        level: 1,
        required: true,
        placeholder: 'Organisationens vision och övergripande mål för perioden...',
      },
      {
        title: 'Planerade aktiviteter',
        level: 1,
        required: true,
        placeholder: 'Vilka aktiviteter, projekt och insatser planeras?',
      },
      {
        title: 'Budget och resurser',
        level: 1,
        placeholder: 'Budgetram, finansiering, resursbehov...',
      },
      {
        title: 'Organisation och bemanning',
        level: 1,
        placeholder: 'Personalplanering, roller, ansvarsfördelning...',
      },
      {
        title: 'Risker och utmaningar',
        level: 1,
        placeholder: 'Identifierade risker och hur de ska hanteras...',
      },
      {
        title: 'Tidplan',
        level: 1,
        placeholder: 'Övergripande tidplan med milstolpar...',
      },
    ]),
  },
  {
    name: 'Styrelseberättelse',
    description:
      'Formell rapport om styrelsens arbete under året. Ofta en del av årsredovisningen.',
    template_type: 'board_report',
    is_default: false,
    is_global: true,
    sections: buildSections([
      {
        title: 'Styrelsens sammansättning',
        level: 1,
        required: true,
        placeholder: 'Ledamöter, suppleanter, ordförande, sekreterare...',
      },
      {
        title: 'Sammanträden och beslutsärenden',
        level: 1,
        required: true,
        placeholder: 'Antal möten, viktiga beslut som fattats...',
      },
      {
        title: 'Ekonomisk översikt',
        level: 1,
        placeholder: 'Ekonomiskt resultat, balansräkning, revision...',
      },
      {
        title: 'Väsentliga händelser',
        level: 1,
        placeholder: 'Viktiga händelser och förändringar under året...',
      },
      {
        title: 'Förslag till resultatdisposition',
        level: 1,
        placeholder: 'Styrelsens förslag gällande årets resultat...',
      },
    ]),
  },
  {
    name: 'Tom mall – Skapa egen',
    description:
      'Börja från scratch. Lägg till dina egna rubriker och sektioner.',
    template_type: 'custom',
    is_default: false,
    is_global: true,
    sections: [],
  },
]
