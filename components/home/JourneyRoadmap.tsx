import Link from 'next/link'

/* ─── shared path stages ────────────────────────────────── */
const shared = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.63 48.63 0 0 1 12 20.904a48.63 48.63 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    label: 'F-1 Student Visa',
    sub: 'Your starting point',
    step: 'Start',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
    label: 'OPT',
    sub: '12-month work auth',
    step: '12 mo',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    label: 'STEM OPT',
    sub: '+24-month extension',
    step: '+24 mo',
  },
]

/* ─── employer path ─────────────────────────────────────── */
const employerPath = [
  { label: 'H-1B Lottery', note: '1 in 3 odds — every year' },
  { label: 'PERM Labor Cert.', note: 'Employer-controlled · 2-3 years' },
  { label: 'EB-2 / EB-3', note: 'Priority date backlogs · years of waiting' },
  { label: 'Green Card', note: 'Eventually. On their timeline.', final: true },
]

/* ─── self-petition path ────────────────────────────────── */
const selfPath = [
  { label: 'EB-1A', sub: 'Extraordinary Ability' },
  { label: 'EB-2 NIW', sub: 'National Interest Waiver' },
]

export default function JourneyRoadmap() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #060d1c 0%, #0a1628 60%, #06111f 100%)' }}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #00C2A8 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #1B2B6B 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center mb-20">
          <p className="text-[11px] font-extrabold uppercase tracking-[2.5px] text-teal mb-4">Your immigration journey</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-[-1.5px] leading-[1.1] mb-4">
            The path to a green card.<br />
            <span className="text-white/50">Every step, mapped.</span>
          </h2>
          <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Most international professionals don&apos;t know all their options. Here&apos;s the full picture — and where the real leverage is.
          </p>
        </div>

        {/* ── Shared path ─────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-0 mb-14">
          {shared.map((s, i) => (
            <div key={s.label} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center text-center">
                <span
                  className="text-[9px] font-extrabold uppercase tracking-widest mb-2 px-2 py-0.5 rounded-full border"
                  style={{
                    color: 'rgba(0,194,168,0.8)',
                    borderColor: 'rgba(0,194,168,0.25)',
                    background: 'rgba(0,194,168,0.06)',
                  }}
                >
                  {s.step}
                </span>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-3"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {s.icon}
                </div>
                <p className="text-[13px] font-bold text-white leading-tight w-[76px]">{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight w-[76px]">{s.sub}</p>
              </div>

              {/* Connector */}
              <div className="flex items-center mx-3 mt-[-36px]">
                <div className="w-10 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <svg width="6" height="10" viewBox="0 0 6 10" className="flex-shrink-0 opacity-40">
                  <path d="M1 1l4 4-4 4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}

          {/* Fork node */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-extrabold uppercase tracking-widest mb-2 px-2 py-0.5 rounded-full text-slate-500 border border-slate-700 bg-slate-800/50">
              Fork
            </span>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5 4.5 4.5m0 0L16.5 12M21 3H7.5" />
              </svg>
            </div>
            <p className="text-[13px] font-bold text-slate-400 leading-tight w-[76px]">Path forks</p>
            <p className="text-[11px] text-slate-600 mt-1 leading-tight w-[76px]">Two very different roads</p>
          </div>
        </div>

        {/* ── Fork label ──────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-700" />
            <span className="text-xs text-slate-500 font-medium tracking-wide">At this point, most people face a critical choice</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-700" />
          </div>
        </div>

        {/* ── Two paths ───────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* ── Employer path ───────────────────────────────── */}
          <div
            className="rounded-2xl p-6 h-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-slate-500 mb-1">Employer route</p>
                <p className="text-sm font-bold text-slate-400">The road most people end up on</p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
              >
                High uncertainty
              </span>
            </div>

            <div className="relative">
              <div
                className="absolute left-[15px] top-4 bottom-4 w-px"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))' }}
              />
              <div className="space-y-5">
                {employerPath.map((s) => (
                  <div key={s.label} className="flex gap-4 items-start">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10 text-xs font-bold"
                      style={{
                        background: s.final ? 'rgba(100,116,139,0.15)' : 'rgba(249,115,22,0.08)',
                        border: s.final ? '1px solid rgba(100,116,139,0.2)' : '1px solid rgba(249,115,22,0.2)',
                        color: s.final ? '#64748b' : '#f97316',
                      }}
                    >
                      {s.final ? '🏁' : '⚠'}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${s.final ? 'text-slate-500' : 'text-slate-300'}`}>{s.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 italic mt-6 pt-5 border-t border-white/[0.05] leading-relaxed">
              Your career, your timeline, your green card — all contingent on one employer staying committed to you.
            </p>
          </div>

          {/* ── Self-petition path ──────────────────────────── */}
          <div
            className="rounded-2xl p-6 h-full relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,194,168,0.08) 0%, rgba(27,43,107,0.3) 100%)',
              border: '1px solid rgba(0,194,168,0.25)',
              boxShadow: '0 0 60px rgba(0,194,168,0.08), inset 0 0 40px rgba(0,194,168,0.03)',
            }}
          >
            <div
              className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,194,168,0.15) 0%, transparent 70%)' }}
            />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-teal mb-1">Self-petition route</p>
                <p className="text-sm font-bold text-white">The road built for extraordinary talent</p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: '#00C2A8', background: 'rgba(0,194,168,0.1)', border: '1px solid rgba(0,194,168,0.25)' }}
              >
                No employer needed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
              {selfPath.map((p) => (
                <div
                  key={p.label}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(0,194,168,0.07)',
                    border: '1px solid rgba(0,194,168,0.18)',
                  }}
                >
                  <p className="text-[13px] font-extrabold text-white mb-1">{p.label}</p>
                  <p className="text-[11px] text-teal/70 leading-tight">{p.sub}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 mb-6 relative z-10">
              {[
                'No lottery. No employer sponsor. No waiting on someone else.',
                'You file. You control the timeline.',
                'Your achievements are the petition.',
              ].map((b) => (
                <div key={b} className="flex items-start gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,194,168,0.15)', border: '1px solid rgba(0,194,168,0.3)' }}
                  >
                    <svg viewBox="0 0 8 8" width="8" height="8" className="text-teal">
                      <path d="M1.5 4l1.5 1.5L6.5 2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>

            <div
              className="pt-5 border-t relative z-10"
              style={{ borderColor: 'rgba(0,194,168,0.15)' }}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-teal mb-2">
                F-1 Careers was built for this path
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                We assess your profile against EB-1A and NIW criteria and show you exactly what it takes — criterion by criterion.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-bold text-navy bg-teal px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity no-underline"
              >
                See my pathway
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
