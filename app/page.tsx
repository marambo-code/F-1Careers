import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-[19px] font-extrabold text-navy tracking-tight">F-1 Careers</span>
            <span className="text-[10px] font-extrabold text-teal bg-teal/10 border border-teal/25 px-2 py-0.5 rounded-md">AI</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="text-sm text-mid font-medium hover:text-navy transition-colors px-3 py-2">Sign in</Link>
            <Link
              href="/signup"
              className="text-sm font-bold text-white bg-navy px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 900,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(0,194,168,.14) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-0 text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/25 text-teal text-xs font-bold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
            Case Law Trained &nbsp;·&nbsp; Built by F-1 Alumni
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-[-2px] mb-3">
            Your career and visa strategy,<br />
            <span className="text-teal">built by AI.</span>
          </h1>

          <p className="text-[13px] font-bold tracking-[2px] uppercase text-white/40 mb-6">
            Intelligently &nbsp;·&nbsp; Compliantly &nbsp;·&nbsp; Stress-free
          </p>

          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
            AI-powered career and visa strategy trained on Case Law precedent, built by international students who know exactly what you&apos;re going through.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="bg-teal text-white font-extrabold text-lg px-10 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] no-underline"
              style={{ boxShadow: '0 8px 32px rgba(0,194,168,.30)' }}
            >
              Get my free green card preview →
            </Link>
            <Link href="#products" className="text-slate-500 text-sm font-medium hover:text-white transition-colors py-4 px-2">
              See what&apos;s included ↓
            </Link>
          </div>
          <p className="text-slate-600 text-xs pb-16">Preview free &nbsp;·&nbsp; Pay only for the full report</p>
        </div>

        {/* Trust bar */}
        <div className="border-t border-white/[0.07]">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4">
            {[
              { val: 'EB-1A & NIW', lbl: 'Both pathways analyzed' },
              { val: 'Kazarian & Dhanasar', lbl: 'Trained on controlling case law' },
              { val: '4 career moves', lbl: 'Your 90-day action campaign' },
              { val: 'F-1 to green card', lbl: 'Built by those who did it' },
            ].map((item, i) => (
              <div key={i} className="py-5 px-4 text-center border-r border-white/[0.06] last:border-r-0">
                <span className="block text-[15px] font-extrabold text-white">{item.val}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{item.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Origin ───────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-16 md:gap-20">
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-4">Our story</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.2] mb-5">
              From F-1 visa to EB-1A.<br />We&apos;ve navigated every step.
            </h2>
            <p className="text-base text-mid leading-[1.75] mb-4">
              Not from a textbook. From years of first-hand experience navigating the same system you&apos;re in right now.
            </p>
            <p className="text-base text-mid leading-[1.75] mb-4">
              We built F-1 Careers because generations of international students had already figured this out. That knowledge deserved a home.
            </p>
            <p className="text-base text-navy font-semibold leading-[1.75]">
              The tool we wish we had. Trained on the case law that actually decides your petition.
            </p>
          </div>

          <div
            className="flex-shrink-0 w-full md:w-80 bg-navy rounded-2xl p-7"
            style={{ boxShadow: '0 24px 64px rgba(27,43,107,.20)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-teal mb-4">Case Law Trained</p>
            {[
              { tag: 'Kazarian', title: 'Matter of Kazarian', desc: 'EB-1A two-part adjudication standard. All 10 criteria framework.' },
              { tag: 'Dhanasar', title: 'Matter of Dhanasar', desc: 'NIW three-prong test. National interest framework.' },
              { tag: 'Chawathe', title: 'Matter of Chawathe', desc: 'Preponderance of evidence. Burden of proof standard.' },
            ].map((c, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
                <span className="text-[10px] font-bold text-teal w-14 flex-shrink-0 pt-0.5">{c.tag}</span>
                <div>
                  <p className="text-[13px] font-bold text-white">{c.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-[1.5]">{c.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-600 mt-4 pt-3 border-t border-white/[0.06] leading-[1.55]">
              Not generic AI. Trained on the exact standards USCIS adjudicators use to evaluate your petition.
            </p>
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <section id="products" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
            Two tools. One path forward.
          </h2>
          <p className="text-lg text-mid mt-3">For every stage of your immigration journey.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-border rounded-2xl p-9 hover:border-teal/50 hover:shadow-card-hover transition-all">
            <div className="text-2xl mb-5">📊</div>
            <div className="flex items-start justify-between mb-2.5">
              <h3 className="text-[19px] font-extrabold text-navy">Green Card Strategy Report</h3>
              <span className="text-[26px] font-extrabold text-teal ml-4 flex-shrink-0">$300</span>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-6">
              Complete EB-1A and NIW analysis with a personalized 12-month roadmap. Free preview before you pay.
            </p>
            <ul className="space-y-2.5 mb-7">
              {[
                'All 10 EB-1A criteria scored and ranked',
                'NIW Dhanasar three-prong analysis',
                'Visa pathway feasibility ranking',
                'Evidence mapping tied to your actual profile',
                'Gap analysis with specific next steps',
                '3 / 6 / 12-month career and immigration roadmap',
                'Downloadable PDF, attorney-ready format',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-mid">
                  <span className="text-teal font-bold mt-0.5 flex-shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full bg-teal text-white font-bold py-3.5 rounded-xl text-center text-sm hover:opacity-90 transition-opacity no-underline">
              Start questionnaire, preview free →
            </Link>
          </div>

          <div className="border-2 border-border rounded-2xl p-9 hover:border-navy/40 hover:shadow-card-hover transition-all">
            <div className="text-2xl mb-5">📄</div>
            <div className="flex items-start justify-between mb-2.5">
              <h3 className="text-[19px] font-extrabold text-navy">RFE Response Analyzer</h3>
              <span className="text-[26px] font-extrabold text-navy ml-4 flex-shrink-0">$200</span>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-6">
              Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy.
            </p>
            <ul className="space-y-2.5 mb-7">
              {[
                'Every RFE issue identified and ranked by risk',
                'Plain-English translation of USCIS legalese',
                'Evidence checklist for each issue',
                'Response strategy: Rebut, Supplement, or Narrow',
                'Cites controlling cases (Kazarian, Dhanasar)',
                'Priority action list ordered by urgency',
                'Downloadable PDF, hand directly to attorney',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-mid">
                  <span className="text-navy font-bold mt-0.5 flex-shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full bg-navy text-white font-bold py-3.5 rounded-xl text-center text-sm hover:opacity-90 transition-opacity no-underline">
              Upload RFE, preview free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Career Moves / Pro band ───────────────────────────────────── */}
      <section className="bg-navy py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
            <div className="flex-1 min-w-[280px]">
              <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-4">Pro membership</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
                Your <span className="text-teal">career moves.</span><br />
                Not generic advice.
              </h2>
              <p className="text-base text-slate-500 leading-[1.7] mb-3">
                Every month, 4 AI-generated actions built specifically for your criteria gaps, your field, and your timeline. A 90-day campaign that updates as you grow.
              </p>
              <p className="text-base text-slate-500 leading-[1.7]">
                Your Green Card Score tracks every report. Watch it move as you execute.
              </p>
              <div className="flex items-baseline gap-1 mt-7">
                <span className="text-5xl font-extrabold text-white leading-none">$29</span>
                <span className="text-base text-slate-500">/month</span>
              </div>
              <Link href="/signup" className="inline-block mt-5 bg-teal text-white font-extrabold text-[15px] px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity no-underline">
                Get Pro →
              </Link>
            </div>

            <div className="flex-1 min-w-[280px] max-w-[520px] w-full">
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-500 mb-4">Example career moves</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

                <div className="bg-white/5 border border-white/[0.09] rounded-2xl p-5">
                  <div className="flex flex-wrap items-start gap-1.5 mb-3">
                    <span className="text-[10px] font-bold text-purple-400 border border-purple-400/30 px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,.08)' }}>High Leverage</span>
                    <span className="text-[10px] font-bold text-teal border border-teal/30 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,194,168,.08)' }}>↑ High impact</span>
                    <span className="text-[10px] text-slate-500 ml-auto">Low effort</span>
                  </div>
                  <p className="text-[13px] font-bold text-white leading-[1.4] mb-1.5">Submit review for NeurIPS 2025 Programme Committee</p>
                  <p className="text-[11px] text-teal font-semibold mb-2">EB-1A §iv — Judging the Work of Others</p>
                  <p className="text-[12px] text-slate-500 leading-[1.55]">One formal review invitation documents a new criterion entirely. OpenReview.net is actively recruiting reviewers now.</p>
                  <p className="text-[11px] font-bold text-teal mt-2.5">▲ +10-14 pts on EB-1A score</p>
                </div>

                <div className="bg-white/5 border border-white/[0.09] rounded-2xl p-5">
                  <div className="flex flex-wrap items-start gap-1.5 mb-3">
                    <span className="text-[10px] font-bold text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,.08)' }}>Quick Win</span>
                    <span className="text-[10px] font-bold text-teal border border-teal/30 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,194,168,.08)' }}>↑ High impact</span>
                    <span className="text-[10px] text-slate-500 ml-auto">Low effort</span>
                  </div>
                  <p className="text-[13px] font-bold text-white leading-[1.4] mb-1.5">Get quoted in MIT Technology Review on your research</p>
                  <p className="text-[11px] text-teal font-semibold mb-2">EB-1A §iii — Press and Media Coverage</p>
                  <p className="text-[12px] text-slate-500 leading-[1.55]">Your university press office can pitch this today. One credible media mention covers §iii with minimal time investment.</p>
                  <p className="text-[11px] font-bold text-teal mt-2.5">▲ +8-12 pts on EB-1A score</p>
                </div>

                <div className="border border-white/[0.09] rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] gap-2" style={{ background: 'rgba(15,23,42,.82)' }}>
                  <span className="text-xl">🔒</span>
                  <span className="text-[12px] font-semibold text-slate-500">Pro move</span>
                </div>

                <div className="border border-white/[0.09] rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] gap-2" style={{ background: 'rgba(15,23,42,.82)' }}>
                  <span className="text-xl">🔒</span>
                  <span className="text-[12px] font-semibold text-slate-500">Pro move</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight">Built for the entire journey.</h2>
          <p className="text-lg text-mid mt-3">From your first OPT to your green card approval.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { who: 'F-1 OPT / STEM OPT', desc: 'Running out of time. Need a clear next step before your work authorization expires.' },
            { who: 'H-1B holders', desc: "Want a green card path that doesn't depend entirely on your employer." },
            { who: 'EB-1A / NIW filers', desc: 'Unsure if your evidence is strong enough or which pathway gives you the best shot.' },
            { who: 'RFE recipients', desc: 'Just received a Request for Evidence and need a response strategy fast.' },
            { who: 'Researchers and PhDs', desc: "Have publications and citations but don't know how USCIS actually values them." },
            { who: 'Self-petitioners', desc: 'Filing without employer sponsorship and need to understand what extraordinary really means.' },
          ].map(c => (
            <div key={c.who} className="rounded-2xl border border-border p-6 hover:border-teal/35 transition-colors">
              <p className="font-bold text-navy text-sm mb-1.5">{c.who}</p>
              <p className="text-mid text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-border py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Answer the questionnaire', body: 'Rate your evidence against each USCIS criterion. Takes 5 minutes. Your profile data pre-fills where possible.' },
              { step: '02', title: 'Get your free preview', body: 'See your top visa pathway, overall profile strength, and a teaser of the full analysis before paying anything.' },
              { step: '03', title: 'Unlock the full report', body: 'Pay once for your full criterion breakdown, evidence map, gap analysis, and 12-month roadmap. Download as PDF.' },
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

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-navy text-white py-28 px-6 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-[-1.5px] leading-[1.1] mb-5">
          You didn&apos;t come this far<br />
          to get stuck on <span className="text-teal">paperwork.</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-md mx-auto mb-9 leading-relaxed">Free preview. No commitment. Just clarity.</p>
        <Link
          href="/signup"
          className="inline-block bg-teal text-white font-extrabold text-lg px-12 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] no-underline"
          style={{ boxShadow: '0 8px 32px rgba(0,194,168,.28)' }}
        >
          Get started free →
        </Link>
        <p className="text-slate-600 text-xs mt-5">Preview free &nbsp;·&nbsp; No subscription required &nbsp;·&nbsp; Pay only for the full report</p>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-navy text-[15px]">F-1 Careers</span>
            <span className="text-[10px] font-extrabold text-teal bg-teal/10 border border-teal/25 px-1.5 py-0.5 rounded">AI</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm text-center leading-relaxed">
            This tool provides green card strategy analysis only and does not constitute legal advice. Consult a licensed immigration attorney before filing.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-sm text-mid hover:text-navy transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-mid hover:text-navy transition-colors">Terms</Link>
            <Link href="/login" className="text-sm text-mid hover:text-navy transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-mid hover:text-navy transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
