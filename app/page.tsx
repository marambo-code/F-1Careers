import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JourneyRoadmap from '@/components/home/JourneyRoadmap'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Policy Alert Banner ──────────────────────────────────────── */}
      <div className="bg-amber-600 text-white text-center px-4 py-2.5">
        <p className="text-xs sm:text-sm font-semibold leading-snug">
          USCIS PM-602-0199 (issued May 21, 2026) officially makes adjustment of status discretionary relief, not a right. DHS is ending Duration of Status for F-1.{' '}
          <Link href="/stay-score" className="underline font-bold hover:text-amber-100">Check your Risk Score →</Link>
        </p>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-[19px] font-extrabold text-navy tracking-tight">F-1 Careers</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-sm text-mid">
            <Link href="/stay-score" className="font-medium hover:text-navy transition-colors px-3 py-2">Risk Score</Link>
            <Link href="/roi-calculator" className="font-medium hover:text-navy transition-colors px-3 py-2">ROI Calc</Link>
            <Link href="/for-employers" className="font-medium hover:text-navy transition-colors px-3 py-2">For Employers</Link>
          </div>
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

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-0 text-center">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/25 text-teal text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
            F-1 · OPT · H-1B · L-1 &nbsp;·&nbsp; Green card strategy
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-[-2px] mb-5">
            Your career and visa<br />
            <span className="text-teal">strategy engine.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
            Immigration rules keep changing. Proving <strong className="text-white">extraordinary circumstances</strong> is now the standard for staying in the US. We help you build that case.
          </p>

          <p className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/35 mb-8">
            Criterion-level &nbsp;·&nbsp; Evidence-mapped &nbsp;·&nbsp; Case law grounded &nbsp;·&nbsp; Built by F-1 alumni
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="bg-teal text-white font-extrabold text-lg px-10 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] no-underline"
              style={{ boxShadow: '0 8px 32px rgba(0,194,168,.30)' }}
            >
              Get my free green card preview →
            </Link>
            <Link href="/stay-score" className="text-slate-400 text-sm font-medium hover:text-white transition-colors py-4 px-2">
              Check my Risk Score first ↓
            </Link>
          </div>
          <p className="text-slate-600 text-xs pb-14">Free preview &nbsp;·&nbsp; No commitment &nbsp;·&nbsp; Pay only for the full report</p>
        </div>

        {/* Trust bar */}
        <div className="border-t border-white/[0.07]">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4">
            {[
              { val: 'EB-1A & NIW', lbl: 'Both pathways analyzed' },
              { val: 'Kazarian & Dhanasar', lbl: 'Trained on controlling case law' },
              { val: 'Extraordinary circumstances', lbl: 'The exact AoS standard, documented' },
              { val: 'F-1 → EB-1A / NIW', lbl: 'Built by those who did it' },
            ].map((item, i) => (
              <div key={i} className="py-5 px-4 text-center border-r border-white/[0.06] last:border-r-0">
                <span className="block text-[15px] font-extrabold text-white">{item.val}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{item.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Policy Context Section ────────────────────────────────────── */}
      <section className="bg-white border-b border-border py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-3">Three rules. Now official.</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy leading-tight">
              The rules for residing in the US<br className="hidden sm:block" /> as a green card applicant are constantly changing
            </h2>
            <p className="text-base text-mid mt-3 max-w-xl mx-auto leading-relaxed">
              F-1 Careers was built specifically for this environment.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                heading: 'AoS is now discretionary',
                body: 'USCIS PM-602-0199 (May 21, 2026) officially classifies adjustment of status as extraordinary discretionary relief, not an entitlement.',
                accent: 'border-l-red-400',
              },
              {
                heading: 'Extraordinary circumstances required',
                body: 'Adjudicators now conduct a totality-of-circumstances analysis. An approved NIW I-140 is the clearest evidence you can present.',
                accent: 'border-l-orange-400',
              },
              {
                heading: 'Duration of Status ending',
                body: 'DHS has submitted a final rule replacing open-ended D/S with a 4-year hard cap for F-1 students. Grace period cut to 30 days. Expected September 2026.',
                accent: 'border-l-yellow-400',
              },
              {
                heading: 'Consular processing blocked for 75+ countries',
                body: 'Nationals of 75+ countries face travel bans and immigrant visa processing pauses, making AoS inside the US their only viable path.',
                accent: 'border-l-teal',
              },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl border border-border border-l-4 ${item.accent} p-6 bg-slate-50`}>
                <p className="font-bold text-navy text-sm mb-2">{item.heading}</p>
                <p className="text-xs text-mid leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/stay-score" className="inline-block bg-navy text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm no-underline">
              Check my Risk Score →
            </Link>
            <Link href="/roi-calculator" className="inline-block border border-border text-navy font-semibold px-8 py-3.5 rounded-xl hover:border-navy transition-colors text-sm no-underline">
              Calculate my financial exposure →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Journey Roadmap ──────────────────────────────────────────── */}
      <JourneyRoadmap />

      {/* ── Origin ───────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-16 md:gap-20">
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-4">Our story</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.2] mb-5">
              From F-1 to EB-1A, EB-2 NIW, and O-1.<br />We&apos;ve navigated every step intelligently and compliantly.
            </h2>
            <p className="text-base text-mid leading-[1.75] mb-4">
              From years of first-hand experience navigating the same system you&apos;re in right now, for ourselves and others, as the landscape evolved.
            </p>
            <p className="text-base text-mid leading-[1.75] mb-4">
              We built F-1 Careers because generations of international students had already figured this out. That knowledge deserved a home, and we&apos;re committed to democratizing it so that you can plan ahead.
            </p>
            <p className="text-base text-navy font-semibold leading-[1.75] mb-6">
              The tool we wish we had. Trained on the case law that actually decides your petition.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              {['Harvard', 'MIT', 'Stanford', 'Yale', 'Princeton', 'Columbia', 'Cornell', 'Tufts', 'Carnegie Mellon', 'UC Berkeley', 'UCLA', 'Georgia Tech', 'UIUC', 'Purdue', 'NYU', 'Johns Hopkins', 'Caltech', 'Duke', 'UT Austin', 'UMich'].map(u => (
                <span key={u} className="text-[11px] font-bold bg-navy/8 text-navy px-2.5 py-1 rounded-full">{u}</span>
              ))}
              <span className="text-[11px] text-mid">+ institutions worldwide</span>
            </div>
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
            Everything you need to file with confidence.
          </h2>
          <p className="text-lg text-mid mt-3">Every tool built for the evolving landscape.</p>
          <p className="text-sm text-mid mt-2">Get your diagnostic and strategy reports now.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-border rounded-2xl p-9 hover:border-teal/50 hover:shadow-card-hover transition-all flex flex-col">
            <div className="text-2xl mb-5">📊</div>
            <div className="flex items-start justify-between mb-2.5">
              <h3 className="text-[19px] font-extrabold text-navy">Green Card Strategy Report</h3>
              <span className="text-[26px] font-extrabold text-teal ml-4 flex-shrink-0">$297</span>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-6">
              Complete EB-1A and NIW analysis with personalized Dhanasar framework, evidence map, and 12-month roadmap. Free preview before you pay.
            </p>
            <ul className="space-y-2.5 mb-7 flex-1">
              {[
                'All 10 EB-1A criteria scored and ranked',
                'NIW Dhanasar three-prong analysis',
                'Extraordinary circumstances evidence map',
                'Visa pathway feasibility ranking',
                'Gap analysis with specific next steps',
                '3 / 6 / 12-month career and immigration roadmap',
                'Downloadable PDF report',
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

          <div className="border-2 border-border rounded-2xl p-9 hover:border-navy/40 hover:shadow-card-hover transition-all flex flex-col">
            <div className="text-2xl mb-5">📄</div>
            <div className="flex items-start justify-between mb-2.5">
              <h3 className="text-[19px] font-extrabold text-navy">RFE Response Analyzer</h3>
              <span className="text-[26px] font-extrabold text-navy ml-4 flex-shrink-0">$297</span>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-6">
              Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy.
            </p>
            <ul className="space-y-2.5 mb-7 flex-1">
              {[
                'Every RFE issue identified and ranked by risk',
                'Plain-English translation of USCIS legalese',
                'Evidence checklist for each issue',
                'Response strategy: Rebut, Supplement, or Narrow',
                'Cites controlling cases (Kazarian, Dhanasar)',
                'Priority action list ordered by urgency',
                'Downloadable PDF report',
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

        {/* Secondary tools row */}
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          <Link href="/stay-score" className="border border-border rounded-2xl p-6 hover:border-teal/40 transition-colors no-underline group">
            <div className="text-xl mb-2">📍</div>
            <h3 className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">Risk Score</h3>
            <p className="text-xs text-mid leading-relaxed">Score your immigration exposure 0–100. Know exactly where you stand and what to do.</p>
            <p className="text-xs font-bold text-teal mt-3">Free →</p>
          </Link>
          <Link href="/roi-calculator" className="border border-border rounded-2xl p-6 hover:border-teal/40 transition-colors no-underline group">
            <div className="text-xl mb-2">💰</div>
            <h3 className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">ROI Calculator</h3>
            <p className="text-xs text-mid leading-relaxed">See the real cost of consular processing vs. fighting to stay. Most people are shocked.</p>
            <p className="text-xs font-bold text-teal mt-3">Free →</p>
          </Link>
          <Link href="/cohort" className="border border-border rounded-2xl p-6 hover:border-teal/40 transition-colors no-underline group">
            <div className="text-xl mb-2">👥</div>
            <h3 className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">Cohort NIW Filing</h3>
            <p className="text-xs text-mid leading-relaxed">File with 20 professionals in your field. One attorney, shared framework. $2,400 per person.</p>
            <p className="text-xs font-bold text-teal mt-3">Join waitlist →</p>
          </Link>
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
                Personalized to your journey.
              </h2>
              <p className="text-base text-slate-500 leading-[1.7] mb-3">
                Every month, personalized moves built specifically for your criteria gaps, your field, and your timeline. A 90-day campaign that updates as you grow.
              </p>
              <p className="text-base text-slate-500 leading-[1.7]">
                Your Green Card Score tracks every report. Watch it move as you execute.
              </p>
              <div className="flex items-baseline gap-1 mt-7">
                <span className="text-5xl font-extrabold text-white leading-none">$49</span>
                <span className="text-base text-slate-500">/month</span>
                <span className="text-[11px] text-slate-600 ml-2">or $399/yr</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">Less than one hour of attorney time.</p>
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
                  <p className="text-[11px] text-teal font-semibold mb-2">EB-1A §iv, Judging the Work of Others</p>
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
                  <p className="text-[11px] text-teal font-semibold mb-2">EB-1A §iii, Press and Media Coverage</p>
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
          <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal mb-3">Who this is for</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight">International talent in the US.<br className="hidden sm:block" /> Every stage of the journey.</h2>
          <p className="text-lg text-mid mt-3 max-w-xl mx-auto">If you hold or have held an F-1, OPT, H-1B, or similar visa and are working toward permanent residence, this is built for you.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { who: 'F-1 OPT / STEM OPT', desc: 'Running out of time. Need a clear next step before your work authorization expires.' },
            { who: 'H-1B holders', desc: "PM-602-0199 puts your AoS path at risk. You need an approved I-140 with extraordinary circumstances evidence, fast." },
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
              { step: '01', title: 'Answer the questionnaire', body: 'Rate your evidence against each USCIS criterion. Takes about 15 minutes. Your profile data pre-fills where possible.' },
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

      {/* ── Employer CTA ─────────────────────────────────────────────── */}
      <section className="bg-navy/[0.03] border-b border-border py-14 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-1">For HR teams & General Counsel</p>
            <h3 className="text-xl font-extrabold text-navy">Don&apos;t lose your international talent to a policy memo.</h3>
            <p className="text-sm text-mid mt-1.5 leading-relaxed">We audit your workforce, identify who&apos;s at risk, and build NIW petition frameworks for every eligible employee.</p>
          </div>
          <Link href="/for-employers" className="flex-shrink-0 inline-block bg-navy text-white font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm no-underline">
            Request workforce audit →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-navy text-white py-28 px-6 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-[-1.5px] leading-[1.1] mb-5">
          You&apos;re already <span className="text-teal">extraordinary.</span><br />
          USCIS just needs to see it.
        </h2>
        <p className="text-lg text-slate-500 max-w-md mx-auto mb-9 leading-relaxed">Free preview. No commitment. Just clarity on exactly where you stand.</p>
        <Link
          href="/signup"
          className="inline-block bg-teal text-white font-extrabold text-lg px-12 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] no-underline"
          style={{ boxShadow: '0 8px 32px rgba(0,194,168,.28)' }}
        >
          Get started free →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-navy text-[15px]">F-1 Careers</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm text-center leading-relaxed">
            This tool provides green card strategy analysis only and does not constitute legal advice. Consult a licensed immigration attorney before filing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/stay-score" className="text-sm text-mid hover:text-navy transition-colors">Risk Score</Link>
            <Link href="/roi-calculator" className="text-sm text-mid hover:text-navy transition-colors">ROI Calc</Link>
            <Link href="/cohort" className="text-sm text-mid hover:text-navy transition-colors">Cohort Filing</Link>
            <Link href="/for-employers" className="text-sm text-mid hover:text-navy transition-colors">For Employers</Link>
            <Link href="/privacy" className="text-sm text-mid hover:text-navy transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-mid hover:text-navy transition-colors">Terms</Link>
            <Link href="/login" className="text-sm text-mid hover:text-navy transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
