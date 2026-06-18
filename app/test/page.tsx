import Link from 'next/link'
import JourneyRoadmap from '@/components/home/JourneyRoadmap'
import SocialLinks from '@/components/SocialLinks'

export const metadata = { title: 'F-1 Careers (previous homepage)', robots: { index: false, follow: false } }

// Archived previous homepage, kept at /test for reference. The live homepage is
// the design served from /public/home.html via middleware.
export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Policy Alert Banner ──────────────────────────────────────── */}
      <div className="bg-rose-800 text-white text-center px-4 py-2.5">
        <p className="text-xs sm:text-sm font-semibold leading-snug">
          USCIS PM-602-0199 (May 21, 2026) reaffirms adjustment of status as discretionary relief, not a guaranteed right, and DHS has moved to end Duration of Status for F-1.{' '}
          <Link href="/stay-score" className="underline font-bold hover:text-rose-100">Check your Risk Score →</Link>
        </p>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <span className="text-[17px] sm:text-[19px] font-extrabold text-navy tracking-tight whitespace-nowrap">F-1 Careers</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-sm text-mid">
            <Link href="/explorer" className="font-medium hover:text-navy transition-colors px-3 py-2 whitespace-nowrap">Eligibility Check</Link>
            <Link href="/stay-score" className="font-medium hover:text-navy transition-colors px-3 py-2 whitespace-nowrap">Risk Score</Link>
            <Link href="/for-employers" className="font-medium hover:text-navy transition-colors px-3 py-2 whitespace-nowrap">For Employers</Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link href="/login" className="text-sm text-mid font-medium hover:text-navy transition-colors px-2 sm:px-3 py-2 whitespace-nowrap">Sign in</Link>
            <Link
              href="/start"
              className="text-sm font-bold text-white bg-navy px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <span className="sm:hidden">Get my report →</span>
              <span className="hidden sm:inline">Get my readiness report →</span>
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
            Diagnostic clarity for international professionals on F-1 and student visas, OPT, and H-1B. Know your real green card odds across EB-1A and EB-2 NIW, and build your case to work and live in the US, compliantly and stress-free.
          </p>

          <p className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/35 mb-8">
            Criterion-level &nbsp;·&nbsp; Evidence-mapped &nbsp;·&nbsp; Case law grounded &nbsp;·&nbsp; Built by F-1 alumni
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <Link
              href="/start"
              className="bg-teal text-white font-extrabold text-lg px-10 py-4 rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] no-underline"
              style={{ boxShadow: '0 8px 32px rgba(0,194,168,.30)' }}
            >
              Get my Green Card readiness report →
            </Link>
            <Link href="/explorer" className="text-slate-400 text-sm font-medium hover:text-white transition-colors py-4 px-2">
              New here? Start with the free Eligibility Check →
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
              { val: 'Extraordinary circumstances', lbl: 'The exact Adjustment of Status standard, documented' },
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
              The strongest response is a self-petitioned green card, EB-1A or EB-2 NIW, that puts your future in your hands instead of an employer&apos;s.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                heading: 'Your time on F-1 may be capped',
                body: 'DHS has submitted a final rule (under OMB review) that would replace open-ended Duration of Status with a fixed 4-year admission period for F-1 students and shorten the grace period to 30 days. It could take effect as early as September 2026.',
                accent: 'border-l-yellow-400',
              },
              {
                heading: 'Leaving the US is riskier than it was',
                body: 'Travel bans and immigrant-visa processing pauses now affect nationals of many countries, which makes adjusting status from inside the US a safer path than consular processing abroad.',
                accent: 'border-l-orange-400',
              },
              {
                heading: 'A green card is never automatic',
                body: 'USCIS reaffirms (PM-602-0199, May 21, 2026) that adjustment of status is a discretionary decision, not an entitlement. An officer weighs the positive and negative factors of each case individually. Approval is earned, not guaranteed.',
                accent: 'border-l-red-400',
              },
              {
                heading: 'Strong evidence is what wins',
                body: 'With officers weighing the totality of circumstances and issuing more RFEs and Notices of Intent to Deny, a well-documented petition, like an approved NIW I-140, is your strongest position.',
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
              Check my Visa &amp; Career Risk Score →
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
              {['Harvard', 'MIT', 'Stanford', 'UC Berkeley', 'Carnegie Mellon', 'Caltech', 'Columbia', 'Johns Hopkins', 'Google', 'Meta', 'Microsoft', 'NVIDIA', 'OpenAI', 'Moderna', 'Pfizer', 'Goldman Sachs'].map(u => (
                <span key={u} className="text-[11px] font-bold bg-navy/8 text-navy px-2.5 py-1 rounded-full">{u}</span>
              ))}
              <span className="text-[11px] text-mid">+ leaders across academia &amp; industry</span>
            </div>
          </div>

          <div
            className="flex-shrink-0 w-full md:w-80 bg-navy rounded-2xl p-7"
            style={{ boxShadow: '0 24px 64px rgba(27,43,107,.20)' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-teal mb-4">Case-law trained</p>
            <p className="text-[16px] font-bold text-white leading-snug mb-3">
              Built on the exact standards USCIS officers use to decide self-petitions.
            </p>
            <p className="text-[12px] text-slate-400 leading-[1.6] mb-5">
              Not generic AI. Your analysis follows the controlling precedent for EB-1A and EB-2 NIW, the same case law an adjudicator applies to your petition.
            </p>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
              {['Kazarian', 'Dhanasar', 'Chawathe'].map(t => (
                <span key={t} className="text-[10px] font-bold text-teal/90 bg-teal/10 border border-teal/20 rounded-full px-2.5 py-1">{t}</span>
              ))}
            </div>
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
              Your case for a self-petitioned, employment-based green card, the kind you file yourself. We score both paths, EB-1A (Extraordinary Ability) and EB-2 NIW (National Interest Waiver), then map your evidence, gaps, and 12-month roadmap. Free preview before you pay.
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
          <Link href="/explorer" className="border border-border rounded-2xl p-6 hover:border-teal/40 transition-colors no-underline group">
            <div className="text-xl mb-2">🧭</div>
            <h3 className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">Self-Petition Eligibility Check</h3>
            <p className="text-xs text-mid leading-relaxed">Learn the green card you can file yourself, EB-1A or EB-2 NIW, test your fit against the criteria, and see your real 2026 filing costs.</p>
            <p className="text-xs font-bold text-teal mt-3">Free →</p>
          </Link>
          <Link href="/stay-score" className="border border-border rounded-2xl p-6 hover:border-teal/40 transition-colors no-underline group">
            <div className="text-xl mb-2">📍</div>
            <h3 className="text-sm font-bold text-navy mb-1 group-hover:text-teal transition-colors">Risk Score</h3>
            <p className="text-xs text-mid leading-relaxed">Score your visa and career exposure 0-100. Know exactly where you stand and what to do.</p>
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
            { who: 'H-1B holders', desc: "PM-602-0199 makes Adjustment of Status discretionary. A strong, well-documented petition, ideally an approved I-140, is your best protection." },
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

      {/* ── Field benchmarks (aspirational) ──────────────────────────── */}
      <section className="bg-white border-y border-border py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-teal mb-3">What strong looks like</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
              See how the strongest profiles<br className="hidden sm:block" /> in your field are positioned.
            </h2>
            <p className="text-base text-mid mt-3 max-w-2xl mx-auto leading-relaxed">
              These are the evidence patterns that anchor a competitive EB-1A or EB-2 NIW self-petition. Your report shows which ones you already meet, and the fastest way to close the rest.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { field: 'AI & Computer Science', path: 'EB-1A / NIW', signals: ['Papers at NeurIPS, ICML, or CVPR', 'Citations from labs outside your own', 'Reviewer for a major venue', 'Open-source adopted in industry'] },
              { field: 'Biotech & Life Sciences', path: 'NIW / EB-1A', signals: ['First-author peer-reviewed work', 'A cross-lab citation footprint', 'Named inventor on a patent', 'Invited conference talks'] },
              { field: 'Medicine & Public Health', path: 'NIW', signals: ['Clinical or translational research', 'Contributions to practice guidelines', 'Journal peer review', 'Leadership in a professional society'] },
              { field: 'Engineering', path: 'EB-1A / NIW', signals: ['Granted patents or licensed IP', 'Standards or technical committee work', 'Projects deployed at scale', 'Recognition from outside your employer'] },
              { field: 'Business, Finance & Economics', path: 'NIW', signals: ['Original published research or analysis', 'Quoted as a subject-matter expert', 'Advisory or board roles', 'Measurable, field-wide impact'] },
              { field: 'Arts, Design & Media', path: 'EB-1A', signals: ['Juried exhibitions or awards', 'Press and critical coverage', 'Judging or curating other work', 'A body of work others build on'] },
            ].map(c => (
              <div key={c.field} className="rounded-2xl border border-border p-6 hover:border-teal/35 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="font-bold text-navy text-sm">{c.field}</p>
                  <span className="text-[10px] font-bold text-teal bg-teal-light px-2 py-0.5 rounded-full flex-shrink-0">{c.path}</span>
                </div>
                <ul className="space-y-1.5">
                  {c.signals.map(s => (
                    <li key={s} className="flex items-start gap-2 text-xs text-mid leading-relaxed">
                      <span className="text-teal mt-0.5 flex-shrink-0">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-mid mt-8 max-w-xl mx-auto leading-relaxed">
            Illustrative benchmarks, not testimonials. Every petition is judged on its own evidence under the controlling case law.
          </p>
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
              { step: '01', title: 'Answer the questionnaire', body: 'Rate your evidence against each USCIS criterion. Your profile data pre-fills where possible.' },
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
            <p className="text-sm text-mid mt-1.5 leading-relaxed">We review your workforce, identify who&apos;s at risk, and build NIW petition frameworks for every eligible employee.</p>
          </div>
          <Link href="/for-employers" className="flex-shrink-0 inline-block bg-navy text-white font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm no-underline">
            Request workforce support →
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
          Get my readiness report →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <span className="font-extrabold text-navy text-[15px]">F-1 Careers</span>
            <SocialLinks />
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm text-center leading-relaxed">
            F-1 Careers provides career and visa strategy, petition-preparation tools, and educational guidance, not legal advice. Consult a licensed immigration attorney before filing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/stay-score" className="text-sm text-mid hover:text-navy transition-colors">Risk Score</Link>
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
