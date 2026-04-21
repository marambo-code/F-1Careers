'use client'

import { useState, useEffect, useRef } from 'react'
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

// ── Loading skeleton ──────────────────────────────────────────────

const LOADING_PHRASES = [
  'Reviewing your profile…',
  'Analyzing your criteria gaps…',
  'Identifying your strongest opportunities…',
  'Crafting your personalized moves…',
  'Almost ready…',
]

function LoadingSkeleton() {
  const [phraseIdx, setPhraseIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length)
    }, 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal inline-block"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-xs text-teal font-medium transition-all duration-500">
          {LOADING_PHRASES[phraseIdx]}
        </p>
      </div>

      {[0, 1, 2, 3].map(i => (
        <div key={i} className="card border border-border overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="h-6 w-20 bg-gray-100 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <div className="h-3 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="h-4 w-12 bg-gray-100 rounded flex-shrink-0" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-11/12" />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 1.6s infinite; }
      `}</style>
    </div>
  )
}

// ── Move card (compact dashboard version) ────────────────────────

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

// ── Pro badge ─────────────────────────────────────────────────────

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-teal/20 to-teal/10 text-teal border border-teal/25">
      ✦ PRO
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────

interface CareerMovesSectionProps {
  initialMoves: CareerMove[] | null
  isPro: boolean
  hasStrategyReport: boolean
}

export default function CareerMovesSection({ initialMoves, isPro, hasStrategyReport }: CareerMovesSectionProps) {
  const [moves, setMoves] = useState<CareerMove[] | null>(initialMoves)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Client-side Pro state — starts with server value but re-checks immediately
  const [isProState, setIsProState] = useState(isPro)
  const autoTriggered = useRef(false)

  // Re-check Pro status on the client every time this component mounts.
  // CRITICAL: only upgrade to Pro — never downgrade. The server may have
  // rendered isPro=false before subscribe/activate completed; this self-corrects.
  // We never call setIsProState(false) here because the server-side value is
  // the authoritative source for "not Pro."
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.status === 'active' || data?.status === 'trialing') {
            setIsProState(true)
          }
          // Never set to false — trust the server-side isPro prop
        })
    })
  }, [])

  // Auto-generate moves when Pro is detected and no moves exist yet.
  // This handles the "just subscribed" moment — fires once.
  useEffect(() => {
    if (isProState && !moves && hasStrategyReport && !loading && !autoTriggered.current) {
      autoTriggered.current = true
      handleGenerate(false) // use cache if available, no forced regen
    }
  }, [isProState, moves, hasStrategyReport, loading])

  const handleGenerate = async (force = true) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/career-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? `Error ${res.status}`)
        return
      }
      if (data.moves?.length > 0) {
        setMoves(data.moves)
      } else if (data.error) {
        setError(data.message ?? data.error)
      } else {
        setError('No moves returned. Please try again.')
      }
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

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
          </div>
        </div>
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />

  // ── No moves yet ──────────────────────────────────────────────
  if (!moves || moves.length === 0) {
    return (
      <div className="space-y-3">
        <div className="card border border-dashed">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-navy text-sm">Your moves are ready to generate</p>
              <p className="text-sm text-mid mt-1">Takes ~15 seconds. Personalized to your exact profile and criteria gaps.</p>
            </div>
            <button
              onClick={() => handleGenerate(true)}
              className="btn-teal text-xs py-2 px-4 flex-shrink-0"
            >
              Generate moves →
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-3 bg-red-50 p-2 rounded">{error}</p>}
        </div>
      </div>
    )
  }

  // ── Moves: free shows 1 + locked, Pro shows all ───────────────
  const visibleMoves = isProState ? moves : moves.slice(0, 1)
  const lockedMoves  = isProState ? [] : moves.slice(1)

  return (
    <div className="space-y-3">
      {/* Pro member header */}
      {isProState && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ProBadge />
            <p className="text-xs text-mid">All moves unlocked</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/career-moves" className="text-xs text-mid hover:text-navy transition-colors">
              Full view →
            </Link>
            <button
              onClick={() => handleGenerate(true)}
              className="text-xs text-teal font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {visibleMoves.map(move => <MoveCard key={move.id} move={move} />)}
      {lockedMoves.map(move => <MoveCard key={move.id} move={move} locked />)}

      {/* Upgrade CTA — free only */}
      {!isProState && lockedMoves.length > 0 && (
        <div className="card bg-navy text-white text-center py-5">
          <ProBadge />
          <p className="font-bold mt-2">Unlock all {moves.length} career moves</p>
          <p className="text-blue-200 text-sm mt-1 max-w-xs mx-auto">
            See exactly what to do this week, this month, and next quarter to move your score.
          </p>
          <a
            href="/subscribe"
            className="inline-block mt-4 bg-teal text-white font-bold py-2.5 px-6 rounded-xl hover:bg-teal/90 transition-colors text-sm"
          >
            Go Pro — $49/month
          </a>
        </div>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>}
    </div>
  )
}
