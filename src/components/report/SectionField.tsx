'use client'

import { useRef, useEffect } from 'react'
import { GripVertical } from 'lucide-react'
import SectionToolbar from './SectionToolbar'
import type { SectionState } from '@/hooks/useReportEditor'

interface SectionFieldProps {
  section: SectionState
  onContentChange: (content: string) => void
  onToggleLock: () => void
  onClear: () => void
  onRemove?: () => void
  dragHandleProps?: Record<string, unknown>
}

export default function SectionField({
  section,
  onContentChange,
  onToggleLock,
  onClear,
  onRemove,
}: SectionFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.max(120, ta.scrollHeight) + 'px'
  }, [section.content])

  const isSubsection = section.level > 1

  return (
    <div
      className={`card p-0 overflow-hidden ${section.isLocked ? 'ring-1 ring-[var(--color-primary)] bg-[rgba(0,101,163,0.02)]' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-[var(--foreground-muted)] cursor-grab flex-shrink-0 drag-handle" />
          <h3
            className={`font-medium truncate ${isSubsection ? 'text-sm text-[var(--foreground-secondary)]' : ''}`}
          >
            {section.title}
          </h3>
        </div>
        <SectionToolbar
          isLocked={section.isLocked}
          hasContent={!!section.content}
          onToggleLock={onToggleLock}
          onClear={onClear}
          onRemove={onRemove}
        />
      </div>

      {/* Description */}
      {section.description && (
        <p className="px-4 pt-2 text-xs text-[var(--foreground-muted)]">
          {section.description}
        </p>
      )}

      {/* Textarea */}
      <div className="p-4 pt-2">
        <textarea
          ref={textareaRef}
          value={section.content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={section.isLocked}
          placeholder={section.placeholder || `Skriv innehåll för "${section.title}"...`}
          className="textarea w-full min-h-[120px] resize-none disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
