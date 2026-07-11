import Nav from '@/components/ui/Nav'
import Link from 'next/link'
import SocialLinks from '@/components/SocialLinks'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
      {/* Branded app footer: full logo on navy, matching the signup page and
          public SiteFooter. The mobile tab bar sits at the top of the screen
          (sticky below the top nav), so this footer never overlaps it. */}
      <footer className="bg-navy mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Link href="/dashboard" className="inline-block no-underline">
              <img
                src="/logo-f1careers-transparent.png"
                alt="F-1 Careers"
                width={488}
                height={481}
                className="h-20 w-auto"
              />
            </Link>
            <SocialLinks iconClassName="w-4 h-4" linkClassName="text-blue-200 hover:text-white" />
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/privacy" className="text-xs text-blue-200 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-blue-200 hover:text-white transition-colors">Terms of Service</Link>
              <a href="https://community.f-1careers.com" target="_blank" rel="noopener" className="text-xs text-blue-200 hover:text-white transition-colors">Community</a>
              <a href="mailto:support@f-1careers.com" className="text-xs text-blue-200 hover:text-white transition-colors">Support</a>
            </div>
            <p className="text-xs text-blue-200/80">© {new Date().getFullYear()} F-1 Careers. Not legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
