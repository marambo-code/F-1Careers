'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CareerMove } from '@/lib/ai/career-moves'
import type { GreenCardScore } from '@/lib/scoring'

// ── Loading skeleton ──────────────────────────────────────────────

const LOADING_PHRASES = [
  'Reviewing your profile…',
  'Analyzing your criteria gaps…',
  'Identifying your strongest opportunities…',
  'Building your 90-day campaign…',
  'Crafting personalized first steps…',
  'Almost ready…',
]

function LoadingSkeleton() {
  const [phraseIdx, setPhraseIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length), 1800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-teal inline-block"
              style={{ animation: `moveBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <p className="text-sm text-teal font-medium">{LOADING_PHRASES[phraseIdx]}</p>
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="card border border-border overflow-hidden relative min-h-[120px]">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: 'moveShimmer 1.6s infinite' }} />
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-6 w-24 bg-gray-100 rounded-full" />
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
              <div className="h-6 w-20 bg-gray-100 rounded-full ml-auto" />
            </div>
            <div className="h-5 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-2/5" />
            <div className="space-y-2 mt-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-11/12" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes moveBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes moveShimmer { 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  )
}

// ── Tag chip ──────────────────────────────────────────────────────

const TAG_STYLE: Record<string, string> = {
  'Quick Win':    'bg-teal/10 text-teal border-teal/25',
  'High Leverage':'bg-purple-50 text-purple-700 border-purple-200',
  'Long Game':    'bg-orange-50 text-orange-600 border-orange-200',
  'Foundation':   'bg-blue-50 text-blue-600 border-blue-200',
}
const EFFORT_DOT: Record<string, string> = {
  Low: 'bg-teal', Medium: 'bg-yellow-400', High: 'bg-orange-400',
}

// ── Full move card (dedicated page version) ───────────────────────

function FullMoveCard({
  move,
  locked,
  index,
}: {
  move: CareerMove
  locked?: boolean
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [evidenceChecked, setEvidenceChecked] = useState<Record<number, boolean>>({})

  const toggleEvidence = (i: number) =>
    setEvidenceChecked(prev => ({ ...prev, [i]: !prev[i] }))

  return (
    <div className={`relative rounded-2xl border transition-all duration-200 ${locked ? 'select-none' : 'hover:shadow-md'} ${locked ? 'border-gray-200 bg-gray-50/50' : 'border-border bg-white shadow-sm'}`}>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-mid">Pro move · Unlock for $29/month</p>
          <Link href="/subscribe" className="text-xs bg-teal text-white font-bold px-4 py-2 rounded-xl hover:bg-teal/90 transition-colors">
            Go Pro →
          </Link>
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-black flex items-center justify-center flex-shrink-0">
              {index + 1}
            </span>
            {move.tag && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${TAG_STYLE[move.tag] ?? TAG_STYLE['Foundation']}`}>
                {move.tag}
              </span>
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${move.impact === 'High' ? 'bg-teal/10 text-teal border-teal/25' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              {move.impact === 'High' ? '↑ High impact' : '→ Medium impact'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${EFFORT_DOT[move.effort] ?? 'bg-gray-300'}`} />
            <span className="text-xs text-mid">{move.effort} effort</span>
            <span className="text-mid text-xs">·</span>
            <span className="text-xs text-mid">{move.timeframe}</span>
          </div>
        </div>

        {/* Title + criterion */}
        <h3 className="text-base font-bold text-navy leading-snug">{move.title}</h3>
        <p className="text-xs font-semibold text-teal mt-1">{move.criterion}</p>

        {/* Why + score impact */}
        <p className="text-sm text-mid mt-3 leading-relaxed">{move.why}</p>
        {move.score_impact && (
          <p className="text-xs font-bold text-teal mt-2 flex items-center gap-1">
            <span className="text-teal">▲</span> {move.score_impact}
          </p>
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={!!locked}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-teal transition-colors disabled:opacity-50"
        >
          <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          {expanded ? 'Hide details' : 'View action plan'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">

            {/* Do this today */}
            <div className="rounded-xl bg-teal/5 border border-teal/15 p-4">
              <p className="text-[11px] font-black text-teal uppercase tracking-widest mb-2">Do this today</p>
              <p className="text-sm text-navy leading-relaxed">{move.first_step}</p>
            </div>

            {/* 30-day milestone */}
            {move.milestone_30d && (
              <div className="rounded-xl bg-navy/3 border border-navy/10 p-4">
                <p className="text-[11px] font-black text-navy uppercase tracking-widest mb-2">30-day milestone</p>
                <p className="text-sm text-navy/80 leading-relaxed">{move.milestone_30d}</p>
              </div>
            )}

            {/* Evidence checklist */}
            {move.evidence && move.evidence.length > 0 && (
              <div>
                <p className="text-[11px] font-black text-mid uppercase tracking-widest mb-2">Evidence to collect for your petition file</p>
                <div className="space-y-2">
                  {move.evidence.map((item, i) => (
                    <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                      <div
                        onClick={() => toggleEvidence(i)}
                        className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                          evidenceChecked[i] ? 'bg-teal border-teal' : 'border-gray-300 group-hover:border-teal/50'
                        }`}
                      >
                        {evidenceChecked[i] && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm leading-relaxed ${evidenceChecked[i] ? 'line-through text-mid' : 'text-navy'}`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────

interface CareerMovesClientProps {
  initialMoves: CareerMove[] | null
  generatedAt: string | null
  isPro: boolean
  hasStrategyReport: boolean
  greenCardScore: GreenCardScore | null
  niwScore: number | null
  eb1aScore: number | null
  reportId: string | null
  fieldOfWork: string | null
}

// ── Main client component ─────────────────────────────────────────

export default function CareerMovesClient({
  initialMoves,
  generatedAt,
  isPro,
  hasStrategyReport,
  greenCardScore,
  niwScore,
  eb1aScore,
  reportId,
}: CareerMovesClientProps) {
  const [moves, setMoves] = useState<CareerMove[] | null>(initialMoves)
  const [genAt, setGenAt] = useState<string | null>(generatedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProState, setIsProState] = useState(isPro)
  const autoTriggered = useRef(false)

  // Re-check Pro status client-side
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          const nowPro = data?.status === 'active' || data?.status === 'trialing'
          setIsProState(nowPro)
        })
    })
  }, [])

  // Auto-generate when Pro and no cached moves
  useEffect(() => {
    if (isProState && !moves && hasStrategyReport && !loading && !autoTriggered.current) {
      autoTriggered.current = true
      handleGenerate(false)
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
        setGenAt(new Date().toISOString())
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

  // ── Score summary strip ────────────────────────────────────────

  const ScoreStrip = () => greenCardScore ? (
    <div className="flex items-center gap-4 flex-wrap text-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl font-black text-teal">{greenCardScore.overall}</span>
        <span className="text-mid text-xs">/100</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          greenCardScore.label === 'Exceptional' || greenCardScore.label === 'Strong'
            ? 'bg-teal/10 text-teal' : 'bg-yellow-50 text-yellow-700'
        }`}>{greenCardScore.label}</span>
      </div>
      <span className="text-mid text-xs">·</span>
      <span className="text-xs text-mid">
        Best pathway: <span className="font-semibold text-navy">{greenCardScore.bestPathway}</span>
      </span>
      {niwScore !== null && (
        <>
          <span className="text-mid text-xs">·</span>
          <span className="text-xs text-mid">NIW <span className="font-semibold text-navy">{niwScore}</span></span>
          <span className="text-xs text-mid">EB-1A <span className="font-semibold text-navy">{eb1aScore}</span></span>
        </>
      )}
      {reportId && (
        <Link href={`/strategy/report/${reportId}`} className="text-xs text-teal font-semibold hover:underline ml-auto">
          View full report →
        </Link>
      )}
    </div>
  ) : null

  // ── No strategy report ─────────────────────────────────────────
  if (!hasStrategyReport) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
          <p className="text-mid mt-1">Your 4 personalized actions to strengthen your green card case</p>
        </div>
        <div className="card border-2 border-dashed border-teal/20 bg-teal/3 text-center py-12">
          <div className="w-14 h-14 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="font-bold text-navy text-lg">Run a strategy report first</p>
          <p className="text-mid text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Your career moves are generated from your actual criteria scores and field — not templates.
          </p>
          <Link href="/strategy" className="inline-block mt-6 btn-teal">
            Get my green card strategy →
          </Link>
        </div>
      </div>
    )
  }

  // ── Main content ───────────────────────────────────────────────
  const visibleMoves = isProState ? (moves ?? []) : (moves ?? []).slice(0, 1)
  const lockedMoves  = isProState ? [] : (moves ?? []).slice(1)

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
          <p className="text-mid mt-1 text-sm">Your 4 personalized actions to strengthen your green card petition</p>
        </div>
        {isProState && (
          <button
            onClick={() => handleGenerate(true)}
            disabled={loading}
            className="btn-teal text-sm py-2 px-5 disabled:opacity-50 flex-shrink-0"
          >
            {loading ? 'Regenerating…' : 'Regenerate moves'}
          </button>
        )}
      </div>

      {/* Score strip */}
      {greenCardScore && (
        <div className="card py-3 px-4">
          <ScoreStrip />
        </div>
      )}

      {/* Generated at */}
      {genAt && (
        <p className="text-xs text-mid">
          Generated {new Date(genAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          <button onClick={() => handleGenerate(true)} className="text-teal hover:underline">Refresh</button>
        </p>
      )}

      {/* Loading */}
      {loading && <LoadingSkeleton />}

      {/* No moves yet */}
      {!loading && (!moves || moves.length === 0) && (
        <div className="card border-2 border-dashed text-center py-10">
          <p className="font-semibold text-navy">Your moves are ready to generate</p>
          <p className="text-sm text-mid mt-1 mb-5">Takes ~15 seconds. Fully personalized to your criteria gaps.</p>
          <button onClick={() => handleGenerate(true)} className="btn-teal">
            Generate my career moves →
          </button>
          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        </div>
      )}

      {/* Moves */}
      {!loading && moves && moves.length > 0 && (
        <>
          {/* Pro: all moves visible */}
          {isProState && (
            <div className="space-y-4">
              {visibleMoves.map((move, i) => (
                <FullMoveCard key={move.id} move={move} index={i} />
              ))}
            </div>
          )}

          {/* Free: 1 visible + locked */}
          {!isProState && (
            <>
              {visibleMoves.map((move, i) => (
                <FullMoveCard key={move.id} move={move} index={i} />
              ))}

              {lockedMoves.length > 0 && (
                <div className="space-y-4">
                  {/* Upgrade banner */}
                  <div className="rounded-2xl bg-navy text-white p-6 text-center space-y-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-teal/25 text-teal border border-teal/30">
                      ✦ PRO
                    </span>
                    <p className="font-bold text-lg">Unlock your full 90-day campaign</p>
                    <p className="text-blue-200 text-sm max-w-sm mx-auto leading-relaxed">
                      See your remaining {lockedMoves.length} moves — including action plans, evidence checklists, and 30-day milestones for each.
                    </p>
                    <Link
                      href="/subscribe"
                      className="inline-block bg-teal text-white font-bold py-3 px-8 rounded-xl hover:bg-teal/90 transition-colors"
                    >
                      Go Pro — $29/month
                    </Link>
                  </div>
                  {lockedMoves.map((move, i) => (
                    <FullMoveCard key={move.id} move={move} locked index={visibleMoves.length + i} />
                  ))}
                </div>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}
        </>
      )}

      {/* Bottom nav */}
      <div className="flex items-center gap-4 pt-2 text-sm">
        <Link href="/dashboard" className="text-mid hover:text-navy transition-colors">← Dashboard</Link>
        <Link href="/strategy" className="text-mid hover:text-navy transition-colors">Strategy report →</Link>
      </div>
    </div>
  )
}
