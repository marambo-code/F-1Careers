import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TEST PAGE: a revertible homepage redesign at /test. The live homepage (app/
// page.tsx) is untouched. Built to match the approved mockup exactly. Delete this
// folder to revert.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'F-1 Careers (test)',
  robots: { index: false, follow: false },
}

const I = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M20 6 9 17l-5-5" /></svg>
  ),
  shieldCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7c0 2-1 3-3 4" /><path d="M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7c0 2-1 3-3 4" /></svg>
  ),
  gavel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" /></svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.5 2.7 1.5 4 .8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>
  ),
  docSearch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" /><path d="M14 2v6h6" /><circle cx="16.5" cy="16.5" r="3" /><path d="m21 21-1.9-1.9" /></svg>
  ),
  circleCheck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M2 18h20" /><path d="m4 18-2-9 5.5 4L12 6l4.5 7L22 9l-2 9" /></svg>
  ),
}

function Chip({ icon, label, on, prefix }: { icon?: ReactNode; label: string; on?: boolean; prefix?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${on ? 'border-teal/40 bg-teal/[0.07] text-teal' : 'border-border bg-white text-mid'}`}>
      {prefix ? <span className="font-bold">{prefix}</span> : <span className="w-4 h-4">{icon}</span>}
      {label}
      {on && <span className="w-4 h-4 text-teal">{I.check}</span>}
    </span>
  )
}

export default function TestHomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero (navy) ─────────────────────────────────────────────── */}
      <section className="relative bg-navy text-white overflow-hidden">
        {/* dotted map texture */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-2/3 h-full opacity-[0.10] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)', backgroundSize: '14px 14px', WebkitMaskImage: 'radial-gradient(ellipse at 80% 30%, #000 35%, transparent 70%)', maskImage: 'radial-gradient(ellipse at 80% 30%, #000 35%, transparent 70%)' }}
        />

        {/* Nav */}
        <nav className="relative z-10 border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
            <Link href="/test" className="text-[19px] font-extrabold tracking-tight whitespace-nowrap no-underline text-white">F-1 Careers</Link>
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <Link href="/explorer" className="hidden sm:inline text-white/80 hover:text-white transition-colors">Eligibility Check</Link>
              <Link href="/stay-score" className="hidden sm:inline text-white/80 hover:text-white transition-colors">Risk Score</Link>
              <Link href="/login" className="text-white/80 hover:text-white transition-colors whitespace-nowrap">Sign in</Link>
              <Link href="/start" className="bg-teal text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap no-underline">
                <span className="sm:hidden">Get my report →</span>
                <span className="hidden sm:inline">Get my readiness report →</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-[-1.5px] mb-5">
              Your career and visa<br /><span className="text-teal">strategy</span> engine.
            </h1>
            <p className="text-lg text-white/90 font-medium mb-3">Find the green card path you can file yourself.</p>
            <p className="text-base text-white/80 leading-relaxed mb-1">EB-1A and EB-2 NIW. No employer needed.</p>
            <p className="text-base text-white/70 leading-relaxed mb-8">For international professionals on F-1, OPT, and H-1B.</p>

            <div className="flex flex-wrap items-center gap-4 mb-9">
              <Link href="/explorer" className="bg-teal text-white font-bold text-[15px] px-7 py-4 rounded-2xl hover:opacity-90 transition-opacity no-underline">Start free eligibility check →</Link>
              <Link href="/start" className="text-white font-semibold text-[15px] underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors no-underline">Get my readiness report →</Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-white/70">
              <span className="flex items-center gap-2"><span className="w-4 h-4 text-teal">{I.shieldCheck}</span> Case-law grounded</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 text-teal">{I.users}</span> Built by F-1 alumni</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 text-teal">{I.eye}</span> Free preview before you pay</span>
            </div>
          </div>

          {/* Right card */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white/90 mb-5">Your potential paths</p>
              {[{ k: 'EB-1A' }, { k: 'EB-2 NIW' }].map((p) => (
                <div key={p.k} className="flex items-center gap-4 mb-4 last:mb-0">
                  <span className="text-[15px] font-bold text-white w-20 flex-shrink-0">{p.k}</span>
                  <span className="text-xs font-semibold text-teal w-24 flex-shrink-0">Strong match</span>
                  <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><span className="block h-full w-[88%] rounded-full bg-teal" /></span>
                  <span className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center flex-shrink-0"><span className="w-3.5 h-3.5">{I.check}</span></span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-7 left-6 right-6 rounded-2xl bg-white shadow-xl p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center flex-shrink-0"><span className="w-5 h-5">{I.bars}</span></span>
              <p className="text-[13px] text-mid leading-snug">Join thousands of F-1 professionals building their case with confidence.</p>
            </div>
          </div>
        </div>
        <div className="h-8 lg:h-10" />
      </section>

      {/* ── Free Eligibility Check teaser ───────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 -mt-2 sm:-mt-4 relative z-20">
        <div className="rounded-3xl border-2 border-teal/60 bg-white shadow-card p-6 sm:p-8 mt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-2">Free eligibility check</p>
              <h2 className="text-2xl font-extrabold text-navy">Could you self-petition a green card?</h2>
              <p className="text-sm text-mid mt-1">Tap what you already have.</p>
            </div>
            <div className="inline-flex rounded-xl bg-navy-light p-1">
              <span className="px-4 py-2 rounded-lg text-sm font-bold bg-teal text-white">EB-1A</span>
              <span className="px-4 py-2 rounded-lg text-sm font-bold text-mid">EB-2 NIW</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-6">
            <Chip icon={I.book} label="Publications" on />
            <Chip prefix="66" label="Citations" on />
            <Chip icon={I.gavel} label="Judging" on />
            <Chip icon={I.trophy} label="Awards" />
            <Chip icon={I.news} label="Press" />
            <Chip icon={I.bulb} label="Patents" />
          </div>

          <div className="flex items-center justify-between gap-5 flex-wrap pt-5 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/30 px-4 py-2 text-sm font-bold text-teal"><span className="w-4 h-4">{I.circleCheck}</span> Looks viable</span>
              <div className="text-sm text-mid leading-snug"><p>You have several strong indicators.</p><p>You may have a real case.</p></div>
            </div>
            <Link href="/explorer" className="bg-teal text-white font-bold text-[15px] px-7 py-3.5 rounded-2xl hover:opacity-90 transition-opacity no-underline whitespace-nowrap">Open the full check →</Link>
          </div>
        </div>
      </section>

      {/* ── Why this matters now ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-extrabold text-navy text-center mb-9">Why this matters now</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: I.calendar, tint: 'bg-navy-light text-navy', h: 'F-1 time may be capped', b: 'Proposed rules could limit how long F-1 students can stay.' },
            { icon: I.alert, tint: 'bg-orange-50 text-orange-500', h: 'Leaving the US is riskier', b: 'Travel limits make getting a green card harder than before.' },
            { icon: I.shield, tint: 'bg-teal-light text-teal', h: 'Strong evidence is what wins', b: 'Officers evaluate each case individually. Quality matters most.' },
          ].map((c) => (
            <div key={c.h} className="rounded-2xl border border-border p-6">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${c.tint}`}><span className="w-6 h-6">{c.icon}</span></span>
              <p className="font-bold text-navy mb-1.5">{c.h}</p>
              <p className="text-sm text-mid leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you can get ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-extrabold text-navy text-center mb-9">What you can get</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border p-7">
            <div className="flex items-start gap-4 mb-3">
              <span className="w-12 h-12 rounded-xl bg-teal text-white flex items-center justify-center flex-shrink-0"><span className="w-6 h-6">{I.doc}</span></span>
              <div className="flex-1 flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold text-navy">Green Card Strategy Report</h3>
                <span className="text-2xl font-extrabold text-teal">$297</span>
              </div>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-5">Self-petitioned case, scored across EB-1A &amp; EB-2 NIW, with evidence gaps and a step-by-step roadmap.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mid">
              {['Score both paths', 'Close the gaps', 'Roadmap'].map(t => <span key={t} className="flex items-center gap-1.5"><span className="w-4 h-4 text-teal">{I.check}</span>{t}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-border p-7">
            <div className="flex items-start gap-4 mb-3">
              <span className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center flex-shrink-0"><span className="w-6 h-6">{I.docSearch}</span></span>
              <div className="flex-1 flex items-start justify-between gap-3">
                <h3 className="text-lg font-extrabold text-navy">RFE Response Analyzer</h3>
                <span className="text-2xl font-extrabold text-navy">$297</span>
              </div>
            </div>
            <p className="text-sm text-mid leading-relaxed mb-5">Upload your RFE and get an issue-by-issue response strategy to strengthen your reply with confidence.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-mid">
              {['Issue-by-issue plan', 'Evidence guidance', 'Stronger reply'].map(t => <span key={t} className="flex items-center gap-1.5"><span className="w-4 h-4 text-navy">{I.check}</span>{t}</span>)}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          <Link href="/explorer" className="rounded-2xl border border-border p-5 hover:border-teal/40 transition-colors no-underline group">
            <div className="flex items-center gap-2 mb-1"><span className="w-5 h-5 text-teal">{I.circleCheck}</span><span className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Eligibility Check</span><span className="text-xs font-bold text-teal ml-auto">Free →</span></div>
            <p className="text-xs text-mid">Start the interactive check</p>
          </Link>
          <Link href="/stay-score" className="rounded-2xl border border-border p-5 hover:border-teal/40 transition-colors no-underline group">
            <div className="flex items-center gap-2 mb-1"><span className="w-5 h-5 text-teal">{I.bag}</span><span className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Risk Score</span><span className="text-xs font-bold text-teal ml-auto">Free →</span></div>
            <p className="text-xs text-mid">See how your case performs</p>
          </Link>
          <Link href="/cohort" className="rounded-2xl border border-border p-5 hover:border-teal/40 transition-colors no-underline group">
            <div className="flex items-center gap-2 mb-1"><span className="w-5 h-5 text-teal">{I.group}</span><span className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Cohort Filing</span><span className="text-xs font-bold text-teal ml-auto">Waitlist →</span></div>
            <p className="text-xs text-mid">Join the next filing cohort</p>
          </Link>
        </div>
      </section>

      {/* ── Pro band ─────────────────────────────────────────────────── */}
      <section className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-teal/15 text-teal flex items-center justify-center flex-shrink-0"><span className="w-6 h-6">{I.crown}</span></span>
            <div>
              <p className="text-lg font-extrabold">Keep your case moving with Pro</p>
              <p className="text-sm text-white/70">Personalized monthly moves to strengthen your profile.</p>
            </div>
          </div>
          <div className="flex items-baseline gap-1"><span className="text-4xl font-extrabold">$49</span><span className="text-sm text-white/60">/mo</span></div>
        </div>
      </section>

      {/* ── What strong looks like ───────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-border py-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-navy mb-1.5">What <span className="text-teal">strong</span> looks like in your field</h2>
          <p className="text-sm text-mid mb-7">See what strong profiles in your field often look like.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-5 py-2.5 rounded-xl text-sm font-bold bg-navy text-white">AI &amp; software</span>
            {['Biotech', 'Medicine', 'Engineering'].map(f => <span key={f} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white border border-border text-navy">{f}</span>)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative bg-navy text-white text-center overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 opacity-20" style={{ background: 'radial-gradient(120% 80% at 50% 120%, #00C2A8 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">You&apos;re already <span className="text-teal">extraordinary.</span></h2>
          <p className="text-white/75 mb-8">Free to find out where you stand. Pay only for the full report.</p>
          <Link href="/start" className="inline-block bg-teal text-white font-extrabold text-[15px] px-9 py-4 rounded-2xl hover:opacity-90 transition-opacity no-underline">Get my readiness report →</Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-mid">
          <span className="font-extrabold text-navy">F-1 Careers</span>
          <Link href="/explorer" className="hover:text-navy transition-colors">Eligibility Check</Link>
          <Link href="/stay-score" className="hover:text-navy transition-colors">Risk Score</Link>
          <Link href="/for-employers" className="hover:text-navy transition-colors">For Employers</Link>
          <Link href="/blog" className="hover:text-navy transition-colors">Blog</Link>
          <Link href="/privacy" className="hover:text-navy transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-navy transition-colors">Terms</Link>
        </div>
      </footer>

    </div>
  )
}
