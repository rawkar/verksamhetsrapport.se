'use client'

import { useRef, useState } from 'react'
import { Copy, Check, FileDown, Download, Loader2 } from 'lucide-react'
import Markdown from 'react-markdown'
import ReportMetadata from './ReportMetadata'
import type { GenerationMetadata } from '@/types/database'

interface ReportOutputProps {
  reportId: string
  content: string
  metadata?: GenerationMetadata
  canExportPDF?: boolean
}

function cleanContent(raw: string): string {
  return raw
    .replace(/^---+$/gm, '') // Remove horizontal rules
    .replace(/\n{3,}/g, '\n\n') // Collapse excess blank lines
}

export default function ReportOutput({
  reportId,
  content,
  metadata,
  canExportPDF = false,
}: ReportOutputProps) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async (format: 'pdf' | 'txt') => {
    setExporting(format)
    try {
      const res = await fetch(`/api/reports/${reportId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Export misslyckades')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rapport.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export misslyckades')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4" ref={reportRef} id="generated-report">
      {/* Metadata */}
      {metadata && <ReportMetadata metadata={metadata} />}

      {/* Output */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-medium">Genererad rapport</h3>
          <div className="flex items-center gap-2">
            {canExportPDF && (
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                className="btn btn-primary py-1.5 px-3 text-sm"
              >
                {exporting === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExport('txt')}
              disabled={exporting !== null}
              className="btn btn-secondary py-1.5 px-3 text-sm"
            >
              {exporting === 'txt' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              TXT
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary py-1.5 px-3 text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Kopierad
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Kopiera
                </>
              )}
            </button>
          </div>
        </div>
        <div className="report-rendered">
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className="report-h1">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="report-h2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="report-h3">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="report-h4">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="report-p">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="report-ul">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="report-ol">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="report-li">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              hr: () => null,
            }}
          >
            {cleanContent(content)}
          </Markdown>
        </div>
      </div>
    </div>
  )
}
