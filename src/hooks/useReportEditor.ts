'use client'

import { useReducer, useCallback, useEffect } from 'react'
import { useAutosave } from './useAutosave'
import type { Report, ReportTemplate, TemplateSection, SectionsContent } from '@/types/database'

export interface SectionState {
  id: string
  title: string
  level: number
  content: string
  isLocked: boolean
  lastEdited: string | null
  parentId: string | null
  order: number
  description?: string
  placeholder?: string
}

interface EditorState {
  sections: SectionState[]
  isDirty: boolean
  isGenerating: boolean
  generatedContent: string | null
}

type EditorAction =
  | { type: 'UPDATE_CONTENT'; sectionId: string; content: string }
  | { type: 'TOGGLE_LOCK'; sectionId: string }
  | { type: 'CLEAR_SECTION'; sectionId: string }
  | { type: 'ADD_SECTION'; section: SectionState }
  | { type: 'REMOVE_SECTION'; sectionId: string }
  | { type: 'REORDER'; sectionIds: string[] }
  | { type: 'SET_GENERATING'; value: boolean }
  | { type: 'SET_GENERATED_CONTENT'; content: string }
  | { type: 'MARK_SAVED' }

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UPDATE_CONTENT':
      return {
        ...state,
        isDirty: true,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? { ...s, content: action.content, lastEdited: new Date().toISOString() }
            : s
        ),
      }
    case 'TOGGLE_LOCK':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, isLocked: !s.isLocked } : s
        ),
      }
    case 'CLEAR_SECTION':
      return {
        ...state,
        isDirty: true,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, content: '', isLocked: false, lastEdited: null } : s
        ),
      }
    case 'ADD_SECTION':
      return {
        ...state,
        isDirty: true,
        sections: [...state.sections, action.section],
      }
    case 'REMOVE_SECTION':
      return {
        ...state,
        isDirty: true,
        sections: state.sections.filter((s) => s.id !== action.sectionId),
      }
    case 'REORDER': {
      const ordered = action.sectionIds
        .map((id, i) => {
          const section = state.sections.find((s) => s.id === id)
          return section ? { ...section, order: i } : null
        })
        .filter(Boolean) as SectionState[]
      return { ...state, isDirty: true, sections: ordered }
    }
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.value }
    case 'SET_GENERATED_CONTENT':
      return { ...state, generatedContent: action.content, isGenerating: false }
    case 'MARK_SAVED':
      return { ...state, isDirty: false }
    default:
      return state
  }
}

function buildInitialSections(
  template: ReportTemplate,
  sectionsContent: SectionsContent
): SectionState[] {
  return (template.sections as TemplateSection[]).map((ts) => {
    const saved = sectionsContent[ts.id]
    return {
      id: ts.id,
      title: ts.title,
      level: ts.level,
      content: saved?.raw_input || '',
      isLocked: saved?.is_locked || false,
      lastEdited: saved?.last_edited || null,
      parentId: ts.parent_id || null,
      order: ts.order,
      description: ts.description,
      placeholder: ts.placeholder,
    }
  })
}

export function useReportEditor(report: Report, template: ReportTemplate) {
  const [state, dispatch] = useReducer(reducer, {
    sections: buildInitialSections(template, report.sections_content || {}),
    isDirty: false,
    isGenerating: false,
    generatedContent: report.generated_content || null,
  })

  const { save, status: autosaveStatus } = useAutosave(report.id)

  // Autosave on content change
  useEffect(() => {
    if (!state.isDirty) return
    const sectionsContent: SectionsContent = {}
    for (const s of state.sections) {
      sectionsContent[s.id] = {
        raw_input: s.content,
        is_locked: s.isLocked,
        last_edited: s.lastEdited || undefined,
      }
    }
    save(sectionsContent)
  }, [state.sections, state.isDirty, save])

  const updateContent = useCallback((sectionId: string, content: string) => {
    dispatch({ type: 'UPDATE_CONTENT', sectionId, content })
  }, [])

  const toggleLock = useCallback((sectionId: string) => {
    dispatch({ type: 'TOGGLE_LOCK', sectionId })
  }, [])

  const clearSection = useCallback((sectionId: string) => {
    dispatch({ type: 'CLEAR_SECTION', sectionId })
  }, [])

  const addSection = useCallback((section: SectionState) => {
    dispatch({ type: 'ADD_SECTION', section })
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    dispatch({ type: 'REMOVE_SECTION', sectionId })
  }, [])

  const reorder = useCallback((sectionIds: string[]) => {
    dispatch({ type: 'REORDER', sectionIds })
  }, [])

  const setGenerating = useCallback((value: boolean) => {
    dispatch({ type: 'SET_GENERATING', value })
  }, [])

  const setGeneratedContent = useCallback((content: string) => {
    dispatch({ type: 'SET_GENERATED_CONTENT', content })
  }, [])

  const getSectionsContent = useCallback((): SectionsContent => {
    const sc: SectionsContent = {}
    for (const s of state.sections) {
      sc[s.id] = {
        raw_input: s.content,
        is_locked: s.isLocked,
        last_edited: s.lastEdited || undefined,
      }
    }
    return sc
  }, [state.sections])

  return {
    sections: state.sections,
    isDirty: state.isDirty,
    isGenerating: state.isGenerating,
    generatedContent: state.generatedContent,
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
  }
}
