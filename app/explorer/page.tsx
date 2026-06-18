import type { Metadata } from 'next'
import Link from 'next/link'
import BrandLink from '@/components/BrandLink'
import SiteFooter from '@/components/SiteFooter'
import ExplorerEmbed from '@/components/explorer/ExplorerEmbed'

export const metadata: Metadata = {
  title: 'Self-Petition Eligibility Check: EB-1A and EB-2 NIW Green Cards | F-1 Careers',
  description:
    'A free check of the green cards you can file yourself, with no employer: EB-1A (extraordinary ability) and EB-2 NIW (national interest waiver). Learn both routes, test your fit against the criteria, and see your real 2026 filing costs.',
  alternates: { canonical: '/explorer' },
  openGraph: {
    title: 'Self-Petition Eligibility Check: EB-1A and EB-2 NIW',
    description:
      'Learn the two green cards you can file yourself, with no employer, and see if you qualify. Free.',
    url: '/explorer',
    type: 'website',
  },
}

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <BrandLink className="flex items-center gap-2 no-underline shrink-0">
            <span className="text-[17px] sm:text-[19px] font-extrabold text-navy tracking-tight whitespace-nowrap">F-1 Careers</span>
          </BrandLink>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link href="/login" className="text-sm text-mid font-medium hover:text-navy transition-colors px-2 sm:px-3 py-2 whitespace-nowrap">Sign in</Link>
            <Link href="/start" className="text-sm font-bold text-white bg-navy px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
              <span className="sm:hidden">Get my report →</span>
              <span className="hidden sm:inline">Get my readiness report →</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-6 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal mb-3">Free tool</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
          Self-Petition Eligibility Check
        </h1>
        <p className="text-base text-mid mt-3 max-w-2xl mx-auto leading-relaxed">
          Free. See which green card you can file yourself, EB-1A or EB-2 NIW, and whether you&apos;d qualify. The full diagnostic comes next.
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
