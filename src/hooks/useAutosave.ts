'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import type { SectionsContent } from '@/types/database'

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave(reportId: string, debounceMs = 1500) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const save = useCallback(
    async (sectionsContent: SectionsContent) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      abortRef.current?.abort()

      timeoutRef.current = setTimeout(async () => {
        setStatus('saving')
        const controller = new AbortController()
        abortRef.current = controller

        try {
          const res = await fetch(`/api/reports/${reportId}/autosave`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections_content: sectionsContent }),
            signal: controller.signal,
          })

          if (!controller.signal.aborted) {
            setStatus(res.ok ? 'saved' : 'error')
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setStatus('error')
          }
        }
      }, debounceMs)
    },
    [reportId, debounceMs]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      abortRef.current?.abort()
    }
  }, [])

  return { save, status }
}
