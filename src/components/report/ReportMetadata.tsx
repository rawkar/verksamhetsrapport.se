'use client'

import { Clock, Cpu, Layers } from 'lucide-react'
import type { GenerationMetadata } from '@/types/database'

interface ReportMetadataProps {
  metadata: GenerationMetadata
}

export default function ReportMetadata({ metadata }: ReportMetadataProps) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)]">
      {metadata.model && (
        <span className="flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5" />
          {metadata.model}
        </span>
      )}
      {metadata.processing_method && (
        <span className="flex items-center gap-1">
          {metadata.processing_method === 'single_pass' ? 'Enkel' : 'Chunked'}
        </span>
      )}
      {metadata.chunks && metadata.chunks > 1 && (
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          {metadata.chunks} delar
        </span>
      )}
      {metadata.tokens_used && (
        <span className="flex items-center gap-1">
          {metadata.tokens_used.toLocaleString('sv-SE')} tokens
        </span>
      )}
      {metadata.generation_time_ms && (
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {(metadata.generation_time_ms / 1000).toFixed(1)}s
        </span>
      )}
      {metadata.generated_at && (
        <span className="flex items-center gap-1">
          {new Date(metadata.generated_at).toLocaleDateString('sv-SE', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  )
}
