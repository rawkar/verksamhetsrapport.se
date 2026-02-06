'use client'

import { Sparkles, Loader2 } from 'lucide-react'

interface GenerateButtonProps {
  isGenerating: boolean
  hasContent: boolean
  onClick: () => void
}

export default function GenerateButton({
  isGenerating,
  hasContent,
  onClick,
}: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isGenerating || !hasContent}
      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Genererar...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generera rapport
        </>
      )}
    </button>
  )
}
