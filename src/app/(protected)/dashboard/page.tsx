'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface Report {
  id: string
  title: string
  report_year: number | null
  report_period: string | null
  status: string
  created_at: string
  updated_at: string
}

interface Organization {
  id: string
  name: string
  subscription_plan: string
  reports_used_this_year: number
  role: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: { label: 'Utkast', className: 'badge-warning', icon: Pencil },
  generating: {
    label: 'Genererar...',
    className: 'badge-primary',
    icon: Loader2,
  },
  review: {
    label: 'Granskning',
    className: 'badge-primary',
    icon: Clock,
  },
  final: { label: 'Slutgiltig', className: 'badge-success', icon: CheckCircle2 },
}

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  bas: 5,
  pro: Infinity,
  enterprise: Infinity,
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)

    // Hämta organisationer
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
    setOrg(currentOrg)

    // Hämta rapporter
    const reportRes = await fetch(`/api/reports?org_id=${currentOrg.id}`)
    if (reportRes.ok) {
      const reportData = await reportRes.json()
      setReports(reportData.data || [])
    }

    setIsLoading(false)
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm('Är du säker på att du vill radera denna rapport?')) return

    setDeleteId(reportId)
    const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }
    setDeleteId(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const reportsRemaining = org
    ? Math.max(
        0,
        (PLAN_LIMITS[org.subscription_plan] || 1) -
          org.reports_used_this_year
      )
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{org?.name}</h1>
          <p className="text-[var(--foreground-muted)]">
            Hantera era verksamhetsrapporter
          </p>
        </div>
        <Link href="/report/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Ny rapport
        </Link>
      </div>

      {/* Snabbstatistik  */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-[var(--foreground-muted)] mb-1">
            Rapporter
          </p>
          <p className="text-2xl font-bold">{reports.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--foreground-muted)] mb-1">Plan</p>
          <p className="text-2xl font-bold capitalize">
            {org?.subscription_plan || 'Gratis'}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-[var(--foreground-muted)] mb-1">
            Rapporter kvar
          </p>
          <p className="text-2xl font-bold">
            {reportsRemaining === Infinity ? 'Obegränsat' : reportsRemaining}
          </p>
        </div>
      </div>

      {/* Uppgraderingsinfo för gratisplan */}
      {org?.subscription_plan === 'free' && (
        <div className="card p-5 mb-8 border-[var(--color-accent)] bg-[rgba(209,107,28,0.03)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Gratisplan</p>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Du har {reportsRemaining} rapport(er) kvar på gratisplanen.
                Uppgradera för att skapa fler rapporter och få tillgång till
                PDF-export.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rapportlista */}
      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inga rapporter ännu</h3>
          <p className="text-[var(--foreground-muted)] mb-6">
            Skapa din första verksamhetsrapport för att komma igång.
          </p>
          <Link href="/report/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Skapa din första rapport
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-3">Dina rapporter</h2>
          {reports.map((report) => {
            const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft
            const StatusIcon = statusConfig.icon
            return (
              <div
                key={report.id}
                className="card p-5 flex items-center justify-between"
              >
                <Link
                  href={`/report/${report.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{report.title}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {report.report_year && `${report.report_year} · `}
                        Uppdaterad {formatDate(report.updated_at)}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 ml-4">
                  <span
                    className={`badge ${statusConfig.className} flex items-center gap-1`}
                  >
                    <StatusIcon
                      className={`w-3 h-3 ${
                        report.status === 'generating' ? 'animate-spin' : ''
                      }`}
                    />
                    {statusConfig.label}
                  </span>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(report.id)
                    }}
                    disabled={deleteId === report.id}
                    className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(255,43,15,0.05)] transition-colors"
                    title="Radera rapport"
                  >
                    {deleteId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
