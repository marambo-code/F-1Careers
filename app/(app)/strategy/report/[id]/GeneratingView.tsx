'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Honest step labels: each describes work the generator actually does.
// No invented dataset sizes and no claims of "approved case" benchmarking,
// the corpus behind the Precedent Engine is appeal decisions, not approvals.
const STEPS = [
  { label: 'Extracting evidence from your resume, line by line…',            duration: 8 },
  { label: 'Scoring your EB-1A criteria against the 10 regulatory standards…', duration: 12 },
  { label: 'Scoring your NIW case against the three Dhanasar prongs…',       duration: 10 },
  { label: 'Weighing your strongest pathway: NIW, EB-1A, or both…',          duration: 12 },
  { label: 'Drafting petition brief language for each Dhanasar prong…',      duration: 14 },
  { label: 'Drafting your proposed endeavor statement…',                     duration: 10 },
  { label: 'Mapping each resume line to the criterion it supports…',         duration: 10 },
  { label: 'Flagging the RFE objections your petition is most likely to face…', duration: 10 },
  { label: 'Mapping your evidence gaps and how to close each one…',          duration: 10 },
  { label: 'Assessing O-1A as a bridge option for your visa timeline…',      duration: 8 },
  { label: 'Planning your expert letter strategy, writer by writer…',        duration: 10 },
  { label: 'Writing your personalised 30-day action plan…',                  duration: 8 },
  { label: 'Compiling your 3, 6, and 12 month roadmap…',                     duration: 8 },
]

const TOTAL = STEPS.reduce((a, s) => a + s.duration, 0)  // ~130 s
const TIMEOUT_SECONDS = 600  // 10 min hard stop → show retry
// If the server still reports 'generating' at this point, the original
// function almost certainly died (SDK timeouts cap real work at ~4 min).
// Re-POST once: the generate route restarts jobs stale for more than 5 min.
const REFIRE_AT_SECONDS = 350

interface Props { reportId: string; reportType: 'strategy' | 'rfe' }

// SVG progress ring
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
  const doneRef = useRef(false)       // prevent double navigation
  const postDoneRef = useRef(false)   // true once the generate POST has returned
  const firePostRef = useRef<(() => void) | null>(null) // for stale-job refire
  const refiredRef = useRef(false)

  // Called when we know generation is complete, transition to the report.
  const handleComplete = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    if (pollRef.current) clearInterval(pollRef.current)
    router.push(`/${reportType}/report/${reportId}`)
  }, [router, reportId, reportType])

  // ── Fire generation POST on mount, with auto-retry on network errors ─
  useEffect(() => {
    if (generateCalled.current) return
    generateCalled.current = true

    const MAX_NETWORK_RETRIES = 3
    let attempt = 0

    const firePost = () => {
      attempt++
      fetch(`/api/${reportType}/generate/${reportId}`, { method: 'POST' })
        .then(r => r.json())
        .then(b => {
          postDoneRef.current = true
          if (b.status === 'complete') handleComplete()
          else if (b.error) setError(b.error)
          // 'generating' = another request already in flight, poll will catch it
        })
        .catch(e => {
          // "Failed to fetch" = true network error (no response at all, different from a
          // server error like "timed out" which comes back as b.error via .then()).
          // Only retry on true network errors, not on server-reported failures.
          if (attempt < MAX_NETWORK_RETRIES) {
            console.warn(`[GeneratingView] Network error attempt ${attempt}, retrying in 4s:`, String(e))
            setTimeout(firePost, 4000)
          } else {
            postDoneRef.current = true
            setError(`Network error, please check your connection and click Retry below.`)
          }
        })
    }

    firePostRef.current = firePost
    firePost()
  }, [reportId, reportType, handleComplete])

  // ── Stale-job auto-recovery ────────────────────────────────────────
  // A serverless function that dies mid-generation leaves the row on
  // 'generating' with no one working on it. Re-POST once after the server's
  // stale window has passed; the generate route restarts stale jobs and
  // dedupes healthy ones, so this is safe even if the first run is alive.
  useEffect(() => {
    if (elapsed !== REFIRE_AT_SECONDS || refiredRef.current) return
    if (error || timedOut || doneRef.current) return
    refiredRef.current = true
    console.warn('[GeneratingView] Still generating after', REFIRE_AT_SECONDS, 's, re-firing generate POST')
    firePostRef.current?.()
  }, [elapsed, error, timedOut])

  // ── Poll status every 5 seconds (backup for reconnects / tab switching) ──
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/${reportType}/status/${reportId}`)
        const b = await res.json()
        if (b.status === 'complete') handleComplete()
        else if (b.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          // Only set error from poll if the POST hasn't already surfaced a real error message
          if (!postDoneRef.current) {
            setError('Generation failed, click Retry below.')
          }
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

  // ── Advance step label based on elapsed time ──────────────────────
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

  // ── Error / timeout state ─────────────────────────────────────────
  if (error || timedOut) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <div className="text-4xl mb-2">⚠️</div>
        <h2 className="text-xl font-bold text-navy">
          {timedOut ? 'This is taking longer than expected' : 'Generation failed'}
        </h2>
        <p className="text-sm text-mid bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
          {timedOut
            ? 'Your report may still be generating in the background. Click Retry to check, your payment is safe.'
            : error}
        </p>
        <a
          href={`/${reportType}/report/${reportId}`}
          className="btn-teal inline-block"
        >
          Retry / Check Report →
        </a>
        <br />
        <a href="/dashboard" className="text-sm text-mid underline">← Back to Dashboard</a>
      </div>
    )
  }

  // ── Generating state ──────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-16 space-y-8">

      {/* Ring + heading */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <ProgressRing progress={progress} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">Building your strategy report…</h1>
          <p className="text-sm text-mid mt-1">
            A deep, criterion-by-criterion analysis of your profile is underway. This is thorough work, please hold on.
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

      {/* Reassurance footer */}
      <div className="text-center space-y-1">
        <p className="text-xs text-mid">🔒 Payment secured · Report saved automatically</p>
        <p className="text-xs text-mid">You can close this tab, your report will be ready in your dashboard.</p>
      </div>
    </div>
  )
}
