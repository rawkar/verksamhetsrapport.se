import { jsPDF } from 'jspdf'

interface ReportPDFOptions {
  title: string
  orgName: string
  year?: number | null
  period?: string | null
  content: string
  sections?: { title: string; level: number }[]
}

const TRS = {
  blue: [24, 75, 101] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
  lightGray: [160, 160, 160] as [number, number, number],
  ruleLine: [200, 215, 225] as [number, number, number],
}

const PAGE = {
  width: 210,
  height: 297,
  marginX: 25,
  marginTop: 30,
  marginBottom: 25,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2

interface ParsedBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list-item'
  text: string
  ordered?: boolean
  index?: number
}

function parseMarkdown(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const lines = content.split('\n')

  let listIndex = 0
  let inOrderedList = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed === '---' || trimmed === '***') continue

    // Strip bold/italic markers for PDF text
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

export function generatePDFBuffer(options: ReportPDFOptions): ArrayBuffer {
  const { title, orgName, year, period, content, sections } = options

  const periodLabel = period
    ? ({ annual: 'Helår', h1: 'Halvår 1', h2: 'Halvår 2', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' } as Record<string, string>)[period] || period
    : ''

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // --- Cover page ---
  // Decorative top bar
  doc.setFillColor(...TRS.blue)
  doc.rect(0, 0, PAGE.width, 8, 'F')

  const centerY = PAGE.height / 2 - 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...TRS.blue)
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH)
  doc.text(titleLines, PAGE.width / 2, centerY, { align: 'center' })

  let y = centerY + titleLines.length * 12 + 5

  // Thin line separator
  doc.setDrawColor(...TRS.ruleLine)
  doc.setLineWidth(0.5)
  doc.line(PAGE.width / 2 - 30, y, PAGE.width / 2 + 30, y)
  y += 12

  if (year) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.setTextColor(...TRS.gray)
    const subtitle = periodLabel ? `${periodLabel} ${year}` : `${year}`
    doc.text(subtitle, PAGE.width / 2, y, { align: 'center' })
    y += 10
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...TRS.dark)
  doc.text(orgName, PAGE.width / 2, y + 8, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...TRS.lightGray)
  const dateStr = new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(dateStr, PAGE.width / 2, y + 18, { align: 'center' })

  // Bottom bar on cover
  doc.setFillColor(...TRS.blue)
  doc.rect(0, PAGE.height - 8, PAGE.width, 8, 'F')

  // --- Table of contents ---
  if (sections && sections.length > 0) {
    doc.addPage()
    y = PAGE.marginTop

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...TRS.blue)
    doc.text('Innehållsförteckning', PAGE.marginX, y)
    y += 4

    // Line under title
    doc.setDrawColor(...TRS.ruleLine)
    doc.setLineWidth(0.4)
    doc.line(PAGE.marginX, y, PAGE.marginX + CONTENT_WIDTH, y)
    y += 10

    for (const s of sections) {
      doc.setFontSize(s.level === 1 ? 11 : 10)
      doc.setFont('helvetica', s.level === 1 ? 'bold' : 'normal')
      doc.setTextColor(...(s.level === 1 ? TRS.dark : TRS.gray))
      const indent = s.level === 1 ? 0 : 8
      doc.text(s.title, PAGE.marginX + indent, y)
      y += s.level === 1 ? 8 : 6
    }
  }

  // --- Content pages ---
  doc.addPage()
  y = PAGE.marginTop

  const blocks = parseMarkdown(content)

  // Track heading positions for bookmarks
  const headingPositions: { title: string; page: number; y: number; level: number }[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'h1': {
        if (y > PAGE.height - 50) {
          doc.addPage()
          y = PAGE.marginTop
        }
        y += 8
        headingPositions.push({ title: block.text, page: doc.getNumberOfPages(), y, level: 1 })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(...TRS.blue)
        const h1Lines = doc.splitTextToSize(block.text, CONTENT_WIDTH)
        doc.text(h1Lines, PAGE.marginX, y)
        y += h1Lines.length * 8 + 4
        break
      }

      case 'h2': {
        // Page break before H2 if not near top
        if (y > PAGE.marginTop + 20) {
          doc.addPage()
          y = PAGE.marginTop
        }
        y += 4
        headingPositions.push({ title: block.text, page: doc.getNumberOfPages(), y, level: 2 })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(...TRS.blue)
        const h2Lines = doc.splitTextToSize(block.text, CONTENT_WIDTH)
        doc.text(h2Lines, PAGE.marginX, y)
        y += h2Lines.length * 6 + 2
        // Underline
        doc.setDrawColor(...TRS.ruleLine)
        doc.setLineWidth(0.4)
        doc.line(PAGE.marginX, y, PAGE.marginX + CONTENT_WIDTH, y)
        y += 6
        break
      }

      case 'h3': {
        if (y > PAGE.height - 40) {
          doc.addPage()
          y = PAGE.marginTop
        }
        y += 5
        headingPositions.push({ title: block.text, page: doc.getNumberOfPages(), y, level: 3 })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...TRS.dark)
        // Left border indicator
        doc.setDrawColor(...TRS.blue)
        doc.setLineWidth(0.8)
        doc.line(PAGE.marginX, y - 3, PAGE.marginX, y + 1)
        doc.text(block.text, PAGE.marginX + 4, y)
        y += 6
        break
      }

      case 'h4': {
        if (y > PAGE.height - 35) {
          doc.addPage()
          y = PAGE.marginTop
        }
        y += 4
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...TRS.dark)
        doc.text(block.text, PAGE.marginX, y)
        y += 5
        break
      }

      case 'list-item': {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...TRS.dark)

        const bullet = block.ordered ? `${block.index}.` : '-'
        const bulletWidth = block.ordered ? 8 : 5
        const itemLines = doc.splitTextToSize(block.text, CONTENT_WIDTH - bulletWidth - 2)

        for (let i = 0; i < itemLines.length; i++) {
          if (y > PAGE.height - PAGE.marginBottom - 5) {
            doc.addPage()
            y = PAGE.marginTop
          }
          if (i === 0) {
            doc.text(bullet, PAGE.marginX + 2, y)
          }
          doc.text(itemLines[i], PAGE.marginX + bulletWidth + 2, y)
          y += 4.5
        }
        y += 1
        break
      }

      case 'paragraph': {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...TRS.dark)

        const pLines = doc.splitTextToSize(block.text, CONTENT_WIDTH)

        for (const line of pLines) {
          if (y > PAGE.height - PAGE.marginBottom - 5) {
            doc.addPage()
            y = PAGE.marginTop
          }
          doc.text(line, PAGE.marginX, y)
          y += 4.5
        }
        y += 3
        break
      }
    }
  }

  // --- Add page numbers and footer to all pages (skip cover) ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TRS.lightGray)
    doc.text(orgName, PAGE.marginX, PAGE.height - 12)
    doc.text(`${i - 1} / ${totalPages - 1}`, PAGE.width - PAGE.marginX, PAGE.height - 12, {
      align: 'right',
    })
    // Thin line above footer
    doc.setDrawColor(...TRS.ruleLine)
    doc.setLineWidth(0.2)
    doc.line(PAGE.marginX, PAGE.height - 16, PAGE.width - PAGE.marginX, PAGE.height - 16)
  }

  // --- Add PDF outline/bookmarks for accessibility ---
  // Also add internal links from TOC to headings
  if (sections && sections.length > 0 && headingPositions.length > 0) {
    const tocPageNum = 2 // TOC is always page 2

    // Add clickable links on the TOC page
    doc.setPage(tocPageNum)
    let tocY = PAGE.marginTop + 14 // after title + line

    for (const s of sections) {
      const indent = s.level === 1 ? 0 : 8
      const lineHeight = s.level === 1 ? 8 : 6

      // Find matching heading in content
      const match = headingPositions.find((h) => h.title === s.title)
      if (match) {
        doc.link(
          PAGE.marginX + indent,
          tocY - 4,
          CONTENT_WIDTH - indent,
          lineHeight,
          { pageNumber: match.page }
        )
      }

      tocY += lineHeight
    }
  }

  return doc.output('arraybuffer')
}
