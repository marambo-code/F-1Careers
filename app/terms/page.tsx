import Link from 'next/link'
import BrandLink from '@/components/BrandLink'
import LegalDoc from '@/components/LegalDoc'
import { loadLegalMarkdown } from '@/lib/legal'

export const metadata = { title: 'Terms of Service, F-1 Careers' }

export default function TermsPage() {
  const markdown = loadLegalMarkdown('terms-of-service.md')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLink className="text-navy font-bold text-lg">F-1 Careers</BrandLink>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-teal font-semibold hover:underline">Sign in →</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 text-navy">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-mid mt-2 text-sm">Last updated: June 22, 2026</p>
        </div>

        <LegalDoc markdown={markdown} />
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-mid">
        <p>© 2026 F-1 Careers · Not legal advice · <Link href="/" className="text-teal hover:underline">Home</Link> · <Link href="/privacy" className="text-teal hover:underline">Privacy Policy</Link></p>
      </footer>
    </div>
  )
}
