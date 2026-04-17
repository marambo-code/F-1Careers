'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CareerMove } from '@/lib/ai/career-moves'
import type { GreenCardScore } from '@/lib/scoring'

type Move = CareerMove & { completed?: boolean }

// ── Completion ring ───────────────────────────────────────────────

function CompletionRing({ done, total }: { done: number; total: number }) {
  const r = 20, c = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="#14B8A6" strokeWidth="5"
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-navy leading-none">{done}</span>
        <span className="text-[9px] text-mid leading-none">/{total}</span>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────

const PHRASES = ['Reviewing your profile…', 'Analyzing criteria gaps…', 'Building your 90-day campaign…', 'Crafting personalized first steps…', 'Almost ready…']

function LoadingSkeleton() {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % PHRASES.length), 1800); return () => clearInterval(t) }, [])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-2">
        <div className="flex gap-1.5">{[0,1,2].map(j => <span key={j} className="w-2 h-2 rounded-full bg-teal" style={{ animation: `cmBounce 1.2s ease-in-out ${j*0.2}s infinite` }} />)}</div>
        <p className="text-sm text-teal font-medium">{PHRASES[i]}</p>
      </div>
      {[0,1,2,3].map(j => (
        <div key={j} className="card border overflow-hidden relative min-h-[100px]">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: 'cmShimmer 1.6s infinite' }} />
          <div className="space-y-3"><div className="flex gap-2"><div className="h-5 w-20 bg-gray-100 rounded-full"/><div className="h-5 w-16 bg-gray-100 rounded-full"/></div><div className="h-4 bg-gray-100 rounded w-3/4"/><div className="h-3 bg-gray-100 rounded w-full"/><div className="h-3 bg-gray-100 rounded w-5/6"/></div>
        </div>
      ))}
      <style>{`@keyframes cmBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}@keyframes cmShimmer{100%{transform:translateX(300%)}}`}</style>
    </div>
  )
}

// ── Move card ─────────────────────────────────────────────────────

const TAG_STYLE: Record<string, string> = {
  'Quick Win': 'bg-teal/10 text-teal border-teal/25',
  'High Leverage': 'bg-purple-50 text-purple-700 border-purple-200',
  'Long Game': 'bg-orange-50 text-orange-600 border-orange-200',
  'Foundation': 'bg-blue-50 text-blue-600 border-blue-200',
}

