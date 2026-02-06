'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Building2, Users, FileText, CreditCard, Upload, Trash2, CheckCircle2 } from 'lucide-react'
import BillingOverview from '@/components/billing/BillingOverview'
import UpgradeBanner from '@/components/billing/UpgradeBanner'
import ReferenceUploader from '@/components/report/ReferenceUploader'

interface ReferenceDoc {
  id: string
  file_name: string
  file_type: string
  file_size_bytes: number
  is_analyzed: boolean
  created_at: string
}

function ReferenceList({
  orgId,
  references,
  onDeleted,
}: {
  orgId: string
  references: ReferenceDoc[]
  onDeleted: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta referensdokument?')) return
    setDeletingId(id)
    const res = await fetch(`/api/references/${id}`, { method: 'DELETE' })
    if (res.ok) onDeleted()
    setDeletingId(null)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (references.length === 0) return null

  return (
    <div>
      <h3 className="font-medium mb-3">Uppladdade dokument</h3>
      <div className="space-y-2">
        {references.map((ref) => (
          <div key={ref.id} className="card p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{ref.file_name}</p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {formatSize(ref.file_size_bytes)} · {ref.file_type.toUpperCase()}
                {ref.is_analyzed && (
                  <span className="ml-2 text-[var(--color-success)]">
                    <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                    Analyserad
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => handleDelete(ref.id)}
              disabled={deletingId === ref.id}
              className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(255,43,15,0.05)] transition-colors"
              title="Ta bort"
            >
              {deletingId === ref.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Org {
  id: string
  name: string
  org_type: string
  sector: string | null
  description: string | null
  subscription_plan: string
  subscription_status: string
  reports_used_this_year: number
  stripe_customer_id: string | null
  role: string
}

interface Member {
  id: string
  user_id: string
  role: string
  profiles: { full_name: string | null; email: string }
}

type Tab = 'organization' | 'team' | 'references' | 'billing'

export default function SettingsPage() {
  const router = useRouter()
  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>('organization')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [references, setReferences] = useState<ReferenceDoc[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const res = await fetch('/api/organizations')
    if (!res.ok) {
      router.push('/onboarding')
      return
    }
    const data = await res.json()
    if (!data.data?.length) {
      router.push('/onboarding')
      return
    }
    const o = data.data[0]
    setOrg(o)
    setName(o.name)
    setDescription(o.description || '')

    // Load members
    const mRes = await fetch(`/api/organizations/${o.id}/members`)
    if (mRes.ok) {
      const mData = await mRes.json()
      setMembers(mData.data || [])
    }

    // Load references
    await loadReferences(o.id)

    setIsLoading(false)
  }

  const loadReferences = async (orgId: string) => {
    const refRes = await fetch('/api/references')
    if (refRes.ok) {
      const refData = await refRes.json()
      setReferences(refData.data || [])
    }
  }

  const handleSaveOrg = async () => {
    if (!org) return
    setSaving(true)
    await fetch(`/api/organizations/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    setSaving(false)
  }

  const handleInvite = async () => {
    if (!org || !inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch(`/api/organizations/${org.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    if (res.ok) {
      setInviteEmail('')
      loadData()
    }
    setInviting(false)
  }

  if (isLoading || !org) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'organization', label: 'Organisation', icon: Building2 },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'references', label: 'Referensdokument', icon: FileText },
    { key: 'billing', label: 'Betalning', icon: CreditCard },
  ]

  const remaining = Math.max(
    0,
    ({ free: 1, bas: 5, pro: Infinity, enterprise: Infinity }[org.subscription_plan] || 1) -
      org.reports_used_this_year
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inställningar</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border-color)]">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Organization tab */}
      {tab === 'organization' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Organisationsnamn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full max-w-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Beskrivning</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea w-full max-w-md"
              rows={3}
            />
          </div>
          <button onClick={handleSaveOrg} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Spara
          </button>
        </div>
      )}

      {/* Team tab */}
      {tab === 'team' && (
        <div className="space-y-6">
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.profiles?.full_name || m.profiles?.email}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{m.profiles?.email}</p>
                </div>
                <span className="badge badge-primary capitalize">{m.role}</span>
              </div>
            ))}
          </div>

          {['owner', 'admin'].includes(org.role) && (
            <div className="card p-4">
              <h3 className="font-medium mb-3">Bjud in teammedlem</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exempel.se"
                  className="input flex-1"
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="btn btn-primary"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bjud in'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* References tab */}
      {tab === 'references' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Ladda upp referensdokument</h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Ladda upp en tidigare verksamhetsberättelse så lär sig AI:n er stil.
            </p>
            <ReferenceUploader orgId={org.id} onUploaded={() => loadReferences(org.id)} />
          </div>
          <ReferenceList orgId={org.id} references={references} onDeleted={() => loadReferences(org.id)} />
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="space-y-6">
          <UpgradeBanner orgId={org.id} currentPlan={org.subscription_plan} remaining={remaining} />
          <BillingOverview
            orgId={org.id}
            plan={org.subscription_plan}
            status={org.subscription_status}
            reportsUsed={org.reports_used_this_year}
            hasStripeCustomer={!!org.stripe_customer_id}
          />
        </div>
      )}
    </div>
  )
}
