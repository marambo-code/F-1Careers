'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CareerMove } from '@/lib/ai/career-moves'

// ── Impact / effort styling ───────────────────────────────────────

const IMPACT_STYLE: Record<string, string> = {
  High:   'bg-teal/10 text-teal border-teal/25',
  Medium: 'bg-blue-50 text-blue-600 border-blue-200',
}
const EFFORT_COLOR: Record<string, string> = {
  Low:    'text-teal',
  Medium: 'text-yellow-600',
  High:   'text-orange-500',
}

// ── Compact move card (dashboard preview) ────────────────────────

function MoveCard({ move, locked }: { move: CareerMove; locked?: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`card border border-border relative transition-all ${locked ? 'select-none' : ''}`}>
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-white/85 backdrop-blur-[3px] flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-mid mt-1.5">Pro move</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${IMPACT_STYLE[move.impact] ?? IMPACT_STYLE.Medium}`}>
          {move.impact === 'High' ? '↑ High' : '→ Med'} impact
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy text-sm leading-snug">{move.title}</p>
          <p className="text-xs text-mid mt-0.5">{move.criterion}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-xs font-semibold ${EFFORT_COLOR[move.effort] ?? ''}`}>{move.effort}</p>
          <p className="text-[10px] text-mid">effort</p>
        </div>
      </div>

      <p className="text-sm text-mid mt-3 leading-relaxed">{move.why}</p>

      {move.score_impact && (
        <p className="text-xs text-teal font-semibold mt-2">{move.score_impact}</p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-teal font-semibold mt-3 hover:underline flex items-center gap-1"
      >
        {expanded ? 'Hide' : 'First step'} {expanded ? '↑' : '→'}
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-teal/5 rounded-lg border border-teal/15 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-teal uppercase tracking-wide">Do this today</p>
            <span className="text-[10px] text-mid">· {move.timeframe}</span>
          </div>
          <p className="text-sm text-navy leading-relaxed">{move.first_step}</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
// This is a READ-ONLY preview of existing career moves.
// Generation always happens on the /career-moves page — never here.

interface CareerMovesSectionProps {
  initialMoves: CareerMove[] | null
  isPro: boolean
  hasStrategyReport: boolean
}

export default function CareerMovesSection({ initialMoves, isPro, hasStrategyReport }: CareerMovesSectionProps) {
  const [isProState, setIsProState] = useState(isPro)

  // Re-check Pro status — only upgrade, never downgrade
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.status === 'active' || data?.status === 'trialing') setIsProState(true)
        })
    })
  }, [])

  // ── No strategy report ────────────────────────────────────────
  if (!hasStrategyReport) {
    return (
      <div className="card bg-gradient-to-br from-teal/5 to-transparent border border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-navy text-sm">Run a strategy report to unlock your moves</p>
            <p className="text-sm text-mid mt-1 leading-relaxed">
              Your career moves are generated from your actual profile, criteria gaps, and field — not generic advice.
            </p>
            <Link href="/strategy" className="text-xs text-teal font-semibold hover:underline mt-2 inline-block">
              Run strategy report →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Not Pro ───────────────────────────────────────────────────
  if (!isProState) {
    const visibleMoves = initialMoves?.slice(0, 1) ?? []
    const lockedCount = (initialMoves?.length ?? 0) - visibleMoves.length

    return (
      <div className="space-y-3">
        {visibleMoves.map(move => <MoveCard key={move.id} move={move} />)}
        {lockedCount > 0 && Array.from({ length: Math.min(lockedCount, 2) }).map((_, i) => (
          <MoveCard key={`locked-${i}`} move={initialMoves![visibleMoves.length + i]} locked />
        ))}
        <div className="card bg-navy text-white text-center py-5">
          <p className="font-bold">Unlock all career moves</p>
          <p className="text-blue-200 text-sm mt-1 max-w-xs mx-auto">
            See exactly what to do this week, this month, and next quarter.
          </p>
          <Link href="/subscribe" className="inline-block mt-4 bg-teal text-white font-bold py-2.5 px-6 rounded-xl hover:bg-teal/90 transition-colors text-sm">
            Go Pro — $49/month
          </Link>
        </div>
      </div>
    )
  }

  // ── Pro: no moves cached on dashboard — just link to the page ────
  if (!initialMoves || initialMoves.length === 0) {
    return (
      <Link
        href="/career-moves"
        className="card border border-dashed flex items-center justify-between py-4 hover:border-teal/40 hover:bg-teal/[0.02] transition-all group"
      >
        <p className="text-sm text-mid group-hover:text-navy transition-colors">
          See your career moves
        </p>
        <svg className="w-4 h-4 text-mid group-hover:text-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </Link>
    )
  }

  // ── Pro: show preview of existing moves ───────────────────────
  const previewMoves = initialMoves.slice(0, 2)
  const remaining = initialMoves.length - previewMoves.length
  const done = initialMoves.filter((m: CareerMove & { completed?: boolean; status?: string }) =>
    m.status === 'done' || m.completed
  ).length

  return (
    <div className="space-y-3">
      {/* Progress summary */}
      <div className="flex items-center justify-between text-xs text-mid">
        <span className="font-semibold text-navy">{done} of {initialMoves.length} moves done</span>
        <Link href="/career-moves" className="text-teal font-semibold hover:underline">
          Manage all moves →
        </Link>
      </div>

      {previewMoves.map(move => <MoveCard key={move.id} move={move} />)}

      {remaining > 0 && (
        <Link
          href="/career-moves"
          className="card border border-dashed flex items-center justify-between py-3 hover:border-teal/40 hover:bg-teal/[0.02] transition-all group"
        >
          <p className="text-sm text-mid group-hover:text-navy transition-colors">
            +{remaining} more move{remaining > 1 ? 's' : ''} — click to manage
          </p>
          <svg className="w-4 h-4 text-mid group-hover:text-teal transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      )}
    </div>
  )
}
