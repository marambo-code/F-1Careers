'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES_FREE = [
  'Green Card Score snapshot (after strategy report)',
  'Full Green Card Strategy report ($150)',
  'Full RFE Analysis report ($200)',
  '1 career move preview',
]

const FEATURES_PRO = [
  'Living Green Card Score — updates as your profile grows',
  'All 4 AI-personalized career moves, refreshed monthly',
  'Score history chart — see your trajectory over time',
  'Priority email support',
  'Early access to new features',
]

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.error === 'already_subscribed') {
        router.push('/dashboard')
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      // Surface the actual server error
      setError(data.error ? `Error: ${data.error}` : 'Something went wrong. Please try again.')
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-teal uppercase tracking-widest">Pro Membership</span>
        <h1 className="text-2xl font-bold text-navy mt-1">Your Green Card Score, always current</h1>
        <p className="text-mid mt-2">
          Your petition strength changes as your career grows. A Pro membership turns your score into a living signal — so you always know exactly where you stand and what to do next.
        </p>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free */}
        <div className="card border border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-mid mb-1">Free</p>
          <p className="text-2xl font-bold text-navy">$0</p>
          <p className="text-sm text-mid mb-4">Pay per report</p>
          <ul className="space-y-2">
            {FEATURES_FREE.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-mid">
                <span className="text-mid mt-0.5">○</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="card border-2 border-teal bg-teal/5 relative">
          <div className="absolute -top-3 left-4">
            <span className="bg-teal text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal mb-1">Pro</p>
          <p className="text-2xl font-bold text-navy">$29<span className="text-base font-normal text-mid">/month</span></p>
          <p className="text-sm text-mid mb-4">Cancel anytime</p>
          <ul className="space-y-2">
            {FEATURES_PRO.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-navy">
                <span className="text-teal mt-0.5 font-bold">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="card bg-navy text-white">
        <h2 className="font-bold text-xl">Start your Pro membership</h2>
        <p className="text-blue-200 text-sm mt-2">
          Your score updates every time you complete a new strategy report. Watch your number climb as you execute your career moves.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-6 w-full bg-teal text-white font-bold py-3 rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Redirecting to checkout...' : 'Subscribe for $29/month'}
        </button>
        <p className="text-blue-300 text-xs text-center mt-3">
          Secured by Stripe · Cancel anytime from your account
        </p>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h3 className="font-semibold text-navy">Common questions</h3>
        {[
          {
            q: 'Does my score actually change?',
            a: 'Yes. Every time you complete a new Green Card Strategy report, your score is recalculated based on your updated profile. Most users see their score climb 5–15 points after executing 2–3 career moves.',
          },
          {
            q: 'What are career moves?',
            a: 'AI-generated, hyper-specific actions tied to weak EB-1A criteria or NIW prongs in your profile. For example: "Submit a peer review for a Nature Methods manuscript" — not generic advice.',
          },
          {
            q: 'Can I cancel?',
            a: 'Yes, at any time. You keep access through the end of your billing period.',
          },
          {
            q: 'Do I still pay per report?',
            a: 'Yes. The subscription covers your living score, career moves, and history. Individual strategy and RFE reports are still purchased separately.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="border-b border-border pb-4">
            <p className="font-medium text-navy text-sm">{q}</p>
            <p className="text-mid text-sm mt-1">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
