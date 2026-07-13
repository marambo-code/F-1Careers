import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Green Cards as an Employee Benefit, No Sponsorship Required',
  description: 'Your international employees can self-petition for EB-1A and EB-2 NIW green cards. No H-1B lottery, no PERM, and your company signs nothing with USCIS. You pay for the benefit, they own the case.',
  alternates: { canonical: '/for-employers' },
  openGraph: {
    title: 'Green Cards as an Employee Benefit | F-1 Careers',
    description: 'Your international employees can self-petition for EB-1A and EB-2 NIW green cards. No lottery, no PERM, no employer sponsorship.',
    url: '/for-employers',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
