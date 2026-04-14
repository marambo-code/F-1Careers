'use client'

import { useState } from 'react'
import type { CareerMove } from '@/lib/ai/career-moves'

const IMPACT_COLOR: Record<string, string> = {
  High: 'bg-teal/10 text-teal border-teal/20',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
}

const EFFORT_COLOR: Record<string, string> = {
  Low: 'text-teal',
  Medium: 'text-yellow-600',
  High: 'text-orange-500',
}

function MoveCard({ move, locked }: { move: CareerMove; locked?: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`card border border-border relative ${locked ? 'select-none' : ''}`}>
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-xs font-semibold text-mid mt-1">Pro</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border flex-shrink-0 ${IMPACT_COLOR[move.impact] ?? IMPACT_COLOR.Medium}`}>
          {move.impact === 'High' ? '↑ High' : '→ Med'} impact
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy text-sm leading-snug">{move.title}</p>
          <p className="text-xs text-mid mt-0.5">{move.criterion}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-mid flex-shrink-0">
          <span className={`font-semibold ${EFFORT_COLOR[move.effort] ?? ''}`}>{move.effort}</span>
          <span>effort</span>
        </div>
      </div>

      <p className="text-sm text-mid mt-3 leading-relaxed">{move.why}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-teal font-semibold mt-3 hover:underline"
      >
        {expanded ? 'Hide details ↑' : 'Show first step →'}
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-teal/5 rounded-lg border border-teal/15">
          <p className="text-xs font-bold text-teal uppercase tracking-wide mb-1">Next action · {move.timeframe}</p>
          <p className="text-sm text-navy leading-relaxed">{move.first_step}</p>
        </div>
      )}
    </div>
  )
}

interface CareerMovesSectionProps {
  initialMoves: CareerMove[] | null
  isPro: boolean
  hasStrategyReport: boolean
}

export default function CareerMovesSection({ initialMoves, isPro, hasStrategyReport }: CareerMovesSectionProps) {
  const [moves, setMoves] = useState<CareerMove[] | null>(initialMoves)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/career-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      const data = await res.json()
      if (data.moves) setMoves(data.moves)
      else setError(data.message ?? 'Failed to refresh. Try again.')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasStrategyReport) {
    return (
      <div className="card bg-gradient-to-br from-teal/5 to-transparent border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-navy text-sm">Unlock your personalized career moves</p>
            <p className="text-sm text-mid mt-1">Run a Green Card Strategy report to get 4 AI-generated moves that directly strengthen your petition.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!moves || moves.length === 0) {
    return (
      <div className="card bg-gradient-to-br from-teal/5 to-transparent border-dashed">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-navy text-sm">Career moves not generated yet</p>
            <p className="text-sm text-mid mt-1">Generate your personalized moves based on your current profile and score.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-teal text-xs py-2 px-4 flex-shrink-0 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate moves'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    )
  }

  // Free users: show 1 move, lock the rest
  const visibleMoves = isPro ? moves : moves.slice(0, 1)
  const lockedMoves = isPro ? [] : moves.slice(1)

  return (
    <div className="space-y-3">
      {visibleMoves.map(move => (
        <MoveCard key={move.id} move={move} />
      ))}

      {lockedMoves.map(move => (
        <MoveCard key={move.id} move={move} locked />
      ))}

      {!isPro && lockedMoves.length > 0 && (
        <div className="card bg-navy text-white text-center py-5">
          <p className="font-bold">Unlock all {moves.length} career moves</p>
          <p className="text-blue-200 text-sm mt-1">See exactly what to do this week, this month, and next quarter to move your score.</p>
          <a href="/subscribe" className="inline-block mt-4 bg-teal text-white font-bold py-2.5 px-6 rounded-xl hover:bg-teal/90 transition-colors text-sm">
            Go Pro — $29/month
          </a>
        </div>
      )}

      {isPro && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-mid">Moves refresh automatically after each new strategy report</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs text-teal font-semibold hover:underline disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
