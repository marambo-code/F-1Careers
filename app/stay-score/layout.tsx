import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Green Card Risk Score for F-1 and H-1B',
  description: 'See how exposed your US status is to the latest policy changes, and the strongest move to protect it. Free Risk Score for international students and professionals.',
  alternates: { canonical: '/stay-score' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
