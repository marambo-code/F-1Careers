import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Immigration ROI Calculator',
  description: 'Estimate the financial cost of losing US work authorization and the value of securing a green card. Free calculator for F-1, OPT, and H-1B holders.',
  alternates: { canonical: '/roi-calculator' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
