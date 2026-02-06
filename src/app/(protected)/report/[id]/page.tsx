'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ReportEditor from '@/components/report/ReportEditor'
import type { Report, ReportTemplate } from '@/types/database'

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/reports/${params.id}`)
      if (!res.ok) {
        router.push('/dashboard')
        return
      }
      const data = await res.json()
      setReport(data.data)

      if (data.data.template_id) {
        const tRes = await fetch(`/api/templates/${data.data.template_id}`)
        if (tRes.ok) {
          const tData = await tRes.json()
          setTemplate(tData.data)
        }
      }

      setIsLoading(false)
    }
    load()
  }, [params.id, router])

  if (isLoading || !report || !template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return <ReportEditor report={report} template={template} canExportPDF />
}
