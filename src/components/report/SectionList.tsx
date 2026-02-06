'use client'

import { useRef, useEffect } from 'react'
import Sortable from 'sortablejs'
import SectionField from './SectionField'
import type { SectionState } from '@/hooks/useReportEditor'

interface SectionListProps {
  sections: SectionState[]
  onContentChange: (sectionId: string, content: string) => void
  onToggleLock: (sectionId: string) => void
  onClear: (sectionId: string) => void
  onRemove: (sectionId: string) => void
  onReorder: (sectionIds: string[]) => void
}

export default function SectionList({
  sections,
  onContentChange,
  onToggleLock,
  onClear,
  onRemove,
  onReorder,
}: SectionListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<Sortable | null>(null)

  useEffect(() => {
    if (!listRef.current) return

    sortableRef.current = Sortable.create(listRef.current, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'opacity-30',
      onEnd: () => {
        if (!listRef.current) return
        const ids = Array.from(listRef.current.children).map(
          (el) => (el as HTMLElement).dataset.sectionId!
        )
        onReorder(ids)
      },
    })

    return () => {
      sortableRef.current?.destroy()
    }
  }, [onReorder])

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div ref={listRef} className="space-y-4">
      {sorted.map((section) => (
        <div key={section.id} data-section-id={section.id}>
          <SectionField
            section={section}
            onContentChange={(content) => onContentChange(section.id, content)}
            onToggleLock={() => onToggleLock(section.id)}
            onClear={() => onClear(section.id)}
            onRemove={() => onRemove(section.id)}
          />
        </div>
      ))}
    </div>
  )
}
