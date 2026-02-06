import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Verksamhetsrapport.se',
    template: '%s | Verksamhetsrapport.se',
  },
  description:
    'Skapa professionella verksamhetsberättelser med AI. Spara tid och få enhetliga, välskrivna rapporter anpassade efter din organisations stil.',
  keywords: [
    'verksamhetsberättelse',
    'verksamhetsrapport',
    'årsberättelse',
    'AI',
    'förening',
    'stiftelse',
    'rapportgenerator',
  ],
  authors: [{ name: 'Verksamhetsrapport.se' }],
  creator: 'Verksamhetsrapport.se',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: '/',
    siteName: 'Verksamhetsrapport.se',
    title: 'Verksamhetsrapport.se - Skapa verksamhetsberättelser med AI',
    description:
      'Skapa professionella verksamhetsberättelser med AI. Spara tid och få enhetliga, välskrivna rapporter.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verksamhetsrapport.se',
    description: 'Skapa professionella verksamhetsberättelser med AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
