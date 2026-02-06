'use client'

import { useState } from 'react'
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react'

interface PromptSettingsProps {
  customInstructions: string
  onCustomInstructionsChange: (value: string) => void
}

export default function PromptSettings({
  customInstructions,
  onCustomInstructionsChange,
}: PromptSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="card p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          AI-instruktioner (avancerat)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--foreground-muted)] pt-3">
            Lagg till egna instruktioner som AI:n ska folja vid generering.
            Dessa kombineras med organisationens stilprofil och mall.
          </p>
          <textarea
            value={customInstructions}
            onChange={(e) => onCustomInstructionsChange(e.target.value)}
            placeholder="T.ex. 'Anvand alltid vi-form', 'Undvik passiv form', 'Lagg extra fokus pa resultat och siffror'..."
            className="textarea w-full text-sm"
            rows={4}
          />
        </div>
      )}
    </div>
  )
}
