'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface UpgradeBannerProps {
  orgId: string
  currentPlan: string
  remaining: number
}

const PLANS = [
  { key: 'bas', name: 'Bas', price: '299 kr/mån', reports: '5 rapporter/år' },
  { key: 'pro', name: 'Pro', price: '799 kr/mån', reports: 'Obegränsat' },
]

export default function UpgradeBanner({ orgId, currentPlan, remaining }: UpgradeBannerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  if (currentPlan !== 'free') return null

  const handleUpgrade = async (plan: string) => {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, org_id: orgId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="card p-5 mb-6 border-[var(--color-accent)] bg-[rgba(209,107,28,0.03)]">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Uppgradera din plan</p>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Du har {remaining} rapport(er) kvar på gratisplanen. Uppgradera för fler rapporter och PDF-export.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.key}
            onClick={() => handleUpgrade(plan.key)}
            disabled={loading !== null}
            className="card p-4 text-left hover:border-[var(--color-primary)] transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{plan.name}</span>
              <span className="text-sm text-[var(--foreground-muted)]">{plan.price}</span>
            </div>
            <p className="text-sm text-[var(--foreground-secondary)]">{plan.reports}</p>
            {loading === plan.key && (
              <Loader2 className="w-4 h-4 animate-spin mt-2 text-[var(--color-primary)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