function MoveCard({ move, locked, onToggleComplete }: {
  move: Move
  locked?: boolean
  index?: number
  onToggleComplete?: (id: string, completed: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`relative rounded-2xl border transition-all duration-200 ${
      locked ? 'select-none border-gray-200 bg-gray-50/50' :
      move.completed ? 'border-teal/30 bg-teal/3' : 'border-border bg-white shadow-sm hover:shadow-md'
    }`}>

      {locked && (
        <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-mid">Pro move</p>
          <Link href="/subscribe" className="text-xs bg-teal text-white font-bold px-4 py-2 rounded-xl">Go Pro →</Link>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Completion checkbox */}
          {!locked && onToggleComplete && (
            <button
              onClick={() => onToggleComplete(move.id, !move.completed)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                move.completed ? 'bg-teal border-teal' : 'border-gray-300 hover:border-teal'
              }`}
              title={move.completed ? 'Mark as not done' : 'Mark as done'}
            >
              {move.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {move.tag && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${TAG_STYLE[move.tag] ?? TAG_STYLE.Foundation}`}>{move.tag}</span>
              )}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${move.impact === 'High' ? 'bg-teal/10 text-teal border-teal/25' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                {move.impact === 'High' ? '↑ High' : '→ Med'} impact
              </span>
              <span className="text-xs text-mid ml-auto">{move.effort} effort · {move.timeframe}</span>
            </div>

            <h3 className={`text-base font-bold leading-snug ${move.completed ? 'text-mid line-through' : 'text-navy'}`}>{move.title}</h3>
            <p className="text-xs font-semibold text-teal mt-1">{move.criterion}</p>
            <p className="text-sm text-mid mt-2 leading-relaxed">{move.why}</p>
            {move.score_impact && <p className="text-xs font-bold text-teal mt-2">▲ {move.score_impact}</p>}

            {move.completed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal mt-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Completed
              </span>
            )}
          </div>
        </div>

        {!move.completed && (
          <button onClick={() => setExpanded(!expanded)} disabled={!!locked}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-teal transition-colors">
            <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
            {expanded ? 'Hide details' : 'View action plan'}
          </button>
        )}

        {expanded && !move.completed && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="rounded-xl bg-teal/5 border border-teal/15 p-4">
              <p className="text-[11px] font-black text-teal uppercase tracking-widest mb-2">Do this today</p>
              <p className="text-sm text-navy leading-relaxed">{move.first_step}</p>
            </div>
            {move.milestone_30d && (
              <div className="rounded-xl bg-navy/[0.03] border border-navy/10 p-4">
                <p className="text-[11px] font-black text-navy uppercase tracking-widest mb-2">30-day milestone</p>
                <p className="text-sm text-navy/80 leading-relaxed">{move.milestone_30d}</p>
              </div>
            )}
            {move.evidence && move.evidence.length > 0 && (
              <div>
                <p className="text-[11px] font-black text-mid uppercase tracking-widest mb-2">Evidence to collect</p>
                <div className="space-y-2">
                  {move.evidence.map((item, ei) => (
                    <div key={ei} className="flex items-start gap-2 text-sm text-navy/80">
                      <span className="text-teal mt-0.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </div>
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

interface Props {
  initialMoves: Move[] | null
  generatedAt: string | null
  isPro: boolean
  hasStrategyReport: boolean
  greenCardScore: GreenCardScore | null
  niwScore: number | null
  eb1aScore: number | null
  reportId: string | null
  fieldOfWork: string | null
}

// ── Main ──────────────────────────────────────────────────────────

export default function CareerMovesClient({ initialMoves, generatedAt, isPro, hasStrategyReport, greenCardScore, niwScore, eb1aScore, reportId }: Props) {
  const [moves, setMoves] = useState<Move[]>(initialMoves ?? [])
  const [genAt, setGenAt] = useState<string | null>(generatedAt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProState, setIsProState] = useState(isPro)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const autoTriggered = useRef(false)

  // Re-check Pro status client-side
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => setIsProState(data?.status === 'active' || data?.status === 'trialing'))
    })
  }, [])

  // Auto-generate when Pro and no cached moves
  useEffect(() => {
    if (isProState && moves.length === 0 && hasStrategyReport && !loading && !autoTriggered.current) {
      autoTriggered.current = true
      handleGenerate(false)
    }
  }, [isProState, moves, hasStrategyReport, loading])

  const handleGenerate = async (force = true) => {
    setLoading(true)
    setError(null)
    setConfirmRegen(false)
    try {
      const res = await fetch('/api/career-moves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force }) })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? `Error ${res.status}`); return }
      if (data.moves?.length > 0) { setMoves(data.moves); setGenAt(new Date().toISOString()) }
      else setError(data.message ?? data.error ?? 'No moves returned.')
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (move_id: string, completed: boolean) => {
    // Optimistic update
    setMoves(prev => prev.map(m => m.id === move_id ? { ...m, completed } : m))
    // Persist
    await fetch('/api/career-moves/complete', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move_id, completed }),
    })
  }

  const doneCount = moves.filter(m => m.completed).length
  const allDone = moves.length > 0 && doneCount === moves.length
  const visibleMoves = isProState ? moves : moves.slice(0, 1)
  const lockedMoves  = isProState ? [] : moves.slice(1)

  if (!hasStrategyReport) {
    return (
      <div className="max-w-2xl space-y-6">
        <div><h1 className="text-2xl font-bold text-navy">Career Moves</h1><p className="text-mid mt-1 text-sm">Your 4 personalized actions to strengthen your petition</p></div>
        <div className="card border-2 border-dashed border-teal/20 text-center py-12">
          <p className="font-bold text-navy text-lg">Run a strategy report first</p>
          <p className="text-mid text-sm mt-2 mb-5 max-w-xs mx-auto">Your moves are generated from your actual criteria scores — not templates.</p>
          <Link href="/strategy" className="btn-teal">Get my green card strategy →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {moves.length > 0 && <CompletionRing done={doneCount} total={moves.length} />}
          <div>
            <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
            <p className="text-mid text-sm mt-0.5">
              {moves.length > 0
                ? doneCount === moves.length
                  ? '🎉 All done! Ready to generate a fresh set.'
                  : `${doneCount} of ${moves.length} completed`
                : 'Your personalized 90-day campaign'}
            </p>
          </div>
        </div>

        {isProState && moves.length > 0 && (
          <button onClick={() => setConfirmRegen(true)} disabled={loading}
            className="text-xs text-mid border border-border rounded-xl px-4 py-2 hover:border-navy hover:text-navy transition-colors flex-shrink-0">
            Generate new moves
          </button>
        )}
      </div>

      {/* Confirm regen modal */}
      {confirmRegen && (
        <div className="card border-2 border-orange-200 bg-orange-50 space-y-3">
          <p className="font-semibold text-navy text-sm">Generate fresh moves?</p>
          <p className="text-sm text-mid">Your current progress ({doneCount} completed) will be cleared. This will take ~15 seconds.</p>
          <div className="flex gap-3">
            <button onClick={() => handleGenerate(true)} className="btn-teal text-xs py-2 px-4">Yes, generate new</button>
            <button onClick={() => setConfirmRegen(false)} className="text-sm text-mid hover:text-navy">Cancel</button>
          </div>
        </div>
      )}

      {/* Score strip */}
      {greenCardScore && (
        <div className="card py-3 px-4 flex items-center gap-3 flex-wrap text-sm">
          <span className="text-xl font-black text-teal">{greenCardScore.overall}</span>
          <span className="text-xs text-mid">/100</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${greenCardScore.label === 'Exceptional' || greenCardScore.label === 'Strong' ? 'bg-teal/10 text-teal' : 'bg-yellow-50 text-yellow-700'}`}>{greenCardScore.label}</span>
          <span className="text-mid text-xs">· Best pathway: <span className="font-semibold text-navy">{greenCardScore.bestPathway}</span></span>
          {niwScore !== null && <><span className="text-mid text-xs">· NIW <span className="font-semibold text-navy">{niwScore}</span></span><span className="text-mid text-xs">EB-1A <span className="font-semibold text-navy">{eb1aScore}</span></span></>}
          {reportId && <Link href={`/strategy/report/${reportId}`} className="text-xs text-teal font-semibold hover:underline ml-auto">View report →</Link>}
        </div>
      )}

      {/* Generated at */}
      {genAt && moves.length > 0 && (
        <p className="text-xs text-mid">Generated {new Date(genAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      )}

      {/* Loading */}
      {loading && <LoadingSkeleton />}

      {/* No moves */}
      {!loading && moves.length === 0 && (
        <div className="card border-2 border-dashed text-center py-10">
          <p className="font-semibold text-navy">Ready to generate your moves</p>
          <p className="text-sm text-mid mt-1 mb-5">~15 seconds. Fully personalized to your criteria gaps.</p>
          <button onClick={() => handleGenerate(true)} className="btn-teal">Generate my career moves →</button>
          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        </div>
      )}

      {/* All done celebration */}
      {allDone && !loading && (
        <div className="card bg-teal/5 border border-teal/20 text-center py-6 space-y-2">
          <p className="text-2xl">🎉</p>
          <p className="font-bold text-navy">You completed all 4 moves!</p>
          <p className="text-sm text-mid">Ready to generate a fresh set based on your new standing?</p>
          <button onClick={() => handleGenerate(true)} className="btn-teal mt-2">Generate next set →</button>
        </div>
      )}

      {/* Moves list */}
      {!loading && moves.length > 0 && (
        <div className="space-y-4">
          {visibleMoves.map((move, i) => (
            <MoveCard key={move.id} move={move} index={i} onToggleComplete={handleToggleComplete} />
          ))}

          {!isProState && lockedMoves.length > 0 && (
            <>
              <div className="rounded-2xl bg-navy text-white p-6 text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-teal/25 text-teal border border-teal/30">✦ PRO</span>
                <p className="font-bold text-lg">Unlock your full 90-day campaign</p>
                <p className="text-blue-200 text-sm max-w-sm mx-auto">See your remaining {lockedMoves.length} moves with action plans, evidence checklists, and 30-day milestones.</p>
                <Link href="/subscribe" className="inline-block bg-teal text-white font-bold py-3 px-8 rounded-xl hover:bg-teal/90 transition-colors">Go Pro — $29/month</Link>
              </div>
              {lockedMoves.map((move, i) => (
                <MoveCard key={move.id} move={move} locked index={visibleMoves.length + i} />
              ))}
            </>
          )}
        </div>
      )}

      {error && !loading && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

      <div className="flex items-center gap-4 pt-2 text-sm">
        <Link href="/dashboard" className="text-mid hover:text-navy transition-colors">← Dashboard</Link>
        <Link href="/strategy" className="text-mid hover:text-navy transition-colors">Strategy report →</Link>
      </div>
    </div>
  )
}
