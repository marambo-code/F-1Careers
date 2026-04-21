'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const sharedStages = [
  { icon: '🎓', label: 'F-1 Student Visa', sub: 'Your starting point' },
  { icon: '💼', label: 'OPT', sub: '12-month work auth' },
  { icon: '⏳', label: 'STEM OPT', sub: '+24-month extension' },
]

const employerStages = [
  { label: 'H-1B Lottery', pain: '1 in 3 selection odds — every year' },
  { label: 'PERM Labor Cert.', pain: 'Employer-controlled. 2-3 year process.' },
  { label: 'EB-2 / EB-3', pain: 'Country backlogs up to 10+ years.' },
  { label: 'Green Card', pain: 'Eventually. On their timeline.', final: true },
]

const selfStages = [
  { label: 'EB-1A or EB-2 NIW', benefit: 'Self-petition. No lottery. No employer.' },
  { label: 'Green Card', benefit: 'On your timeline. You control this.', final: true },
]

function NodeConnector({ active, delay }: { active: boolean; delay: number }) {
  return (
    <div
      className={`flex items-center mt-[26px] mx-0.5 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-6 h-px bg-navy/25" />
      <svg width="8" height="8" viewBox="0 0 8 8" className="text-navy/25 flex-shrink-0">
        <path d="M0 4 L6 4 M3 1 L6 4 L3 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function JourneyRoadmap() {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActive(true) },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="bg-white border-b border-border py-24 px-6">
      <div ref={ref} className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-teal mb-3">Your immigration journey</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy tracking-tight leading-[1.15]">
            The path to a green card.<br />Every step, mapped.
          </h2>
          <p className="text-base text-mid mt-4 max-w-lg mx-auto leading-relaxed">
            Most international professionals don&apos;t know all their options. Here&apos;s the full picture — and where the real leverage is.
          </p>
        </div>

        {/* Shared path */}
        <div className="flex items-start justify-center flex-wrap mb-6">
          {sharedStages.map((s, i) => (
            <div key={s.label} className="flex items-start">
              <div
                className={`flex flex-col items-center text-center transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center text-2xl mb-2 shadow-md">
                  {s.icon}
                </div>
                <p className="text-[12px] font-bold text-navy w-[80px] leading-tight">{s.label}</p>
                <p className="text-[11px] text-mid mt-0.5 w-[80px] leading-tight">{s.sub}</p>
              </div>
              <NodeConnector active={active} delay={i * 150 + 120} />
            </div>
          ))}

          {/* Fork node */}
          <div
            className={`flex flex-col items-center text-center transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            style={{ transitionDelay: '500ms' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-xl mb-2">
              🔀
            </div>
            <p className="text-[12px] font-bold text-mid w-[80px] leading-tight">Your path forks</p>
            <p className="text-[11px] text-mid/70 mt-0.5 w-[80px] leading-tight">Two very different roads</p>
          </div>
        </div>

        {/* Fork label */}
        <div
          className={`text-center mb-8 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '650ms' }}
        >
          <span className="inline-block bg-slate-100 border border-border text-mid text-xs font-semibold px-4 py-1.5 rounded-full">
            Which road are you on?
          </span>
        </div>

        {/* Two paths */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Employer route */}
          <div
            className={`rounded-2xl border border-border bg-slate-50 p-6 transition-all duration-600 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{ transitionDelay: '800ms' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <p className="text-xs font-bold text-mid uppercase tracking-widest">Employer route</p>
              <span className="text-[10px] text-orange-600 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">High uncertainty</span>
            </div>

            <div className="space-y-4">
              {employerStages.map((s, i) => (
                <div key={s.label} className="flex gap-3 items-start">
                  {i < employerStages.length - 1 && (
                    <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-500 mt-0.5">
                      ⚠
                    </div>
                  )}
                  {i === employerStages.length - 1 && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                      🏁
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold ${s.final ? 'text-mid' : 'text-navy'}`}>{s.label}</p>
                    <p className="text-xs text-mid mt-0.5 leading-relaxed">{s.pain}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-mid/60 mt-5 pt-4 border-t border-border italic">
              Your green card depends entirely on your employer staying with you.
            </p>
          </div>

          {/* Self-petition route */}
          <div
            className={`rounded-2xl border-2 border-teal bg-navy p-6 relative overflow-hidden transition-all duration-600 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            style={{
              transitionDelay: '950ms',
              boxShadow: '0 8px 40px rgba(0,194,168,.18)',
            }}
          >
            {/* Glow orb */}
            <div
              className="absolute top-0 right-0 pointer-events-none"
              style={{
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(0,194,168,.12) 0%, transparent 70%)',
                transform: 'translate(30%, -30%)',
              }}
            />

            <div className="flex items-center gap-2 mb-5 relative z-10">
              <p className="text-xs font-bold text-teal uppercase tracking-widest">Self-petition route</p>
              <span className="text-[10px] text-teal font-bold bg-teal/10 border border-teal/25 px-2 py-0.5 rounded-full">No employer needed</span>
            </div>

            <div className="space-y-4 relative z-10">
              {selfStages.map((s, i) => (
                <div key={s.label} className="flex gap-3 items-start">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
                    s.final
                      ? 'bg-teal text-navy text-base'
                      : 'bg-teal/20 border border-teal/30 text-teal'
                  }`}>
                    {s.final ? '✦' : '✓'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.benefit}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
              <p className="text-[11px] font-extrabold text-teal uppercase tracking-widest mb-1.5">
                F-1 Careers was built for this path
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                We assess your profile against EB-1A and NIW criteria and show you exactly what it takes — and what to do next.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-teal text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity no-underline"
              >
                See my pathway →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
