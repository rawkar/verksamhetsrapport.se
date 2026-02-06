export interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list-item'
  text: string
  ordered?: boolean
  index?: number
}

export function parseMarkdown(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const lines = content.split('\n')

  let listIndex = 0
  let inOrderedList = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed === '---' || trimmed === '***') continue

    const clean = (s: string) =>
      s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: clean(trimmed.slice(5)) })
      listIndex = 0
      inOrderedList = false
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: clean(trimmed.slice(4)) })
      listIndex = 0
      inOrderedList = false
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: clean(trimmed.slice(3)) })
      listIndex = 0
      inOrderedList = false
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: clean(trimmed.slice(2)) })
      listIndex = 0
      inOrderedList = false
    } else if (/^[-*\u2022]\s+/.test(trimmed)) {
      blocks.push({
        type: 'list-item',
        text: clean(trimmed.replace(/^[-*\u2022]\s+/, '')),
        ordered: false,
      })
      inOrderedList = false
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOrderedList) {
        listIndex = 0
        inOrderedList = true
      }
      listIndex++
      blocks.push({
        type: 'list-item',
        text: clean(trimmed.replace(/^\d+\.\s+/, '')),
        ordered: true,
        index: listIndex,
      })
    } else {
      blocks.push({ type: 'paragraph', text: clean(trimmed) })
      listIndex = 0
      inOrderedList = false
    }
  }

  return blocks
}
