'use client'

import { useState } from 'react'
import { ThumbsUp, Pencil, RefreshCw, Loader2, X } from 'lucide-react'

interface SectionFeedbackProps {
  reportId: string
  sectionId: string
  sectionTitle: string
  generatedContent: string
  onRegenerated?: (newContent: string) => void
}

const QUICK_FEEDBACK = [
  'För formellt',
  'För informellt',
  'Mer detaljer',
  'Kortare',
]

export default function SectionFeedback({
  reportId,
  sectionId,
  sectionTitle,
  generatedContent,
  onRegenerated,
}: SectionFeedbackProps) {
  const [mode, setMode] = useState<'idle' | 'adjust' | 'loading'>('idle')
  const [liked, setLiked] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleLike = () => {
    setLiked(true)
    // Could POST to an analytics endpoint in the future
  }

  const handleRegenerate = async (feedbackText: string) => {
    setMode('loading')
    try {
      const res = await fetch(`/api/reports/${reportId}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: sectionId,
          feedback: feedbackText,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Regenerering misslyckades')
      }

      const data = await res.json()
      onRegenerated?.(data.content)
      setMode('idle')
      setFeedback('')
    } catch {
      setMode('idle')
    }
  }

  if (mode === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Regenererar {sectionTitle}...
      </div>
    )
  }

  if (mode === 'adjust') {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {QUICK_FEEDBACK.map((fb) => (
            <button
              key={fb}
              type="button"
              onClick={() => handleRegenerate(fb)}
              className="badge badge-primary cursor-pointer hover:opacity-80"
            >
              {fb}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && feedback.trim() && handleRegenerate(feedback)}
            placeholder="Egen feedback..."
            className="input flex-1 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => feedback.trim() && handleRegenerate(feedback)}
            disabled={!feedback.trim()}
            className="btn btn-primary py-1.5 px-3 text-sm disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            className="p-1.5 text-[var(--foreground-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleLike}
        className={`p-1.5 rounded transition-colors ${
          liked
            ? 'text-[var(--color-success)]'
            : 'text-[var(--foreground-muted)] hover:text-[var(--color-success)]'
        }`}
        title="Bra"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setMode('adjust')}
        className="p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--color-primary)] transition-colors"
        title="Justera"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleRegenerate('')}
        className="p-1.5 rounded text-[var(--foreground-muted)] hover:text-[var(--color-primary)] transition-colors"
        title="Regenerera"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  )
}
