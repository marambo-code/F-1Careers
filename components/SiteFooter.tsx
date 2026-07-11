import Link from 'next/link'
import BrandLink from '@/components/BrandLink'
import SocialLinks from '@/components/SocialLinks'

// Shared marketing footer for public pages (tools, employers, etc.).
// Dark navy treatment to match the signup page: full transparent logo
// (which includes the wordmark) on bg-navy with light text.
export default function SiteFooter() {
  return (
    <footer className="bg-navy border-t border-white/10 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 flex-wrap">
        <div className="flex flex-col items-center sm:items-start gap-3">
          <BrandLink className="inline-block no-underline">
            <img
              src="/logo-f1careers-transparent.png"
              alt="F-1 Careers"
              width={488}
              height={481}
              className="h-24 w-auto"
            />
          </BrandLink>
          <SocialLinks linkClassName="text-blue-200 hover:text-white" />
        </div>
        <p className="text-[11px] text-blue-200/80 max-w-sm text-center leading-relaxed">
          This tool provides green card strategy information only and is not legal advice. Consult a licensed immigration attorney before filing.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/explorer" className="text-sm text-blue-200 hover:text-white transition-colors">Eligibility Check</Link>
          <Link href="/stay-score" className="text-sm text-blue-200 hover:text-white transition-colors">Risk Score</Link>
          <Link href="/for-employers" className="text-sm text-blue-200 hover:text-white transition-colors">For Employers</Link>
          <a href="https://community.f-1careers.com" target="_blank" rel="noopener" className="text-sm text-blue-200 hover:text-white transition-colors">Community</a>
          <Link href="/privacy" className="text-sm text-blue-200 hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="text-sm text-blue-200 hover:text-white transition-colors">Terms</Link>
          <Link href="/login" className="text-sm text-blue-200 hover:text-white transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}
