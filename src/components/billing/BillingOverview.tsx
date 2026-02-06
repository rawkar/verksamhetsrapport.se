'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'

interface BillingOverviewProps {
  orgId: string
  plan: string
  status: string
  reportsUsed: number
  hasStripeCustomer: boolean
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  bas: 'Bas – 299 kr/mån',
  pro: 'Pro – 799 kr/mån',
  enterprise: 'Enterprise – 1 999 kr/mån',
}

const PLAN_LIMITS: Record<string, number | string> = {
  free: 1,
  bas: 5,
  pro: 'Obegränsat',
  enterprise: 'Obegränsat',
}

export default function BillingOverview({
  orgId,
  plan,
  status,
  reportsUsed,
  hasStripeCustomer,
}: BillingOverviewProps) {
  const [portalLoading, setPortalLoading] = useState(false)

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setPortalLoading(false)
    }
  }

  const limit = PLAN_LIMITS[plan]

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        Prenumeration
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--foreground-muted)]">Plan</span>
          <span className="font-medium">{PLAN_LABELS[plan] || plan}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--foreground-muted)]">Status</span>
          <span
            className={`badge ${
              status === 'active' ? 'badge-success' : 'badge-warning'
            }`}
          >
            {status === 'active' ? 'Aktiv' : status === 'past_due' ? 'Förfallen' : status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--foreground-muted)]">Rapporter använda</span>
          <span>
            {reportsUsed} / {limit}
          </span>
        </div>
      </div>

      {hasStripeCustomer && (
        <button
          onClick={openPortal}
          disabled={portalLoading}
          className="btn btn-secondary w-full mt-4 text-sm"
        >
          {portalLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-3.5 h-3.5" />
              Hantera prenumeration
            </>
          )}
        </button>
      )}
    </div>
  )
}
