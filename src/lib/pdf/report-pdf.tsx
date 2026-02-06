import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 50,
    color: '#1a1a1a',
  },
  coverPage: {
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 50,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#0065A3',
  },
  coverSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  coverOrg: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 30,
    color: '#333',
  },
  coverDate: {
    fontSize: 11,
    textAlign: 'center',
    color: '#999',
    marginTop: 8,
  },
  tocTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    color: '#0065A3',
  },
  tocItem: {
    fontSize: 11,
    marginBottom: 6,
    color: '#333',
  },
  tocSubItem: {
    fontSize: 10,
    marginBottom: 4,
    paddingLeft: 15,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#0065A3',
  },
  subsectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
    color: '#333',
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 8,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#999',
  },
})

interface ReportPDFProps {
  title: string
  orgName: string
  year?: number | null
  period?: string | null
  content: string
  sections?: { title: string; level: number }[]
}

export function ReportPDF({
  title,
  orgName,
  year,
  period,
  content,
  sections,
}: ReportPDFProps) {
  const periodLabel = period
    ? { annual: 'Helår', h1: 'Halvår 1', h2: 'Halvår 2', q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' }[period] || period
    : ''

  // Split content into paragraphs
  const paragraphs = content.split('\n').filter((p) => p.trim())

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>{title}</Text>
          {year && (
            <Text style={styles.coverSubtitle}>
              {periodLabel ? `${periodLabel} ${year}` : `${year}`}
            </Text>
          )}
          <Text style={styles.coverOrg}>{orgName}</Text>
          <Text style={styles.coverDate}>
            {new Date().toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </Page>

      {/* Table of contents */}
      {sections && sections.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.tocTitle}>Innehållsförteckning</Text>
          {sections.map((s, i) => (
            <Text
              key={i}
              style={s.level === 1 ? styles.tocItem : styles.tocSubItem}
            >
              {s.title}
            </Text>
          ))}
          <View style={styles.footer}>
            <Text>{orgName}</Text>
            <Text>Skapad med verksamhetsrapport.se</Text>
          </View>
        </Page>
      )}

      {/* Content */}
      <Page size="A4" style={styles.page}>
        {paragraphs.map((p, i) => {
          const trimmed = p.trim()
          // Detect headings (lines that are short and possibly numbered)
          const isMainHeading = /^(\d+\.?\s+)?[A-ZÅÄÖ]/.test(trimmed) && trimmed.length < 80 && !trimmed.endsWith('.')
          const isSubHeading = /^\s*(\d+\.\d+|[-–•])/.test(trimmed) && trimmed.length < 80

          if (isMainHeading && !isSubHeading) {
            return <Text key={i} style={styles.sectionTitle}>{trimmed}</Text>
          }
          if (isSubHeading) {
            return <Text key={i} style={styles.subsectionTitle}>{trimmed}</Text>
          }
          return <Text key={i} style={styles.paragraph}>{trimmed}</Text>
        })}
        <View style={styles.footer} fixed>
          <Text>{orgName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
