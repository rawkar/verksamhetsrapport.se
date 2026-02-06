'use client'

import { Lock, Unlock, Eraser, Trash2 } from 'lucide-react'

interface SectionToolbarProps {
  isLocked: boolean
  hasContent: boolean
  onToggleLock: () => void
  onClear: () => void
  onRemove?: () => void
}

export default function SectionToolbar({
  isLocked,
  hasContent,
  onToggleLock,
  onClear,
  onRemove,
}: SectionToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleLock}
        className={`p-1.5 rounded transition-colors ${
          isLocked
            ? 'text-[var(--color-primary)] bg-[rgba(0,101,163,0.1)]'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
        }`}
        title={isLocked ? 'Lås upp' : 'Lås'}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      {hasContent && !isLocked && (
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--color-accent)] transition-colors"
          title="Rensa"
        >
          <Eraser className="w-4 h-4" />
        </button>
      )}

      {onRemove && !isLocked && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--color-error)] transition-colors"
          title="Ta bort sektion"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
