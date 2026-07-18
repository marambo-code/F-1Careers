import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.f-1careers.com'),
  title: {
    default: 'F-1 Careers, Green Card Strategy for International Professionals',
    template: '%s | F-1 Careers',
  },
  description: 'Find your real EB-1A and EB-2 NIW green card odds. Self-petition strategy for international students and professionals on F-1, OPT, and H-1B. Free score.',
  keywords: [
    'EB-1A', 'EB-2 NIW', 'national interest waiver', 'green card', 'F-1 visa',
    'OPT', 'H-1B', 'self-petition', 'Dhanasar', 'extraordinary ability',
    'green card for international students',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'F-1 Careers',
    url: 'https://www.f-1careers.com',
    title: 'F-1 Careers, Green Card Strategy for International Professionals',
    description: 'Find your real EB-1A and EB-2 NIW green card odds. Free score, built for F-1, OPT, and H-1B.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'F-1 Careers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F-1 Careers, Green Card Strategy',
    description: 'Find your real EB-1A and EB-2 NIW green card odds. Free score.',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
