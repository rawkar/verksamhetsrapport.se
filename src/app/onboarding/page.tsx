'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Building2,
  Users,
  Landmark,
  Briefcase,
  Church,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Handshake,
  Factory,
  SkipForward,
} from 'lucide-react'
import ReferenceUploader from '@/components/report/ReferenceUploader'

// Organisationstyper med ikoner och etiketter
const ORG_TYPES = [
  { value: 'association', label: 'Forening', icon: Users, description: 'Ideell eller ekonomisk forening' },
  { value: 'foundation', label: 'Stiftelse', icon: Landmark, description: 'Stiftelse med angivet andamal' },
  { value: 'cooperative', label: 'Kooperativ', icon: Handshake, description: 'Ekonomisk forening / kooperativ' },
  { value: 'company', label: 'Foretag', icon: Briefcase, description: 'Aktiebolag, handelsbolag etc.' },
  { value: 'municipality', label: 'Kommun / Myndighet', icon: Building2, description: 'Kommunalt bolag eller myndighet' },
  { value: 'faith', label: 'Trossamfund', icon: Church, description: 'Kyrka, moske eller annat samfund' },
  { value: 'union', label: 'Fackforbund / Branschorg.', icon: Factory, description: 'Fackforbund eller arbetsgivarorganisation' },
  { value: 'other', label: 'Annat', icon: HelpCircle, description: 'Annan typ av organisation' },
] as const

const SECTORS = [
  { value: 'culture', label: 'Kultur & fritid' },
  { value: 'sports', label: 'Idrott' },
  { value: 'social', label: 'Social omsorg' },
  { value: 'education', label: 'Utbildning' },
  { value: 'healthcare', label: 'Halso- & sjukvard' },
  { value: 'other', label: 'Annat' },
] as const

const TONALITY_EXAMPLES = [
  {
    value: 'formal',
    label: 'Formell',
    score: 0.9,
    example:
      'Styrelsen konstaterar att verksamhetsaret 2025 praglade av en positiv utveckling. Organisationens verksamhet har bedrivits i enlighet med stadgarna och de av arsmoted beslutade riktlinjerna.',
  },
  {
    value: 'semi-formal',
    label: 'Semi-formell',
    score: 0.5,
    example:
      'Under 2025 har vi sett en positiv utveckling pa flera omraden. Vi har fortsatt att arbeta mot vara uppsatta mal och ar nojda med de resultat vi uppnatt under aret.',
  },
  {
    value: 'conversational',
    label: 'Vardaglig',
    score: 0.2,
    example:
      'Vi har haft ett fantastiskt ar! Med massor av roliga aktiviteter, nya samarbeten och engagerade medlemmar har vi verkligen tagit stora steg framat.',
  },
] as const

interface OnboardingState {
  step: number
  orgType: string
  sector: string
  name: string
  description: string
  tonality: string
  formalityScore: number
  referenceUploaded: boolean
  selectedTemplate: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Array<{
    id: string
    name: string
    description: string | null
    template_type: string
    sections: Array<{ title: string; level: number }>
  }>>([])

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

  const [state, setState] = useState<OnboardingState>({
    step: 1,
    orgType: '',
    sector: '',
    name: '',
    description: '',
    tonality: 'semi-formal',
    formalityScore: 0.5,
    referenceUploaded: false,
    selectedTemplate: null,
  })

  const totalSteps = 5

