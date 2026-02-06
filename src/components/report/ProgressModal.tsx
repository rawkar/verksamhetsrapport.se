'use client'

import { Loader2 } from 'lucide-react'

interface ProgressModalProps {
  isOpen: boolean
  step: string
  current: number
  total: number
}

export default function ProgressModal({
  isOpen,
  step,
  current,
  total,
}: ProgressModalProps) {
  if (!isOpen) return null

  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card p-8 w-full max-w-md text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI genererar din rapport</h3>
        <p className="text-[var(--foreground-secondary)] mb-4">{step}</p>

        {/* Progress bar */}
        <div className="w-full bg-[var(--border-color)] rounded-full h-2 mb-2">
          <div
            className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          {current} / {total} {total === 1 ? 'steg' : 'delar'}
        </p>
      </div>
    </div>
  )
}
