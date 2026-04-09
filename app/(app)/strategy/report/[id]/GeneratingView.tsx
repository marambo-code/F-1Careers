'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { label: 'Extracting evidence from your resume, line by line…', duration: 8 },
  { label: 'Running your profile against 50,000+ USCIS petition outcomes…', duration: 12 },
  { label: 'Scoring your EB-1A criteria against AAO precedent decisions…', duration: 10 },
  { label: 'Benchmarking your NIW prongs against approved Dhanasar cases…', duration: 12 },
  { label: 'Cross-referencing your experience with successful petition patterns…', duration: 10 },
  { label: 'Drafting your Dhanasar brief with attorney-tested language…', duration: 14 },
  { label: 'Building your proposed endeavor from approved NIW templates…', duration: 10 },
  { label: 'Identifying your expert letter writers based on cases like yours…', duration: 10 },
  { label: 'Mapping evidence gaps against USCIS adjudicator patterns…', duration: 10 },
  { label: 'Scanning RFE database to preempt your vulnerabilities…', duration: 10 },
  { label: 'Analysing O-1A approval rates for your specific profile…', duration: 8 },
  { label: 'Writing your personalised 30-day attorney-approved sprint…', duration: 8 },
  { label: 'Compiling attorney briefing and final recommendations…', duration: 8 },
]

const TOTAL = STEPS.reduce((a, s) => a + s.duration, 0)
const TIMEOUT_SECONDS = 600 // 10 min hard stop → show retry

interface Props { reportId: string; reportType: 'strategy' | 'rfe' }

// Animated SVG progress ring
function ProgressRing({ progress }: { progress: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width="128" height="128" className="rotate-[-90deg]">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#E6FAF7" strokeWidth="10" />
      <circle
        cx="64" cy="64" r={r} fill="none"
        stroke="#00C2A8" strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      {/* Percent text — counter-rotate so text reads normally */}
      <text
        x="64" y="64"
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '64px 64px',
                 fontSize: '18px', fontWeight: 700, fill: '#1B2B6B' }}
      >
        {progress}%
      </text>
    </svg>
  )
}

export default function GeneratingView({ reportId, reportType }: Props) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const generateCalled = useRef(false)

  // Fire generation exactly once on mount
  useEffect(() => {
    if (generateCalled.current) return
    generateCalled.current = true
    fetch(`/api/${reportType}/generate/${reportId}`, { method: 'POST' })
      .then(r => r.json())
      .then(b => { if (b.error) setError(b.error) })
      .catch(e => setError(String(e)))
  }, [reportId, reportType])

  // Poll status every 5 seconds
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/${reportType}/status/${reportId}`)
        const b = await res.json()
        if (b.status === 'complete') { clearInterval(iv); router.refresh() }
        else if (b.status === 'error') { clearInterval(iv); setError('Generation failed. Please retry.') }
      } catch { /* keep polling on network blip */ }
    }, 5000)
    return () => clearInterval(iv)
  }, [reportId, reportType, router])

  // Tick elapsed and detect timeout
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(s => {
        const next = s + 1
        if (next >= TIMEOUT_SECONDS) setTimedOut(true)
        return next
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Advance step based on cumulative durations
  useEffect(() => {
    let acc = 0
    for (let i = 0; i < STEPS.length; i++) {
      acc += STEPS[i].duration
      if (elapsed < acc) { setStepIndex(i); return }
    }
    setStepIndex(STEPS.length - 1)
  }, [elapsed])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeLabel = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, '0')}s`
    : `${secs}s`

  // Progress capped at 98 until server confirms complete
  const progress = Math.min(98, Math.round((elapsed / TOTAL) * 100))

  if (error || timedOut) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-xl font-bold text-navy">
          {timedOut ? 'This is taking longer than expected' : 'Generation failed'}
        </h2>
        <p className="text-sm text-mid bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {timedOut
            ? 'Your report may still be generating. Click retry to check — your payment is safe.'
            : error}
        </p>
        <a href={`/${reportType}/report/${reportId}`} className="btn-teal inline-block">
          Check / Retry →
        </a>
        <br />
        <a href="/dashboard" className="text-sm text-mid underline">← Back to Dashboard</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-16 space-y-8">

      {/* Animated ring + label */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <ProgressRing progress={progress} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Building your strategy report…</h1>
          <p className="text-sm text-mid mt-1">
            AI + attorney-quality analysis · typically <strong>2–4 minutes</strong>
          </p>
        </div>
      </div>

      {/* Current step + timer */}
      <div className="card bg-navy text-white py-4 px-5 space-y-1">
        <p className="text-xs font-bold text-teal uppercase tracking-widest">Now running</p>
        <p className="text-sm font-semibold leading-snug">{STEPS[stepIndex].label}</p>
        <p className="text-xs text-white/50 font-mono">{timeLabel} elapsed</p>
      </div>

      {/* Checklist */}
      <div className="card py-4 space-y-2.5">
        <p className="text-xs font-bold text-mid uppercase tracking-widest mb-3">Your report includes</p>
        {STEPS.map((step, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-teal text-white' :
                active ? 'border-2 border-teal bg-teal-light animate-pulse' :
                'bg-gray-100 text-gray-300'
              }`}>
                {done ? '✓' : ''}
              </span>
              <span className={`text-xs leading-snug transition-colors ${
                done ? 'text-teal line-through' :
                active ? 'text-navy font-semibold' :
                'text-mid'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Reassurance */}
      <div className="text-center space-y-1">
        <p className="text-xs text-mid">🔒 Payment secured · Report saved automatically</p>
        <p className="text-xs text-mid">You can close this tab — your report will be ready in your dashboard.</p>
      </div>
    </div>
  )
}
