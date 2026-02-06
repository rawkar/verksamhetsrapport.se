import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  BorderStyle,
  TableOfContents,
  StyleLevel,
  Packer,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  Tab,
  TabStopType,
  TabStopPosition,
} from 'docx'
import { parseMarkdown } from './markdown-parser'
import type { ReportExportOptions } from '@/lib/pdf/report-pdf'

const TRS_BLUE = '184B65'
const TRS_DARK = '1E1E1E'
const TRS_GRAY = '646464'
const TRS_LIGHT_GRAY = 'A0A0A0'
const TRS_RULE = 'C8D7E1'

export async function generateDocxBuffer(options: ReportExportOptions): Promise<Buffer> {
  const { title, orgName, year, period, content, sections } = options

  const periodLabel = period
    ? ({ annual: 'Helår', h1: 'Halvår 1', h2: 'Halvår 2', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' } as Record<string, string>)[period] || period
    : ''

  const dateStr = new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const blocks = parseMarkdown(content)

  // --- Build cover page ---
  const coverParagraphs: Paragraph[] = [
    // Spacer to push title down
    ...Array.from({ length: 8 }, () => new Paragraph({ text: '' })),

    // Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 56,
          color: TRS_BLUE,
          font: 'Arial',
        }),
      ],
    }),

    // Separator line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: TRS_RULE },
      },
      children: [new TextRun({ text: '' })],
    }),

    // Year/period
    ...(year
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: periodLabel ? `${periodLabel} ${year}` : `${year}`,
                size: 28,
                color: TRS_GRAY,
                font: 'Arial',
              }),
            ],
          }),
        ]
      : []),

    // Org name
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: orgName,
          bold: true,
          size: 32,
          color: TRS_DARK,
          font: 'Arial',
        }),
      ],
    }),

    // Date
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: dateStr,
          size: 20,
          color: TRS_LIGHT_GRAY,
          font: 'Arial',
        }),
      ],
    }),

    // Page break after cover
    new Paragraph({
      children: [new PageBreak()],
    }),
  ]

  // --- Build TOC ---
  const tocParagraphs: Paragraph[] = []
  if (sections && sections.length > 0) {
    tocParagraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'Innehållsförteckning',
            bold: true,
            size: 36,
            color: TRS_BLUE,
            font: 'Arial',
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: TRS_RULE },
        },
        spacing: { after: 300 },
        children: [new TextRun({ text: '' })],
      })
    )

    for (const s of sections) {
      tocParagraphs.push(
        new Paragraph({
          spacing: { after: s.level === 1 ? 120 : 80 },
          indent: { left: s.level === 1 ? 0 : 400 },
          children: [
            new TextRun({
              text: s.title,
              bold: s.level === 1,
              size: s.level === 1 ? 22 : 20,
              color: s.level === 1 ? TRS_DARK : TRS_GRAY,
              font: 'Arial',
            }),
          ],
        })
      )
    }

    tocParagraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )
  }

  // --- Build content ---
  const contentParagraphs: Paragraph[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'h1':
        contentParagraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: 36,
                color: TRS_BLUE,
                font: 'Arial',
              }),
            ],
          })
        )
        break

      case 'h2':
        // Page break before H2 (except first one)
        if (contentParagraphs.length > 0) {
          contentParagraphs.push(
            new Paragraph({ children: [new PageBreak()] })
          )
        }
        contentParagraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: TRS_RULE },
            },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: 28,
                color: TRS_BLUE,
                font: 'Arial',
              }),
            ],
          })
        )
        break

      case 'h3':
        contentParagraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 100 },
            border: {
              left: { style: BorderStyle.SINGLE, size: 6, color: TRS_BLUE, space: 8 },
            },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: 22,
                color: TRS_DARK,
                font: 'Arial',
              }),
            ],
          })
        )
        break

      case 'h4':
        contentParagraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                size: 20,
                color: TRS_DARK,
                font: 'Arial',
              }),
            ],
          })
        )
        break

      case 'list-item':
        contentParagraphs.push(
          new Paragraph({
            bullet: block.ordered ? undefined : { level: 0 },
            numbering: block.ordered ? { reference: 'ordered-list', level: 0 } : undefined,
            spacing: { after: 60 },
            indent: { left: 400 },
            children: [
              new TextRun({
                text: block.text,
                size: 20,
                color: TRS_DARK,
                font: 'Georgia',
              }),
            ],
          })
        )
        break

      case 'paragraph':
        contentParagraphs.push(
          new Paragraph({
            spacing: { after: 200, line: 360 },
            children: [
              new TextRun({
                text: block.text,
                size: 20,
                color: TRS_DARK,
                font: 'Georgia',
              }),
            ],
          })
        )
        break
    }
  }

  // --- Assemble document ---
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            {
              level: 0,
              format: NumberFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: orgName,
                    size: 16,
                    color: TRS_LIGHT_GRAY,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: TRS_LIGHT_GRAY,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...coverParagraphs, ...tocParagraphs, ...contentParagraphs],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
