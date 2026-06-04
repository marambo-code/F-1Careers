import Nav from '@/components/ui/Nav'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-mid">© {new Date().getFullYear()} F-1 Careers. Not legal advice.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-mid hover:text-navy transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-mid hover:text-navy transition-colors">Terms of Service</Link>
            <a href="mailto:support@f1careers.app" className="text-xs text-mid hover:text-navy transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
