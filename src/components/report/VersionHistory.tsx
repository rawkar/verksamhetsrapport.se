'use client'

import { useState, useEffect } from 'react'
import { History, Save, Loader2 } from 'lucide-react'

interface Version {
  id: string
  version_number: number
  created_at: string
}

interface VersionHistoryProps {
  reportId: string
}

export default function VersionHistory({ reportId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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

  const handleSaveVersion = async () => {
    setSaving(true)
    const res = await fetch(`/api/reports/${reportId}/versions`, { method: 'POST' })
    if (res.ok) {
      await loadVersions()
    }
    setSaving(false)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] transition-colors"
        title="Versionshistorik"
      >
        <History className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 card p-0 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h4 className="font-medium text-sm">Versioner</h4>
            <button
              onClick={handleSaveVersion}
              disabled={saving}
              className="btn btn-primary py-1 px-2.5 text-xs"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Spara version
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                Inga versioner sparade än
              </p>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className="px-4 py-2.5 border-b border-[var(--border-color)] last:border-0 text-sm"
                >
                  <span className="font-medium">Version {v.version_number}</span>
                  <span className="text-[var(--foreground-muted)] ml-2">
                    {formatDate(v.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
