'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface AddSectionButtonProps {
  onAdd: (title: string) => void
}

export default function AddSectionButton({ onAdd }: AddSectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setTitle('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl text-[var(--foreground-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Lägg till sektion
      </button>
    )
  }

  return (
    <div className="card p-4 flex items-center gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Namn på ny sektion..."
        className="input flex-1"
        autoFocus
      />
      <button type="button" onClick={handleSubmit} className="btn btn-primary py-2 px-4">
        Lägg till
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false)
          setTitle('')
        }}
        className="p-2 rounded text-[var(--foreground-muted)] hover:text-[var(--foreground-primary)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
