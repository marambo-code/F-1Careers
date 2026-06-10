import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sponsor and Retain International Talent',
  description: 'Help your international employees secure green cards through EB-1A and EB-2 NIW. Petition framework generation and immigration strategy built for employers.',
  alternates: { canonical: '/for-employers' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
