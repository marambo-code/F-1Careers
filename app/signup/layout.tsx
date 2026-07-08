import type { Metadata } from 'next'

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Create Your Account',
  description: 'Create a free F-1 Careers account to check your EB-1A and EB-2 NIW self-petition eligibility.',
  alternates: { canonical: '/signup' },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
