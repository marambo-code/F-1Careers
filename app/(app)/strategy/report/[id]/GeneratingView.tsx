'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { label: 'Parsing resume and extracting evidence…', duration: 15 },
  { label: 'Scoring EB-1A criteria and NIW prongs…', duration: 20 },
  { label: 'Mapping resume lines to USCIS criteria…', duration: 25 },
  { label: 'Writing Dhanasar prong analysis…', duration: 40 },
  { label: 'Drafting proposed endeavor statement…', duration: 20 },
  { label: 'Building expert letter strategy…', duration: 25 },
  { label: 'Generating evidence playbook with named targets…', duration: 30 },
  { label: 'Modeling RFE risks and preemptive strategies…', duration: 20 },
  { label: 'Analyzing O-1A bridge visa options…', duration: 15 },
  { label: 'Writing 30-day sprint plan and roadmap…', duration: 20 },
  { label: 'Drafting attorney briefing paragraph…', duration: 15 },
  { label: 'Finalising your report…', duration: 10 },
]

interface Props {
  reportId: string
  reportType: 'strategy' | 'rfe'
}

export default function GeneratingView({ reportId, reportType }: Props) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const generateCalled = useRef(false)

  // Kick off generation on mount — exactly once
  useEffect(() => {
    if (generateCalled.current) return
    generateCalled.current = true

    fetch(`/api/${reportType}/generate/${reportId}`, { method: 'POST' })
      .then(res => res.json())
      .then(body => {
        if (body.error) setError(body.error)
      })
      .catch(e => setError(String(e)))
  }, [reportId, reportType])

  // Poll status every 4 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/${reportType}/status/${reportId}`)
        const body = await res.json()
        if (body.status === 'complete') {
          clearInterval(interval)
          router.refresh()
        } else if (body.status === 'error') {
          clearInterval(interval)
          setError('Generation failed. Please refresh to retry.')
        }
      } catch { /* network blip — keep polling */ }
    }, 4000)
    return () => clearInterval(interval)
  }, [reportId, reportType, router])

  // Tick elapsed time every second
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Advance through step labels based on cumulative durations
  useEffect(() => {
    let acc = 0
    for (let i = 0; i < STEPS.length; i++) {
      acc += STEPS[i].duration
      if (elapsed < acc) {
        setStepIndex(i)
        break
      }
      if (i === STEPS.length - 1) setStepIndex(i)
    }
  }, [elapsed])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeLabel = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, '0')}s`
    : `${secs}s`

  const totalExpected = STEPS.reduce((a, s) => a + s.duration, 0)
  const progress = Math.min(98, Math.round((elapsed / totalExpected) * 100))

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-navy">Generation failed</h2>
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        <a href={`/${reportType}/report/${reportId}`} className="btn-teal inline-block">Retry →</a>
        <br /><a href="/dashboard" className="text-sm text-mid underline">← Back to Dashboard</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-20 space-y-8">
      {/* Spinner + heading */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-teal-light border-t-teal animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-navy">Building your report…</h1>
        <p className="text-sm text-mid">
          Our AI is reading your resume line by line and writing attorney-quality analysis.
          <br />This typically takes <strong>2–3 minutes</strong>. Stay on this page.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-mid">
          <span>{STEPS[stepIndex].label}</span>
          <span className="font-mono">{timeLabel}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-mid text-right">{progress}%</p>
      </div>

      {/* Steps checklist */}
      <div className="card space-y-2 py-4">
        <p className="text-xs font-bold text-mid uppercase tracking-widest mb-3">What we're building</p>
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              i < stepIndex ? 'bg-teal text-white' :
              i === stepIndex ? 'border-2 border-teal bg-teal-light' :
              'bg-gray-100'
            }`}>
              {i < stepIndex ? '✓' : ''}
            </span>
            <span className={`text-xs ${
              i < stepIndex ? 'text-teal line-through' :
              i === stepIndex ? 'text-navy font-semibold' :
              'text-mid'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-mid">
        Your payment is secured. If you close this tab, your report will still be ready when you return.
      </p>
    </div>
  )
}
