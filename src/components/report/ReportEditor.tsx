'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Cloud, CloudOff, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { useReportEditor } from '@/hooks/useReportEditor'
import SectionList from './SectionList'
import AddSectionButton from './AddSectionButton'
import GenerateButton from './GenerateButton'
import ProgressModal from './ProgressModal'
import ReportOutput from './ReportOutput'
import VersionHistory from './VersionHistory'
import PromptSettings from './PromptSettings'
import type { Report, ReportTemplate, GenerationMetadata } from '@/types/database'

interface ReportEditorProps {
  report: Report
  template: ReportTemplate
  canExportPDF?: boolean
}

const AUTOSAVE_LABELS: Record<string, { icon: React.ElementType; text: string }> = {
  idle: { icon: Cloud, text: '' },
  saving: { icon: Loader2, text: 'Sparar...' },
  saved: { icon: Cloud, text: 'Sparat' },
  error: { icon: CloudOff, text: 'Kunde inte spara' },
}

export default function ReportEditor({ report, template, canExportPDF = false }: ReportEditorProps) {
  const router = useRouter()
  const {
    sections,
    isGenerating,
    generatedContent,
    autosaveStatus,
    updateContent,
    toggleLock,
    clearSection,
    addSection,
    removeSection,
    reorder,
    setGenerating,
    setGeneratedContent,
    getSectionsContent,
  } = useReportEditor(report, template)

  const [progress, setProgress] = useState({ step: '', current: 0, total: 0 })
  const [genMetadata, setGenMetadata] = useState<GenerationMetadata | undefined>(
    report.generation_metadata || undefined
  )
  const [customInstructions, setCustomInstructions] = useState('')
  const reportOutputRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const hasContent = sections.some((s) => s.content.trim())

  // Auto-scroll to report after generation
  useEffect(() => {
    if (generatedContent && !isGenerating && reportOutputRef.current) {
      setTimeout(() => {
        reportOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [generatedContent, isGenerating])

  // Show sticky button when report exists but is not in view
  useEffect(() => {
    if (!generatedContent) {
      setShowScrollButton(false)
      return
    }

    const el = reportOutputRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollButton(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [generatedContent])

  const handleAddSection = useCallback(
    (title: string) => {
      addSection({
        id: crypto.randomUUID(),
        title,
        level: 1,
        content: '',
        isLocked: false,
        lastEdited: null,
        parentId: null,
        order: sections.length,
      })
    },
    [addSection, sections.length]
  )

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setProgress({ step: 'Förbereder...', current: 0, total: 1 })

    try {
      const res = await fetch(`/api/reports/${report.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections_content: getSectionsContent(),
          custom_instructions: customInstructions || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generering misslyckades')
      }

      const data = await res.json()
      setGeneratedContent(data.content)
      setGenMetadata(data.metadata)
      router.refresh()
    } catch (err) {
      alert((err as Error).message)
      setGenerating(false)
    }
  }, [report.id, getSectionsContent, setGenerating, setGeneratedContent, router])

  const StatusInfo = AUTOSAVE_LABELS[autosaveStatus]
  const StatusIcon = StatusInfo.icon

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{report.title}</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              {template.name}
              {report.report_year && ` · ${report.report_year}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave status */}
          {StatusInfo.text && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
              <StatusIcon
                className={`w-4 h-4 ${autosaveStatus === 'saving' ? 'animate-spin' : ''}`}
              />
              {StatusInfo.text}
            </span>
          )}

          <VersionHistory reportId={report.id} />

          <GenerateButton
            isGenerating={isGenerating}
            hasContent={hasContent}
            onClick={handleGenerate}
          />
        </div>
      </div>

      {/* Sections */}
      <SectionList
        sections={sections}
        onContentChange={updateContent}
        onToggleLock={toggleLock}
        onClear={clearSection}
        onRemove={removeSection}
        onReorder={reorder}
      />

      <div className="mt-4">
        <AddSectionButton onAdd={handleAddSection} />
      </div>

      {/* AI prompt settings */}
      <div className="mt-4">
        <PromptSettings
          customInstructions={customInstructions}
          onCustomInstructionsChange={setCustomInstructions}
        />
      </div>

      {/* Generated output */}
      {generatedContent && (
        <div className="mt-8" ref={reportOutputRef}>
          <ReportOutput
            reportId={report.id}
            content={generatedContent}
            metadata={genMetadata}
            canExportPDF={canExportPDF}
          />
        </div>
      )}

      {/* Sticky scroll-to-report button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={() =>
            reportOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          className="fixed bottom-6 right-6 btn btn-primary shadow-lg z-50 py-2.5 px-4"
        >
          <FileText className="w-4 h-4" />
          Visa genererad rapport
        </button>
      )}

      {/* Progress modal */}
      <ProgressModal
        isOpen={isGenerating}
        step={progress.step}
        current={progress.current}
        total={progress.total}
      />
    </div>
  )
}
