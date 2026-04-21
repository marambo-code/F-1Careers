'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const sessionId = params.get('session_id')

  const [status, setStatus] = useState<'activating' | 'done' | 'error'>('activating')

  useEffect(() => {
    if (!sessionId) { setStatus('done'); return }

    // Immediately provision subscription — don't wait for webhook
    fetch('/api/subscriptions/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) console.warn('[activate]', data.error)
        setStatus('done')
      })
      .catch(e => {
        console.warn('[activate] network error:', e)
        setStatus('done') // webhook will handle it
      })
  }, [sessionId])

  // Auto-redirect to career moves after 3s
  useEffect(() => {
    if (status !== 'done') return
    const t = setTimeout(() => router.push('/career-moves'), 3000)
    return () => clearTimeout(t)
  }, [status, router])

  return (
    <div className="max-w-md mx-auto text-center space-y-6 pt-12">
      {status === 'activating' ? (
        <>
          <div className="w-20 h-20 mx-auto relative">
            <svg className="w-20 h-20 animate-spin-slow" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none" stroke="#14B8A6" strokeWidth="6"
                strokeDasharray="213.6"
                strokeDashoffset="53.4"
                strokeLinecap="round"
                className="animate-dash"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-teal text-2xl">✦</span>
            </div>
          </div>
          <div>
            <p className="text-navy font-bold text-lg">Activating your Pro membership…</p>
            <p className="text-mid text-sm mt-1">This takes just a second</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto rounded-full bg-teal/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span>✦</span> PRO MEMBER
            </div>
            <h1 className="text-2xl font-bold text-navy">You're in.</h1>
            <p className="text-mid mt-2 leading-relaxed">
              Your career moves are being personalized. Taking you there now…
            </p>
          </div>

          <div className="card text-left space-y-2.5">
            {[
              'Living Green Card Score — updates with every strategy report',
              'All 4 AI-personalized career moves, specific to your profile',
              'Notes and progress tracker on every move',
              'Score history — track your trajectory over time',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <span className="text-teal font-bold mt-0.5 flex-shrink-0">✓</span>
                <span className="text-mid">{item}</span>
              </div>
            ))}
          </div>

          <Link href="/career-moves" className="block w-full bg-teal text-white font-bold py-3 rounded-xl hover:bg-teal/90 transition-colors text-sm">
            Go to my career moves →
          </Link>
        </>
      )}
    </div>
  )
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto text-center pt-12">
        <div className="w-12 h-12 rounded-full border-4 border-teal/20 border-t-teal animate-spin mx-auto" />
        <p className="text-mid text-sm mt-4">Activating your membership…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
