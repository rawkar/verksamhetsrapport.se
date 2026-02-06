import { jsPDF } from 'jspdf'

interface ReportPDFOptions {
  title: string
  orgName: string
  year?: number | null
  period?: string | null
  content: string
  sections?: { title: string; level: number }[]
}

const COLORS = {
  primary: [0, 101, 163] as [number, number, number],
  dark: [26, 26, 26] as [number, number, number],
  gray: [102, 102, 102] as [number, number, number],
  lightGray: [153, 153, 153] as [number, number, number],
}

const PAGE = {
  width: 210,
  height: 297,
  marginX: 25,
  marginTop: 30,
  marginBottom: 25,
}

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2

export function generatePDFBuffer(options: ReportPDFOptions): ArrayBuffer {
  const { title, orgName, year, period, content, sections } = options

  const periodLabel = period
    ? { annual: 'Helår', h1: 'Halvår 1', h2: 'Halvår 2', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' }[period] || period
    : ''

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // --- Cover page ---
  const centerY = PAGE.height / 2 - 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...COLORS.primary)
  doc.text(title, PAGE.width / 2, centerY, { align: 'center', maxWidth: CONTENT_WIDTH })

  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH)
  let y = centerY + titleLines.length * 12

  if (year) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.gray)
    const subtitle = periodLabel ? `${periodLabel} ${year}` : `${year}`
    doc.text(subtitle, PAGE.width / 2, y, { align: 'center' })
    y += 10
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.dark)
  doc.text(orgName, PAGE.width / 2, y + 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.lightGray)
  const dateStr = new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(dateStr, PAGE.width / 2, y + 25, { align: 'center' })

  // --- Table of contents ---
  if (sections && sections.length > 0) {
    doc.addPage()
    y = PAGE.marginTop

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...COLORS.primary)
    doc.text('Innehållsförteckning', PAGE.marginX, y)
    y += 12

    for (const s of sections) {
      doc.setFontSize(s.level === 1 ? 11 : 10)
      doc.setFont('helvetica', s.level === 1 ? 'bold' : 'normal')
      doc.setTextColor(s.level === 1 ? COLORS.dark[0] : COLORS.gray[0], s.level === 1 ? COLORS.dark[1] : COLORS.gray[1], s.level === 1 ? COLORS.dark[2] : COLORS.gray[2])
      const indent = s.level === 1 ? 0 : 8
      doc.text(s.title, PAGE.marginX + indent, y)
      y += s.level === 1 ? 7 : 5
    }

    addFooter(doc, orgName)
  }

  // --- Content pages ---
  doc.addPage()
  y = PAGE.marginTop

  const paragraphs = content.split('\n').filter((p) => p.trim())

  for (const p of paragraphs) {
    const trimmed = p.trim()
    const isMainHeading = /^(\d+\.?\s+)?[A-ZÅÄÖ]/.test(trimmed) && trimmed.length < 80 && !trimmed.endsWith('.')
    const isSubHeading = /^\s*(\d+\.\d+|[-–•])/.test(trimmed) && trimmed.length < 80

    if (isMainHeading && !isSubHeading) {
      // Check if we need a new page (heading shouldn't be at bottom)
      if (y > PAGE.height - 50) {
        addFooter(doc, orgName)
        doc.addPage()
        y = PAGE.marginTop
      }

      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...COLORS.primary)
      doc.text(trimmed, PAGE.marginX, y)
      y += 8
    } else if (isSubHeading) {
      if (y > PAGE.height - 40) {
        addFooter(doc, orgName)
        doc.addPage()
        y = PAGE.marginTop
      }

      y += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...COLORS.dark)
      doc.text(trimmed, PAGE.marginX, y)
      y += 6
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.dark)

      const lines = doc.splitTextToSize(trimmed, CONTENT_WIDTH)

      for (const line of lines) {
        if (y > PAGE.height - PAGE.marginBottom - 5) {
          addFooter(doc, orgName)
          doc.addPage()
          y = PAGE.marginTop
        }
        doc.text(line, PAGE.marginX, y)
        y += 4.5
      }
      y += 3 // paragraph spacing
    }
  }

  addFooter(doc, orgName)

  return doc.output('arraybuffer')
}

function addFooter(doc: jsPDF, orgName: string) {
  const pageCount = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.lightGray)
  doc.text(orgName, PAGE.marginX, PAGE.height - 10)
  doc.text(`${pageCount}`, PAGE.width - PAGE.marginX, PAGE.height - 10, { align: 'right' })
}
