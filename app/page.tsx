import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-navy tracking-tight">F-1 Careers</span>
            <span className="text-teal text-xs font-bold bg-teal/10 px-2 py-0.5 rounded border border-teal/20">AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-mid font-medium hover:text-navy transition-colors">Sign in</Link>
            <Link href="/signup" className="bg-navy text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-navy/90 transition-colors">
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-teal/15 border border-teal/30 text-teal text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
            AI-Powered · Built for F-1, OPT, H-1B, and EB Petitioners
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            Your visa strategy,<br />
            <span className="text-teal">built by AI.</span>
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            F-1 Careers analyzes your profile against USCIS criteria and tells you exactly which visa pathway fits — and exactly what to do next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="bg-teal text-white font-bold text-lg px-8 py-4 rounded-2xl hover:bg-teal/90 transition-all hover:scale-105 shadow-lg shadow-teal/30">
              Get my career strategy →
            </Link>
            <Link href="#products" className="text-blue-200 font-medium text-sm hover:text-white transition-colors">
              See what's included ↓
            </Link>
          </div>
          <p className="text-blue-300 text-xs mt-6">Preview free · Pay only if you want the full report</p>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
            {[
              { n: 'EB-1A', d: 'Extraordinary Ability' },
              { n: 'EB-2 NIW', d: 'National Interest Waiver' },
              { n: 'O-1 · H-1B', d: 'Temporary Visas' },
            ].map(s => (
              <div key={s.n}>
                <p className="text-white font-bold text-lg">{s.n}</p>
                <p className="text-blue-300 text-xs mt-0.5">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ────────────────────────────────────────────────── */}
      <section id="products" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy">Two tools. One goal: your green card.</h2>
          <p className="text-mid mt-3 max-w-xl mx-auto">Built specifically for international professionals who can't afford to get this wrong.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Career Strategy */}
          <div className="rounded-2xl border-2 border-teal/20 p-8 space-y-6 hover:border-teal/50 transition-colors">
            <div className="w-12 h-12 bg-teal/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-navy">Career Strategy Report</h3>
                <span className="text-2xl font-bold text-teal">$300</span>
              </div>
              <p className="text-mid text-sm leading-relaxed">
                Complete criterion-by-criterion EB-1A and NIW assessment with a personalized 12-month roadmap. Preview free before paying.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                'EB-1A all 10 criteria rated (Strong / Developing / Gap)',
                'NIW Dhanasar three-prong analysis',
                'Visa pathway feasibility ranking',
                'Evidence mapping tied to your profile',
                'Gap analysis with specific action items',
                '3 / 6 / 12-month career + immigration roadmap',
                'Downloadable PDF — attorney-ready format',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-mid">
                  <span className="text-teal font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full bg-teal text-white font-bold py-3.5 rounded-xl text-center hover:bg-teal/90 transition-colors text-sm">
              Start questionnaire — preview free →
            </Link>
          </div>

          {/* RFE Analyzer */}
          <div className="rounded-2xl border-2 border-navy/20 p-8 space-y-6 hover:border-navy/40 transition-colors">
            <div className="w-12 h-12 bg-navy/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-navy">RFE Response Analyzer</h3>
                <span className="text-2xl font-bold text-navy">$200</span>
              </div>
              <p className="text-mid text-sm leading-relaxed">
                Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy. Works for EB-1A, NIW, H-1B, O-1, and more.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                'Every RFE issue identified and ranked by risk',
                'Plain English translation of USCIS legalese',
                'Evidence checklist for each issue',
                'Response strategy: Rebut / Supplement / Narrow',
                'Cites controlling cases (Kazarian, Dhanasar, etc.)',
                'Priority action list ordered by urgency',
                'Downloadable PDF — hand directly to attorney',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-mid">
                  <span className="text-navy font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full bg-navy text-white font-bold py-3.5 rounded-xl text-center hover:bg-navy/90 transition-colors text-sm">
              Upload RFE — preview free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-navy text-center mb-14">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Answer the questionnaire',
                body: 'Rate your evidence against each USCIS criterion. Takes 5 minutes. Your profile data pre-fills where possible.',
              },
              {
                step: '02',
                title: 'Get your free preview',
                body: 'See your top visa pathway, overall profile strength, and a teaser of the full analysis — before paying anything.',
              },
              {
                step: '03',
                title: 'Unlock the full report',
                body: 'Pay once for your full criterion breakdown, evidence map, gap analysis, and 12-month roadmap. Download as PDF.',
              },
            ].map(s => (
              <div key={s.step} className="text-center space-y-3">
                <div className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-sm mx-auto">{s.step}</div>
                <h3 className="font-bold text-navy">{s.title}</h3>
                <p className="text-mid text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-navy">Built for international professionals</h2>
          <p className="text-mid mt-3">If you're navigating the US immigration system without a roadmap, this is for you.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { who: 'F-1 OPT / STEM OPT', desc: 'Running out of time before your work authorization expires.' },
            { who: 'H-1B holders', desc: 'Want a path to a green card that doesn't depend on your employer.' },
            { who: 'EB-1A / NIW filers', desc: 'Unsure if your evidence is strong enough or which pathway to pursue.' },
            { who: 'RFE recipients', desc: 'Just received a USCIS Request for Evidence and need a response strategy fast.' },
            { who: 'Researchers & PhDs', desc: 'Have publications, citations, and contributions but don't know how USCIS sees them.' },
            { who: 'Self-petitioners', desc: 'Filing without employer sponsorship and need to understand what it takes.' },
          ].map(c => (
            <div key={c.who} className="rounded-xl border border-border p-5 hover:border-teal/30 transition-colors">
              <p className="font-bold text-navy text-sm">{c.who}</p>
              <p className="text-mid text-sm mt-1 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-4xl font-bold">Stop guessing. Start knowing.</h2>
          <p className="text-blue-200 leading-relaxed">
            Most international professionals spend years uncertain about which visa path is right for them. Get clarity in 5 minutes — free preview, no commitment.
          </p>
          <Link href="/signup" className="inline-block bg-teal text-white font-bold text-lg px-10 py-4 rounded-2xl hover:bg-teal/90 transition-all hover:scale-105 shadow-lg shadow-teal/30">
            Get started free →
          </Link>
          <p className="text-blue-300 text-xs">No subscription · Preview free · Pay only for the full report</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-mid">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">F-1 Careers</span>
            <span className="text-teal text-xs font-bold bg-teal/10 px-1.5 py-0.5 rounded">AI</span>
          </div>
          <p className="text-xs">This tool provides career strategy analysis only and does not constitute legal advice. Consult a licensed immigration attorney before filing.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-navy transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-navy transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
