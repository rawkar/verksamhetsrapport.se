export async function extractText(
  fileBuffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return extractFromPDF(fileBuffer)
    case 'docx':
      return extractFromDOCX(fileBuffer)
    case 'txt':
      return fileBuffer.toString('utf-8')
    default:
      throw new Error(`Filtyp stöds inte: ${fileType}`)
  }
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import('pdf-parse')
  const pdfParse = ('default' in pdfParseModule ? pdfParseModule.default : pdfParseModule) as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(buffer)
  return data.text
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
