'use client'

import { useState, useEffect, useRef } from 'react'
import { History, Save, Loader2, X, RotateCcw } from 'lucide-react'

interface Version {
  id: string
  version_number: number
  created_at: string
  generated_content: string | null
}

interface VersionHistoryProps {
  reportId: string
  onRestore?: (content: string) => void
}

export default function VersionHistory({ reportId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [saving, setSaving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadVersions = async () => {
    const res = await fetch(`/api/reports/${reportId}/versions`)
    if (res.ok) {
      const data = await res.json()
      setVersions(data.data || [])
    }
  }

  useEffect(() => {
    if (isOpen) loadVersions()
  }, [isOpen, reportId])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleSaveVersion = async () => {
    setSaving(true)
    const res = await fetch(`/api/reports/${reportId}/versions`, { method: 'POST' })
    if (res.ok) {
      await loadVersions()
    }
    setSaving(false)
  }

  const handleRestore = async (version: Version) => {
    if (!version.generated_content) return
    if (!confirm(`Vill du återställa till Version ${version.version_number}? Nuvarande genererat innehåll ersätts.`)) return

    setRestoringId(version.id)
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_content: version.generated_content }),
      })
      if (res.ok) {
        onRestore?.(version.generated_content)
        setIsOpen(false)
      }
    } catch {
      // ignore
    }
    setRestoringId(null)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] transition-colors"
        title="Versionshistorik"
      >
        <History className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 card p-0 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h4 className="font-medium text-sm">Versioner</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveVersion}
                disabled={saving}
                className="btn btn-primary py-1 px-2.5 text-xs"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Spara version
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] transition-colors"
                title="Stäng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                Inga versioner sparade än
              </p>
            ) : (
              versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleRestore(v)}
                  disabled={restoringId === v.id || !v.generated_content}
                  className="w-full px-4 py-2.5 border-b border-[var(--border)] last:border-0 text-sm text-left flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50"
                >
                  <div>
                    <span className="font-medium">Version {v.version_number}</span>
                    <span className="text-[var(--foreground-muted)] ml-2">
                      {formatDate(v.created_at)}
                    </span>
                  </div>
                  {restoringId === v.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
