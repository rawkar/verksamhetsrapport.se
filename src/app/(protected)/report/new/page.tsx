'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  Calendar,
  Check,
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  template_type: string
  sections: Array<{ title: string; level: number }>
}

const PERIODS = [
  { value: 'annual', label: 'Helarsrapport' },
  { value: 'h1', label: 'Halvar 1 (jan-jun)' },
  { value: 'h2', label: 'Halvar 2 (jul-dec)' },
  { value: 'q1', label: 'Kvartal 1' },
  { value: 'q2', label: 'Kvartal 2' },
  { value: 'q3', label: 'Kvartal 3' },
  { value: 'q4', label: 'Kvartal 4' },
]

export default function NewReportPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportPeriod, setReportPeriod] = useState('annual')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Hamta organisation
    const orgRes = await fetch('/api/organizations')
    if (!orgRes.ok) {
      router.push('/onboarding')
      return
    }
    const orgData = await orgRes.json()
    if (!orgData.data || orgData.data.length === 0) {
      router.push('/onboarding')
      return
    }
    const currentOrg = orgData.data[0]
    setOrgId(currentOrg.id)

    // Hamta mallar
    const templateRes = await fetch(
      `/api/templates?org_id=${currentOrg.id}`
    )
    if (templateRes.ok) {
      const templateData = await templateRes.json()
      setTemplates(templateData.data || [])

      // Forvalj forsta mallen
      if (templateData.data?.length > 0) {
        setSelectedTemplate(templateData.data[0].id)
      }
    }

    setIsLoading(false)
  }

  const handleCreate = async () => {
    if (!selectedTemplate || !title.trim() || !orgId) return

    setIsCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          title: title.trim(),
          template_id: selectedTemplate,
          report_year: reportYear,
          report_period: reportPeriod,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Kunde inte skapa rapport')
      }

      const { data: report } = await res.json()
      router.push(`/report/${report.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nagot gick fel')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Tillbaka */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">Skapa ny rapport</h1>
      <p className="text-[var(--foreground-secondary)] mb-8">
        Valj en mall och ange grunduppgifter for din rapport.
      </p>

      <div className="space-y-8">
        {/* Titel */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Rapporttitel *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="T.ex. Verksamhetsberattelse 2025"
            className="input"
            autoFocus
          />
        </div>

        {/* Ar och period */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium mb-2"
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Ar
            </label>
            <input
              id="year"
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              min={2000}
              max={2100}
              className="input"
            />
          </div>
          <div>
            <label
              htmlFor="period"
              className="block text-sm font-medium mb-2"
            >
              Period
            </label>
            <select
              id="period"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="input"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valj mall */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Valj rapportmall</h2>
          <div className="space-y-3">
            {templates.map((template) => {
              const isSelected = selectedTemplate === template.id
              const sections = template.sections || []
              const topLevel = sections.filter((s) => s.level === 1)

              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`card p-5 text-left w-full transition-all ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[rgba(24,75,101,0.03)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{template.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">
                        {topLevel.length} sektioner
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-[var(--color-primary)]" />
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-[var(--foreground-muted)] mb-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {topLevel.slice(0, 5).map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-[var(--background-tertiary)] rounded text-[var(--foreground-secondary)]"
                      >
                        {s.title}
                      </span>
                    ))}
                    {topLevel.length > 5 && (
                      <span className="text-xs px-2 py-0.5 text-[var(--foreground-muted)]">
                        +{topLevel.length - 5} till
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Felmeddelande */}
        {error && (
          <div className="p-4 rounded-lg bg-[rgba(255,43,15,0.1)] text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        {/* Skapa-knapp */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            disabled={!selectedTemplate || !title.trim() || isCreating}
            className="btn btn-primary py-3 px-6"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Skapar rapport...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Skapa rapport
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
