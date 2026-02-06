'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react'

interface ReferenceUploaderProps {
  orgId: string
  onUploaded?: (analysis: Record<string, unknown> | null) => void
}

export default function ReferenceUploader({ orgId, onUploaded }: ReferenceUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setStatus('uploading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('org_id', orgId)

    try {
      const res = await fetch('/api/references/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Uppladdning misslyckades')
      }

      const data = await res.json()
      setStatus('done')
      onUploaded?.(data.data?.style_analysis || null)
    } catch (err) {
      setStatus('error')
      setErrorMsg((err as Error).message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (status === 'done') {
    return (
      <div className="card p-4 flex items-center gap-3 border-[var(--color-success)]">
        <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{fileName}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Uppladdad och analyserad</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setFileName('')
          }}
          className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground-primary)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (status === 'uploading') {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--foreground-secondary)]">
          Laddar upp och analyserar {fileName}...
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="card p-6 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors cursor-pointer text-center"
      >
        <Upload className="w-8 h-8 text-[var(--foreground-muted)] mx-auto mb-2" />
        <p className="text-sm font-medium mb-1">
          Dra och släpp eller klicka för att ladda upp
        </p>
        <p className="text-xs text-[var(--foreground-muted)]">
          PDF, DOCX eller TXT (max 20 MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {status === 'error' && (
        <p className="mt-2 text-sm text-[var(--color-error)]">{errorMsg}</p>
      )}
    </div>
  )
}
