import Link from 'next/link'
import SocialLinks from '@/components/SocialLinks'

// Shared marketing footer for public pages (tools, employers, etc.).
export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white py-7 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col items-center sm:items-start gap-3">
          <Link href="/" className="font-extrabold text-navy text-[15px] no-underline">F-1 Careers</Link>
          <SocialLinks />
        </div>
        <p className="text-[11px] text-slate-400 max-w-sm text-center leading-relaxed">
          This tool provides green card strategy information only and is not legal advice. Consult a licensed immigration attorney before filing.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/stay-score" className="text-sm text-mid hover:text-navy transition-colors">Risk Score</Link>
          <Link href="/roi-calculator" className="text-sm text-mid hover:text-navy transition-colors">ROI Calc</Link>
          <Link href="/for-employers" className="text-sm text-mid hover:text-navy transition-colors">For Employers</Link>
          <Link href="/privacy" className="text-sm text-mid hover:text-navy transition-colors">Privacy</Link>
          <Link href="/terms" className="text-sm text-mid hover:text-navy transition-colors">Terms</Link>
          <Link href="/login" className="text-sm text-mid hover:text-navy transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}
