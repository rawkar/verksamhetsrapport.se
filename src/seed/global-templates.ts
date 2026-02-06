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
    name: 'Arsberattelse - Forening',
    description:
      'Standardmall for foreningars arsberattelse med ordforandes forord, verksamhet, ekonomi och framtidsutsikter.',
    template_type: 'annual_report',
    is_default: true,
    is_global: true,
    sections: buildSections([
      {
        title: 'Ordforandes forord',
        level: 1,
        placeholder:
          'Vad vill ordforanden lyfta fram fran det gangna aret?',
      },
      {
        title: 'Om foreningen',
        level: 1,
        required: true,
        placeholder:
          'Foreningens andamal, medlemsantal, styrelsesammansattning...',
      },
      {
        title: 'Verksamheten under aret',
        level: 1,
        required: true,
        placeholder: 'Overgripande beskrivning av arets verksamhet...',
      },
      {
        title: 'Aktiviteter och evenemang',
        level: 2,
        parent: 'Verksamheten under aret',
        placeholder: 'Lista och beskriv arets aktiviteter...',
      },
      {
        title: 'Projekt och satsningar',
        level: 2,
        parent: 'Verksamheten under aret',
        placeholder: 'Pagaende och avslutade projekt...',
      },
      {
        title: 'Samarbeten och partnerskap',
        level: 2,
        parent: 'Verksamheten under aret',
        placeholder: 'Samarbeten med andra organisationer...',
      },
      {
        title: 'Ekonomi',
        level: 1,
        required: true,
        placeholder: 'Intakter, kostnader, resultat...',
      },
      {
        title: 'Medlemmar och engagemang',
        level: 1,
        placeholder: 'Medlemsutveckling, engagemang, volontarer...',
      },
      {
        title: 'Framtidsutsikter',
        level: 1,
        placeholder: 'Planer och mal for kommande ar',
      },
    ]),
  },
  {
    name: 'Verksamhetsberattelse - Stiftelse',
    description:
      'Mall for stiftelsers verksamhetsberattelse med fokus pa andamal, beviljade medel och forvaltning.',
    template_type: 'annual_report',
    is_default: true,
    is_global: true,
    sections: buildSections([
      {
        title: 'Styrelsens berattelse',
        level: 1,
        required: true,
        placeholder: 'Styrelsens sammanfattning av verksamhetsaret...',
      },
      {
        title: 'Andamal och verksamhet',
        level: 1,
        required: true,
        placeholder: 'Stiftelsens andamal och hur verksamheten uppfyllt det...',
      },
      {
        title: 'Beviljade medel och stod',
        level: 1,
        placeholder: 'Beviljade bidrag, stipendier, projekt...',
      },
      {
        title: 'Forvaltning och ekonomi',
        level: 1,
        required: true,
      },
      {
        title: 'Kapitalforvaltning',
        level: 2,
        parent: 'Forvaltning och ekonomi',
        placeholder: 'Avkastning, placeringar, strategi...',
      },
      {
        title: 'Resultat och stallning',
        level: 2,
        parent: 'Forvaltning och ekonomi',
        placeholder: 'Ekonomiskt resultat och balansstallning...',
      },
      {
        title: 'Styrelse och organisation',
        level: 1,
        required: true,
        placeholder: 'Styrelseledamoter, revisorer, kansli...',
      },
      {
        title: 'Vasentliga handelser',
        level: 1,
        placeholder: 'Viktiga handelser under aret...',
      },
      {
        title: 'Framtida utveckling',
        level: 1,
        placeholder: 'Planer och framtidsutsikter...',
      },
    ]),
  },
  {
    name: 'Halvarsrapport',
    description:
      'Generell halvarsrapport med sammanfattning, verksamhetsutveckling och ekonomisk oversikt.',
    template_type: 'semi_annual',
    is_default: true,
    is_global: true,
    sections: buildSections([
      {
        title: 'Sammanfattning',
        level: 1,
        required: true,
        placeholder: 'Sammanfatta halvaret i nagra stycken...',
        ai_instructions: 'Skriv en koncis sammanfattning pa max 300 ord.',
      },
      {
        title: 'Verksamhetens utveckling',
        level: 1,
        required: true,
        placeholder: 'Hur har verksamheten utvecklats under perioden?',
      },
      {
        title: 'Ekonomisk oversikt',
        level: 1,
        placeholder: 'Intakter, kostnader, budget vs utfall...',
      },
      {
        title: 'Personal och organisation',
        level: 1,
        placeholder: 'Personalforandringar, rekryteringar, organisation...',
      },
      {
        title: 'Viktiga handelser och beslut',
        level: 1,
        placeholder: 'Beslut, handelser och milstolpar...',
      },
      {
        title: 'Framatblick',
        level: 1,
        placeholder: 'Planer for resten av aret...',
      },
    ]),
  },
  {
    name: 'TRS Halvarsrapport',
    description:
      'Specifik mall for TRS halvarsrapport med detaljerade verksamhetsomraden.',
    template_type: 'semi_annual',
    is_default: false,
    is_global: true,
    sections: buildSections([
      { title: 'Sammanfattning fran vd', level: 1 },
      { title: 'In- och uttraden', level: 1 },
      { title: 'Verksamhetens utveckling', level: 1 },
      {
        title: 'Omstallningsstod',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      {
        title: 'Kompetensstod individ/anstallda',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      {
        title: 'Omstallning pa arbetsplatsen',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      {
        title: 'Forebyggande kompetensutveckling',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      {
        title: 'Kunskap om kompetens - stod till arbetsplatser',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      {
        title: 'Webbinarier',
        level: 2,
        parent: 'Verksamhetens utveckling',
      },
      { title: 'Digital utveckling och IT', level: 1 },
      { title: 'Kommunikation och okad kannedom', level: 1 },
      { title: 'Ekonomi och kapitalforvaltning', level: 1 },
      { title: 'HR, administration och organisation', level: 1 },
      { title: 'Styrelsearbete', level: 1 },
      { title: 'TRS partsrad', level: 1 },
      { title: 'Viktiga beslut och handelser', level: 1 },
      {
        title: 'Natverkande, omvarldsbevakning och representation',
        level: 1,
      },
      { title: 'Remisser', level: 1 },
      { title: 'Ovrigt', level: 1 },
    ]),
  },
]
