'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function relativeTime(iso?: string): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const diff = Date.now() - then
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

export default function StrategyResumeCard({
  step,
  totalSteps,
  savedAt,
}: {
  step: number
  totalSteps: number
  savedAt?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [clearing, setClearing] = useState(false)

  // step is 0-indexed; show it as 1-indexed and cap within range.
  const currentStep = Math.min(Math.max(step + 1, 1), totalSteps)
  const pct = Math.round((currentStep / totalSteps) * 100)
  const saved = relativeTime(savedAt)

  const handleStartOver = async () => {
    if (clearing) return
    if (!window.confirm('Clear your saved answers and start over? This cannot be undone.')) return
    setClearing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ strategy_draft: null }).eq('id', user.id)
    }
    router.refresh()
  }

  return (
    <div className="rounded-2xl border-2 border-teal bg-teal/4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold text-mid uppercase tracking-widest">
              Stage 1 of 5, Know Your Chances
            </p>
            <span className="text-[10px] font-bold text-teal bg-teal/12 border border-teal/25 rounded-full px-2 py-0.5 leading-none">
              In progress
            </span>
          </div>
          <h2 className="text-lg font-bold text-navy">Pick up where you left off</h2>
          <p className="text-sm text-mid mt-1.5 leading-relaxed max-w-xl">
            You started your green card score questionnaire. Continue from step {currentStep} of {totalSteps}
            {saved ? ` — last saved ${saved}.` : '.'} Your answers are saved.
          </p>

          {/* Progress bar */}
          <div className="mt-3 max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-mid">Step {currentStep} of {totalSteps}</span>
              <span className="text-[10px] font-semibold text-teal">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Link href="/strategy/questionnaire" className="inline-flex items-center gap-2 btn-primary text-sm">
              Continue questionnaire →
            </Link>
            <button
              type="button"
              onClick={handleStartOver}
              disabled={clearing}
              className="text-xs text-mid hover:text-red-600 underline disabled:opacity-50"
            >
              {clearing ? 'Clearing…' : 'Start over'}
            </button>
          </div>
        </div>
        <div className="text-4xl hidden sm:block flex-shrink-0">📊</div>
      </div>
    </div>
  )
}
