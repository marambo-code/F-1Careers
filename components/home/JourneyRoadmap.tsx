import Link from 'next/link'

const employerSteps = [
  {
    label: 'H-1B Lottery',
    note: '1-in-3 odds. Repeat every year until you win.',
    pain: true,
  },
  {
    label: 'PERM Labor Certification',
    note: 'Your employer files. You wait 2-3 years. You have no control.',
    pain: true,
  },
  {
    label: 'EB-2 / EB-3 Priority Date',
    note: 'Join a backlog that stretches decades for some nationalities.',
    pain: true,
  },
  {
    label: 'Green card.',
    note: 'Eventually. On their timeline. If they stay committed to you.',
    pain: false,
    final: true,
  },
]

const selfSteps = [
  {
    label: 'Build your evidence',
    note: 'Publications, citations, press, judging, awards, criteria you already meet.',
  },
  {
    label: 'File your I-140',
    note: 'EB-1A or EB-2 NIW. You file. No employer signature required.',
  },
  {
    label: 'Adjust status',
    note: 'Stay in the US while your case is adjudicated. No consular processing.',
  },
  {
    label: 'Green card.',
    note: 'On your timeline. Without asking anyone for permission.',
    final: true,
  },
]

export default function JourneyRoadmap() {
  return (
    <section className="bg-navy-light py-24 px-6 border-y border-border">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[11px] font-extrabold uppercase tracking-[2.5px] text-teal mb-4">Your immigration journey</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-navy tracking-[-1.5px] leading-[1.1] mb-4">
            Two roads to a green card.<br />
            <span className="text-teal">One of them is yours to control.</span>
          </h2>
          <p className="text-base text-mid max-w-md mx-auto leading-relaxed">
            Most international professionals end up on the employer path by default, not by choice. Here&apos;s the difference.
          </p>
        </div>

        {/* Two-path grid */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* ── Employer path ── */}
          <div className="rounded-2xl p-7 bg-white border border-border shadow-card">
            <div className="flex items-start justify-between gap-3 mb-7">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-mid mb-1.5">The employer route</p>
                <p className="text-base font-bold text-navy leading-snug">Their timeline.<br />Their decisions.</p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-orange-600 bg-orange-50 border border-orange-200">
                High uncertainty
              </span>
            </div>

            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-6">
                {employerSteps.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 relative z-10 mt-1 border ${
                      s.final
                        ? 'bg-slate-100 border-slate-300'
                        : 'bg-orange-100 border-orange-300'
                    }`} />
                    <div>
                      <p className={`text-sm font-bold leading-snug ${s.final ? 'text-mid' : 'text-navy'}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-mid mt-0.5 leading-relaxed">{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-mid italic mt-7 pt-5 border-t border-border leading-relaxed">
              Your career, your income, your entire US future, contingent on one employer staying committed.
            </p>
          </div>

          {/* ── Self-petition path ── */}
          <div className="rounded-2xl p-7 relative overflow-hidden border border-teal/30 bg-teal-light shadow-card">
            <div
              className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,194,168,0.18) 0%, transparent 70%)' }}
            />

            <div className="flex items-start justify-between gap-3 mb-7 relative z-10">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-teal mb-1.5">The self-petition route</p>
                <p className="text-base font-bold text-navy leading-snug">Your timeline.<br />Your control.</p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-teal bg-white border border-teal/30">
                No employer needed
              </span>
            </div>

            <div className="relative pl-5 z-10">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-teal/30" />

              <div className="space-y-6">
                {selfSteps.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 relative z-10 mt-1 border ${
                      s.final
                        ? 'bg-teal/30 border-teal'
                        : 'bg-teal/20 border-teal/50'
                    }`}>
                      {s.final && (
                        <div className="absolute inset-0.5 rounded-full bg-teal" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-snug ${s.final ? 'text-teal' : 'text-navy'}`}>
                        {s.label}
                      </p>
                      <p className="text-xs text-mid mt-0.5 leading-relaxed">{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 pt-5 border-t border-teal/20 relative z-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-teal mb-2">
                F-1 Careers was built for this path
              </p>
              <p className="text-xs text-mid leading-relaxed mb-4">
                We assess your profile against every EB-1A and NIW criterion, and show you exactly where you stand, criterion by criterion.
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

        {/* Bottom note */}
        <p className="text-center text-xs text-mid mt-8 leading-relaxed">
          F-1 → OPT → STEM OPT is the shared starting point. What happens next is the decision that defines the next decade.
        </p>

      </div>
    </section>
  )
}
