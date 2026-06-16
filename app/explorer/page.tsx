import type { Metadata } from 'next'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import ExplorerEmbed from '@/components/explorer/ExplorerEmbed'

export const metadata: Metadata = {
  title: 'Free Green Card Eligibility Explorer — EB-1A vs EB-2 NIW | F-1 Careers',
  description:
    'Explore both self-petitioned U.S. green card paths, EB-1A (extraordinary ability) and EB-2 NIW (national interest waiver). Test your fit against the criteria and see your real 2026 filing costs. Free, no employer or job offer required.',
  alternates: { canonical: '/explorer' },
  openGraph: {
    title: 'Free Green Card Eligibility Explorer — EB-1A vs EB-2 NIW',
    description:
      'Two routes let you self-petition a U.S. green card with no employer. Explore both, test your fit, and see your 2026 costs.',
    url: '/explorer',
    type: 'website',
  },
}

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-[19px] font-extrabold text-navy tracking-tight">F-1 Careers</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="text-sm text-mid font-medium hover:text-navy transition-colors px-3 py-2">Sign in</Link>
            <Link href="/start" className="text-sm font-bold text-white bg-navy px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">Get started free →</Link>
          </div>
        </div>
      </nav>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-6 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal mb-3">Free tool</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
          Could you self-petition a US green card? Find out free.
        </h1>
        <p className="text-base text-mid mt-3 max-w-2xl mx-auto leading-relaxed">
          Most people think a green card needs an employer. Two routes do not. Explore both EB-1A and EB-2 NIW, test your fit against the criteria, and see your real 2026 filing costs.
        </p>
      </section>

      {/* Tool */}
      <section className="max-w-5xl mx-auto px-3 sm:px-6 pb-16">
        <ExplorerEmbed />
      </section>

      <SiteFooter />
    </div>
  )
}
