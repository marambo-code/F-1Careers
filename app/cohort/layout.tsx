import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Green Card Cohort for International Professionals',
  description: 'Build your EB-1A or EB-2 NIW petition alongside a cohort of international professionals. Structured guidance, accountability, and shared resources.',
  alternates: { canonical: '/cohort' },
  openGraph: {
    title: 'Green Card Cohort for International Professionals | F-1 Careers',
    description: 'Build your EB-1A or EB-2 NIW petition alongside a cohort of international professionals.',
    url: '/cohort',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
