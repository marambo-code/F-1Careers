'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { label: 'Reading every page of your RFE document…',                       duration: 8 },
  { label: 'Running USCIS objections against our denial database…',          duration: 14 },
  { label: 'Classifying issues by risk level and legal standard…',           duration: 12 },
  { label: 'Cross-referencing with successful RFE response patterns…',       duration: 14 },
  { label: 'Building rebuttal strategy per issue with attorney guidance…',   duration: 14 },
  { label: 'Identifying critical evidence gaps to close before deadline…',   duration: 12 },
  { label: 'Writing plain-English explanations for each USCIS objection…',   duration: 10 },
  { label: 'Prioritising your action list by urgency and impact…',           duration: 8 },
]

const TOTAL = STEPS.reduce((a, s) => a + s.duration, 0)
const TIMEOUT_SECONDS = 600

interface Props { reportId: string; reportType: 'strategy' | 'rfe' }

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
      <text
        x="64" y="64"
        textAnchor="middle" dominantBaseline="central"
        style={{
          transform: 'rotate(90deg)', transformOrigin: '64px 64px',
          fontSize: '18px', fontWeight: 700, fill: '#1B2B6B',
        }}
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    if (pollRef.current) clearInterval(pollRef.current)
    router.push(`/${reportType}/report/${reportId}`)
  }, [router, reportId, reportType])

  // ── Check status immediately on mount, then fire generation ──────
  useEffect(() => {
    if (generateCalled.current) return
    generateCalled.current = true

    fetch(`/api/${reportType}/status/${reportId}`)
      .then(r => r.json())
      .then(b => {
        if (b.status === 'complete') { handleComplete(); return }
        if (b.status === 'error') { setError('Generation failed — click Retry below.'); return }

        fetch(`/api/${reportType}/generate/${reportId}`, { method: 'POST' })
          .then(r => r.json())
          .then(b2 => {
            if (b2.status === 'complete') handleComplete()
            else if (b2.error) setError(b2.error)
          })
          .catch(e => setError(`Network error: ${String(e)}`))
      })
      .catch(() => {
        fetch(`/api/${reportType}/generate/${reportId}`, { method: 'POST' })
          .then(r => r.json())
          .then(b2 => {
            if (b2.status === 'complete') handleComplete()
            else if (b2.error) setError(b2.error)
          })
          .catch(e => setError(`Network error: ${String(e)}`))
      })
  }, [reportId, reportType, handleComplete])

  // ── Poll every 5 seconds ──────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/${reportType}/status/${reportId}`)
        const b = await res.json()
        if (b.status === 'complete') handleComplete()
        else if (b.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          setError('Generation failed — click Retry below.')
        }
      } catch { /* keep polling through transient network blips */ }
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [reportId, reportType, handleComplete])

  // ── Elapsed timer + timeout ───────────────────────────────────────
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
  const timeLabel = mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`
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
            ? 'Your report may still be generating in the background. Click Retry to check — your payment is safe.'
            : error}
        </p>
        <a href={`/${reportType}/report/${reportId}`} className="btn-teal inline-block">
          Retry / Check Report →
        </a>
        <br />
        <a href="/dashboard" className="text-sm text-mid underline">← Back to Dashboard</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-16 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <ProgressRing progress={progress} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Analysing your RFE…</h1>
          <p className="text-sm text-mid mt-1">
            Cross-referenced with 10,000+ USCIS RFE decisions · typically <strong>60–90 seconds</strong>
          </p>
        </div>
      </div>

      <div className="card bg-navy text-white py-4 px-5 space-y-1">
        <p className="text-xs font-bold text-teal uppercase tracking-widest">Now running</p>
        <p className="text-sm font-semibold leading-snug">{STEPS[stepIndex].label}</p>
        <p className="text-xs text-white/50 font-mono">{timeLabel} elapsed</p>
      </div>

      <div className="card py-4 space-y-2.5">
        <p className="text-xs font-bold text-mid uppercase tracking-widest mb-3">Your analysis includes</p>
        {STEPS.map((step, i) => {
          const done   = i < stepIndex
          const active = i === stepIndex
          return (
            <div key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                done   ? 'bg-teal text-white' :
                active ? 'border-2 border-teal bg-teal-light animate-pulse' :
                         'bg-gray-100 text-gray-300'
              }`}>
                {done ? '✓' : ''}
              </span>
              <span className={`text-xs leading-snug transition-colors ${
                done   ? 'text-teal line-through' :
                active ? 'text-navy font-semibold' :
                         'text-mid'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-mid">🔒 Payment secured · Report saved automatically</p>
        <p className="text-xs text-mid">You can close this tab — your report will be ready in your dashboard.</p>
      </div>
    </div>
  )
}
