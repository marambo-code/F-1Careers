'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Hard caps so a dead job can never spin this UI forever: stop polling after
// MAX_POLLS (~12 min at 3s) and stop re-triggering generation after
// MAX_GENERATION_ATTEMPTS failures, then surface a retry state.
const MAX_POLLS = 240
const MAX_GENERATION_ATTEMPTS = 3

export default function RFEReportPoller({ reportId, isRetry = false }: { reportId: string; isRetry?: boolean }) {
  const router = useRouter()
  const [dots, setDots] = useState('.')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const generationStarted = useRef(false)
  const lastStatus = useRef<string | null>(null)
  const pollCount = useRef(0)
  const generationAttempts = useRef(0)

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const triggerGeneration = async () => {
      if (generationStarted.current) return
      if (generationAttempts.current >= MAX_GENERATION_ATTEMPTS) {
        setErrorMsg('Generation failed after several attempts. Your payment is safe, please try again in a few minutes.')
        return
      }
      generationStarted.current = true
      generationAttempts.current += 1
      try {
        const res = await fetch('/api/rfe/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportId }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setErrorMsg(body?.error ?? `Generation failed (${res.status})`)
          generationStarted.current = false
        }
      } catch (e) {
        setErrorMsg('Network error. Please refresh the page.')
        generationStarted.current = false
      }
    }

    if (isRetry) triggerGeneration()

    const poll = setInterval(async () => {
      pollCount.current += 1
      if (pollCount.current > MAX_POLLS) {
        clearInterval(poll)
        setErrorMsg('This is taking much longer than expected. Your payment is safe, refresh the page to check on your analysis.')
        return
      }
      try {
        const res = await fetch(`/api/rfe/status?reportId=${reportId}`)
        if (!res.ok) return
        const { status } = await res.json()

        if (lastStatus.current === 'generating' && status === 'paid') {
          generationStarted.current = false
        }
        lastStatus.current = status

        if ((status === 'paid' || status === 'error') && !generationStarted.current) {
          triggerGeneration()
        } else if (status === 'complete') {
          clearInterval(poll)
          router.refresh()
        }
      } catch { /* keep polling */ }
    }, 3000)

    return () => clearInterval(poll)
  }, [reportId, router, isRetry])

  if (errorMsg) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-navy">Generation failed</h2>
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{errorMsg}</p>
        <p className="text-mid text-sm">Your payment is safe. Please re-upload your RFE document to try again.</p>
        <a href="/rfe" className="btn-teal inline-block">Re-upload RFE →</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-24 space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-navy-light flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-navy" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-navy">Analyzing your RFE document{dots}</h2>
        <p className="text-mid mt-2 text-sm">
          Our AI is reading every issue in your USCIS document.<br />
          This takes about 30-60 seconds. This page will update automatically.
        </p>
      </div>
      <div className="card text-left space-y-2 text-sm text-mid">
        <p className="font-semibold text-navy">What's being built for you:</p>
        <p>✓ Issue-by-issue registry with plain-English explanations</p>
        <p>✓ Risk ranking: High / Medium / Low per issue</p>
        <p>✓ Response strategy: Rebut / Supplement / Narrow</p>
        <p>✓ Priority action list with 87-day response timeline</p>
      </div>
    </div>
  )
}