  const updateState = (updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }))
    setError(null)
  }

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return !!state.orgType
      case 2:
        return state.name.trim().length > 0
      case 3:
        return !!state.tonality
      case 4:
        return true // Referensdokument ar valfritt
      case 5:
        return true // Mall ar valfritt, vi valjer default
      default:
        return false
    }
  }

  const loadTemplates = async () => {
    const res = await fetch('/api/templates')
    if (res.ok) {
      const json = await res.json()
      setTemplates(json.data || [])
    }
  }

  const handleNext = async () => {
    if (state.step === 3 && !createdOrgId) {
      // Skapa organisationen innan steg 4 (referensuppladdning behover org_id)
      setIsSubmitting(true)
      try {
        const orgRes = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.name,
            org_type: state.orgType,
            sector: state.sector || undefined,
            description: state.description || undefined,
            style_profile: {
              tonality: state.tonality,
              formality_score: state.formalityScore,
            },
          }),
        })

        if (!orgRes.ok) {
          const errData = await orgRes.json()
          throw new Error(errData.error?.message || 'Kunde inte skapa organisation')
        }

        const { data: org } = await orgRes.json()
        setCreatedOrgId(org.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nagot gick fel')
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
    }

    if (state.step === 4) {
      // Ladda mallar innan steg 5
      await loadTemplates()
    }

    if (state.step < totalSteps) {
      updateState({ step: state.step + 1 })
    } else {
      await handleSubmit()
    }
  }

  const handleBack = () => {
    if (state.step > 1) {
      updateState({ step: state.step - 1 })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const orgId = createdOrgId
      if (!orgId) {
        throw new Error('Organisation saknas. Gå tillbaka och försök igen.')
      }

      // Om en mall ar vald, skapa en kopia for organisationen
      if (state.selectedTemplate) {
        const selectedTemplate = templates.find((t) => t.id === state.selectedTemplate)
        if (selectedTemplate) {
          await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              org_id: orgId,
              name: selectedTemplate.name,
              description: selectedTemplate.description,
              template_type: selectedTemplate.template_type,
              sections: selectedTemplate.sections,
            }),
          })
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nagot gick fel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">Verksamhetsrapport.se</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < state.step
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          Steg {state.step} av {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Steg 1: Organisationstyp */}
        {state.step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2">Vilken typ av organisation ar ni?</h2>
            <p className="text-[var(--foreground-secondary)] mb-8">
              Vi anpassar mallar och sprak efter er organisationstyp.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {ORG_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = state.orgType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => updateState({ orgType: type.value })}
                    className={`card p-4 text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[rgba(24,75,101,0.03)]'
                        : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'gradient-primary text-white'
                          : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {type.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-[var(--color-primary)] ml-auto flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Sektor */}
            {state.orgType && (
              <div className="mt-8 animate-slideUp">
                <h3 className="text-lg font-semibold mb-3">Vilken sektor?</h3>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector.value}
                      onClick={() =>
                        updateState({
                          sector:
                            state.sector === sector.value ? '' : sector.value,
                        })
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        state.sector === sector.value
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {sector.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Steg 2: Grunduppgifter */}
        {state.step === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2">Beskriv er organisation</h2>
            <p className="text-[var(--foreground-secondary)] mb-8">
              Vi anvander detta for att anpassa era rapporter.
            </p>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="org-name"
                  className="block text-sm font-medium mb-2"
                >
                  Organisationens namn *
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={state.name}
                  onChange={(e) => updateState({ name: e.target.value })}
                  placeholder="T.ex. Lunds Kulturforening"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="org-desc"
                  className="block text-sm font-medium mb-2"
                >
                  Kort beskrivning (valfritt)
                </label>
                <textarea
                  id="org-desc"
                  value={state.description}
                  onChange={(e) => updateState({ description: e.target.value })}
                  placeholder="En kort beskrivning av er verksamhet..."
                  className="textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Steg 3: Tonalitet */}
        {state.step === 3 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2">
              Vilken ton passar er organisation?
            </h2>
            <p className="text-[var(--foreground-secondary)] mb-8">
              Valj den stil som bast representerar hur ni vill att era rapporter ska lata.
              Ni kan andra detta senare.
            </p>

            <div className="space-y-4">
              {TONALITY_EXAMPLES.map((tone) => {
                const isSelected = state.tonality === tone.value
                return (
                  <button
                    key={tone.value}
                    onClick={() =>
                      updateState({
                        tonality: tone.value,
                        formalityScore: tone.score,
                      })
                    }
                    className={`card p-5 text-left w-full transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[rgba(24,75,101,0.03)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{tone.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[var(--color-primary)]" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)] italic leading-relaxed">
                      &ldquo;{tone.example}&rdquo;
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Steg 4: Referensdokument (valfritt) */}
        {state.step === 4 && createdOrgId && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2">
              Ladda upp ett referensdokument
            </h2>
            <p className="text-[var(--foreground-secondary)] mb-8">
              Har ni en tidigare verksamhetsberattelse? Ladda upp den sa lar sig AI:n er stil.
              Detta steg ar valfritt.
            </p>

            <ReferenceUploader
              orgId={createdOrgId}
              onUploaded={() => updateState({ referenceUploaded: true })}
            />

            {!state.referenceUploaded && (
              <button
                type="button"
                onClick={() => updateState({ step: 5 })}
                className="mt-6 flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Hoppa over detta steg
              </button>
            )}
          </div>
        )}

        {/* Steg 5: Valj mall */}
        {state.step === 5 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold mb-2">Valj en rapportmall</h2>
            <p className="text-[var(--foreground-secondary)] mb-8">
              Valj en mall som passar er organisation. Ni kan anpassa den senare
              eller skapa egna mallar.
            </p>

            <div className="space-y-3">
              {templates.map((template) => {
                const isSelected = state.selectedTemplate === template.id
                const sections = template.sections as Array<{
                  title: string
                  level: number
                }>
                const topLevelCount = sections.filter(
                  (s) => s.level === 1
                ).length

                return (
                  <button
                    key={template.id}
                    onClick={() =>
                      updateState({ selectedTemplate: template.id })
                    }
                    className={`card p-5 text-left w-full transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[rgba(24,75,101,0.03)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{template.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary">
                          {topLevelCount} sektioner
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[var(--color-primary)]" />
                        )}
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-sm text-[var(--foreground-muted)] mb-3">
                        {template.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {sections
                        .filter((s) => s.level === 1)
                        .slice(0, 6)
                        .map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-[var(--background-tertiary)] rounded text-[var(--foreground-secondary)]"
                          >
                            {s.title}
                          </span>
                        ))}
                      {sections.filter((s) => s.level === 1).length > 6 && (
                        <span className="text-xs px-2 py-0.5 text-[var(--foreground-muted)]">
                          +{sections.filter((s) => s.level === 1).length - 6} till
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}

              {templates.length === 0 && (
                <div className="text-center py-8 text-[var(--foreground-muted)]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Laddar mallar...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Felmeddelande */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-[rgba(255,43,15,0.1)] text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Footer med navigeringsknappar */}
      <div className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={state.step === 1}
            className={`btn btn-secondary ${
              state.step === 1 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="btn btn-primary py-3 px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Skapar...
              </>
            ) : state.step === totalSteps ? (
              <>
                Slutfor
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Nasta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
