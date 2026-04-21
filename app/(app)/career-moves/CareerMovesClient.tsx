'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { GreenCardScore } from '@/lib/scoring'
import type { MoveSet, TrackedMove } from './page'
import type { MoveStatus } from '@/app/api/career-moves/update/route'

// ── Status config ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<MoveStatus, { label: string; short: string; color: string; bg: string; border: string; dot: string }> = {
  not_started: { label: 'To Do',       short: 'To Do',      color: 'text-mid',       bg: 'bg-gray-100',      border: 'border-gray-200',  dot: 'bg-gray-400'  },
  in_progress:  { label: 'In Progress', short: 'In Progress', color: 'text-blue-600',  bg: 'bg-blue-50',       border: 'border-blue-200',  dot: 'bg-blue-500'  },
  done:         { label: 'Done',        short: 'Done',        color: 'text-teal',      bg: 'bg-teal/10',       border: 'border-teal/30',   dot: 'bg-teal'      },
  skipped:      { label: 'Skipped',     short: 'Skipped',     color: 'text-orange-500',bg: 'bg-orange-50',     border: 'border-orange-200',dot: 'bg-orange-400'},
}

const TAG_STYLE: Record<string, string> = {
  'Quick Win':     'bg-teal/10 text-teal border-teal/25',
  'High Leverage': 'bg-purple-50 text-purple-700 border-purple-200',
  'Long Game':     'bg-orange-50 text-orange-600 border-orange-200',
  'Foundation':    'bg-blue-50 text-blue-600 border-blue-200',
}

// ── Status selector ───────────────────────────────────────────────

function StatusSelector({ status, onChange }: { status: MoveStatus; onChange: (s: MoveStatus) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[status]
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${cfg.bg} ${cfg.color} ${cfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.short}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-border shadow-lg z-20 overflow-hidden">
          {(Object.entries(STATUS_CONFIG) as [MoveStatus, typeof STATUS_CONFIG[MoveStatus]][]).map(([key, c]) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors ${key === status ? c.color : 'text-navy'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
              {c.label}
              {key === status && (
                <svg className="w-3 h-3 ml-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notes field ───────────────────────────────────────────────────

function NotesField({ moveId, setId, initialNotes, onSave }: {
  moveId: string
  setId: string
  initialNotes: string
  onSave: (notes: string) => void
}) {
  const [value, setValue] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (notes: string) => {
    setSaving(true)
    await fetch('/api/career-moves/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move_id: moveId, set_id: setId, notes }),
    })
    onSave(notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [moveId, setId, onSave])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(v), 1000)
  }

  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-mid uppercase tracking-widest">Your notes</label>
        {saving && <span className="text-[10px] text-mid">Saving…</span>}
        {saved && !saving && <span className="text-[10px] text-teal font-semibold">Saved ✓</span>}
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="What did you do? What's blocking you? Why did you skip? This will inform your next score update."
        rows={3}
        className="w-full text-sm text-navy bg-gray-50 border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal/50 placeholder:text-gray-400 transition-colors"
      />
    </div>
  )
}

// ── Move tracker card ─────────────────────────────────────────────

function MoveTrackerCard({ move, setId, locked, readonly, onStatusChange, onNotesChange }: {
  move: TrackedMove
  setId: string
  locked?: boolean
  readonly?: boolean
  onStatusChange?: (id: string, status: MoveStatus) => void
  onNotesChange?: (id: string, notes: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status: MoveStatus = move.status ?? (move.completed ? 'done' : 'not_started')
  const cfg = STATUS_CONFIG[status]

  return (
    <div className={`relative rounded-2xl border transition-all ${
      locked ? 'border-gray-200 bg-gray-50/60 select-none' :
      status === 'done' ? 'border-teal/25 bg-teal/[0.02]' :
      status === 'skipped' ? 'border-gray-200 bg-gray-50/50' :
      'border-border bg-white shadow-sm'
    }`}>

      {/* Lock overlay */}
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
        {/* Header: tags + status */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {move.tag && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${TAG_STYLE[move.tag] ?? TAG_STYLE.Foundation}`}>
                {move.tag}
              </span>
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              move.impact === 'High' ? 'bg-teal/10 text-teal border-teal/25' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {move.impact === 'High' ? '↑ High' : '→ Med'} impact
            </span>
            <span className="text-[11px] text-mid">{move.effort} effort · {move.timeframe}</span>
          </div>

          {/* Status selector / readonly badge */}
          {readonly ? (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.label}
            </span>
          ) : !locked && onStatusChange ? (
            <StatusSelector
              status={status}
              onChange={(s) => onStatusChange(move.id, s)}
            />
          ) : null}
        </div>

        {/* Title + criterion */}
        <h3 className={`text-base font-bold leading-snug ${status === 'done' || status === 'skipped' ? 'text-mid' : 'text-navy'} ${status === 'done' ? 'line-through' : ''}`}>
          {move.title}
        </h3>
        <p className="text-xs font-semibold text-teal mt-1">{move.criterion}</p>
        <p className="text-sm text-mid mt-2 leading-relaxed">{move.why}</p>
        {move.score_impact && (
          <p className="text-xs font-bold text-teal mt-2">▲ {move.score_impact}</p>
        )}

        {/* Action plan expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          disabled={!!locked}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-teal transition-colors"
        >
          <span className={`transition-transform duration-200 text-mid ${expanded ? 'rotate-180' : ''}`}>▾</span>
          {expanded ? 'Hide action plan' : 'View action plan'}
        </button>

        {expanded && (
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
                  {move.evidence.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-navy/80">
                      <span className="text-teal mt-0.5 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes field — only on active, non-locked, non-readonly moves */}
        {!locked && !readonly && onNotesChange && (
          <NotesField
            moveId={move.id}
            setId={setId}
            initialNotes={move.notes ?? ''}
            onSave={(notes) => onNotesChange(move.id, notes)}
          />
        )}

        {/* Read-only notes display */}
        {readonly && move.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[11px] font-black text-mid uppercase tracking-widest mb-1.5">Your notes</p>
            <p className="text-sm text-navy/70 italic">{move.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────

function ProgressBar({ moves }: { moves: TrackedMove[] }) {
  const total = moves.length
  const done = moves.filter(m => (m.status ?? (m.completed ? 'done' : 'not_started')) === 'done').length
  const inProgress = moves.filter(m => m.status === 'in_progress').length
  const skipped = moves.filter(m => m.status === 'skipped').length
  const notStarted = total - done - inProgress - skipped

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-mid">
        <span className="font-semibold text-navy">{done} of {total} done</span>
        <div className="flex items-center gap-3">
          {inProgress > 0 && <span className="text-blue-600 font-semibold">{inProgress} in progress</span>}
          {skipped > 0 && <span className="text-orange-500">{skipped} skipped</span>}
          {notStarted > 0 && <span>{notStarted} to do</span>}
        </div>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {done > 0 && <div className="bg-teal rounded-full transition-all" style={{ flex: done }} />}
        {inProgress > 0 && <div className="bg-blue-400 rounded-full transition-all" style={{ flex: inProgress }} />}
        {skipped > 0 && <div className="bg-orange-300 rounded-full transition-all" style={{ flex: skipped }} />}
        {notStarted > 0 && <div className="bg-gray-200 rounded-full transition-all" style={{ flex: notStarted }} />}
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
        <div className="flex gap-1.5">{[0,1,2].map(j => <span key={j} className="w-2 h-2 rounded-full bg-teal" style={{ animation: `cmBounce 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}</div>
        <p className="text-sm text-teal font-medium">{PHRASES[i]}</p>
      </div>
      {[0,1,2,3].map(j => (
        <div key={j} className="card border overflow-hidden relative min-h-[120px]">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: 'cmShimmer 1.6s infinite' }} />
          <div className="space-y-3 p-5">
            <div className="flex justify-between">
              <div className="flex gap-2"><div className="h-5 w-20 bg-gray-100 rounded-full"/><div className="h-5 w-16 bg-gray-100 rounded-full"/></div>
              <div className="h-6 w-24 bg-gray-100 rounded-full"/>
            </div>
            <div className="h-5 bg-gray-100 rounded w-3/4"/>
            <div className="h-3 bg-gray-100 rounded w-full"/>
            <div className="h-3 bg-gray-100 rounded w-5/6"/>
            <div className="h-16 bg-gray-50 rounded-xl border border-gray-100"/>
          </div>
        </div>
      ))}
      <style>{`@keyframes cmBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}@keyframes cmShimmer{100%{transform:translateX(300%)}}`}</style>
    </div>
  )
}

// ── Past set panel ────────────────────────────────────────────────

function PastSetPanel({ set }: { set: MoveSet }) {
  const [expanded, setExpanded] = useState(false)
  const done = set.moves.filter(m => (m.status ?? (m.completed ? 'done' : 'not_started')) === 'done').length
  const total = set.moves.length

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-navy">
            Set from {new Date(set.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs text-mid mt-0.5">{done}/{total} completed</p>
        </div>
        <svg className={`w-4 h-4 text-mid flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4 bg-gray-50/40">
          {set.moves.map(move => (
            <MoveTrackerCard key={move.id} move={move} setId={set.id} readonly />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────

interface Props {
  currentSet: MoveSet | null
  pastSets: MoveSet[]
  isPro: boolean
  hasStrategyReport: boolean
  greenCardScore: GreenCardScore | null
  niwScore: number | null
  eb1aScore: number | null
  reportId: string | null
  fieldOfWork: string | null
}

// ── Main ──────────────────────────────────────────────────────────

export default function CareerMovesClient({
  currentSet: initialCurrentSet,
  pastSets: initialPastSets,
  isPro,
  hasStrategyReport,
  greenCardScore,
  niwScore,
  eb1aScore,
  reportId,
}: Props) {
  const [currentSet, setCurrentSet] = useState<MoveSet | null>(initialCurrentSet)
  const [pastSets, setPastSets] = useState<MoveSet[]>(initialPastSets)
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

  // Auto-generate if Pro + has report + no moves yet
  useEffect(() => {
    if (isProState && !currentSet && hasStrategyReport && !loading && !autoTriggered.current) {
      autoTriggered.current = true
      handleGenerate(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProState, currentSet, hasStrategyReport, loading])

  const handleGenerate = async (force = true) => {
    setLoading(true)
    setError(null)
    setConfirmRegen(false)

    // Optimistically archive current set
    if (force && currentSet) {
      setPastSets(prev => [currentSet, ...prev])
      setCurrentSet(null)
    }

    try {
      const res = await fetch('/api/career-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? `Error ${res.status}`); return }
      if (data.moves?.length > 0) {
        setCurrentSet({
          id: data.setId ?? 'pending',
          generated_at: new Date().toISOString(),
          moves: data.moves,
          is_current: true,
        })
      } else {
        setError(data.message ?? data.error ?? 'No moves returned.')
      }
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (moveId: string, status: MoveStatus) => {
    if (!currentSet) return
    // Optimistic update
    setCurrentSet(prev => prev ? {
      ...prev,
      moves: prev.moves.map(m => m.id === moveId ? { ...m, status, completed: status === 'done' } : m),
    } : null)
    // Persist
    await fetch('/api/career-moves/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move_id: moveId, set_id: currentSet.id, status }),
    })
  }

  const handleNotesChange = (moveId: string, notes: string) => {
    if (!currentSet) return
    setCurrentSet(prev => prev ? {
      ...prev,
      moves: prev.moves.map(m => m.id === moveId ? { ...m, notes } : m),
    } : null)
  }

  const moves = currentSet?.moves ?? []
  const visibleMoves = moves
  const lockedMoves: TrackedMove[] = []
  const allDone = moves.length > 0 && moves.every(m => (m.status ?? (m.completed ? 'done' : 'not_started')) === 'done')

  // ── No strategy report ──────────────────────────────────────────
  if (!hasStrategyReport) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
          <p className="text-mid mt-1 text-sm">Personalized actions to strengthen your petition</p>
        </div>
        <div className="card border-2 border-dashed border-teal/20 text-center py-12">
          <p className="font-bold text-navy text-lg">Run a strategy report first</p>
          <p className="text-mid text-sm mt-2 mb-5 max-w-xs mx-auto">Your moves are generated from your actual criteria scores — not templates.</p>
          <Link href="/strategy" className="btn-teal">Get my green card strategy →</Link>
        </div>
      </div>
    )
  }

  // ── Not Pro — show paywall ───────────────────────────────────────
  if (!isProState) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
          <p className="text-mid mt-1 text-sm">Personalized actions to strengthen your petition</p>
        </div>

        <div className="card bg-navy text-white text-center space-y-4 py-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-teal/25 text-teal border border-teal/30">✦ PRO</span>
          <p className="text-2xl font-bold">Unlock your 4 career moves</p>
          <p className="text-blue-200 text-sm max-w-sm mx-auto leading-relaxed">
            AI-generated, hyper-specific actions tied to your weakest EB-1A criteria or NIW prongs. Not generic advice — personalized to your profile.
          </p>
          <div className="text-left max-w-xs mx-auto space-y-2.5 pt-2">
            {[
              'All 4 moves with full action plans',
              'Notes field to track what you did',
              'Status tracker per move',
              'Living Green Card Score',
              'Score history over time',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-100">
                <span className="text-teal font-bold">✓</span> {f}
              </div>
            ))}
          </div>
          <div className="pt-2">
            <p className="text-3xl font-bold">$49<span className="text-base font-normal text-blue-300">/month</span></p>
            <p className="text-blue-300 text-xs mt-0.5">or $399/year — save $189</p>
          </div>
          <Link href="/subscribe" className="inline-block bg-teal text-white font-bold py-3 px-10 rounded-xl hover:bg-teal/90 transition-colors">
            Go Pro to unlock →
          </Link>
          <p className="text-blue-400 text-xs">Cancel anytime · Secured by Stripe</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Career Moves</h1>
          <p className="text-mid text-sm mt-0.5">Track every action toward your green card — nothing gets lost.</p>
        </div>
        {isProState && currentSet && (
          <button
            onClick={() => setConfirmRegen(true)}
            disabled={loading}
            className="text-xs text-mid border border-border rounded-xl px-4 py-2 hover:border-navy hover:text-navy transition-colors flex-shrink-0"
          >
            Generate new set
          </button>
        )}
      </div>

      {/* ── Confirm regen ────────────────────────────────────────── */}
      {confirmRegen && (
        <div className="card border-2 border-orange-200 bg-orange-50 space-y-3">
          <p className="font-semibold text-navy text-sm">Generate a fresh set of moves?</p>
          <p className="text-sm text-mid">Your current set will be archived below — your notes and progress are saved forever.</p>
          <div className="flex gap-3">
            <button onClick={() => handleGenerate(true)} className="btn-teal text-xs py-2 px-4">Yes, generate new</button>
            <button onClick={() => setConfirmRegen(false)} className="text-sm text-mid hover:text-navy">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Score strip ──────────────────────────────────────────── */}
      {greenCardScore && (
        <div className="card py-3 px-4 flex items-center gap-3 flex-wrap text-sm">
          <span className="text-xl font-black text-teal">{greenCardScore.overall}</span>
          <span className="text-xs text-mid">/100</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            greenCardScore.label === 'Exceptional' || greenCardScore.label === 'Strong'
              ? 'bg-teal/10 text-teal' : 'bg-yellow-50 text-yellow-700'
          }`}>{greenCardScore.label}</span>
          <span className="text-mid text-xs">· Best pathway: <span className="font-semibold text-navy">{greenCardScore.bestPathway}</span></span>
          {niwScore !== null && (
            <><span className="text-mid text-xs">· NIW <span className="font-semibold text-navy">{niwScore}</span></span>
            <span className="text-mid text-xs">EB-1A <span className="font-semibold text-navy">{eb1aScore}</span></span></>
          )}
          {reportId && (
            <Link href={`/strategy/report/${reportId}`} className="text-xs text-teal font-semibold hover:underline ml-auto">
              View report →
            </Link>
          )}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ── No moves yet ─────────────────────────────────────────── */}
      {!loading && !currentSet && (
        <div className="card border-2 border-dashed text-center py-12">
          <p className="font-semibold text-navy text-lg">No moves generated yet</p>
          <p className="text-sm text-mid mt-2 mb-6 max-w-xs mx-auto">
            {isProState
              ? 'Generate your personalized 90-day campaign — takes about 15 seconds.'
              : 'Upgrade to Pro to get your personalized career moves.'}
          </p>
          {isProState ? (
            <button onClick={() => handleGenerate(false)} className="btn-teal">Generate my career moves →</button>
          ) : (
            <Link href="/subscribe" className="btn-teal">Go Pro to unlock →</Link>
          )}
          {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        </div>
      )}

      {/* ── Current moves ─────────────────────────────────────────── */}
      {!loading && currentSet && moves.length > 0 && (
        <div className="space-y-5">

          {/* Progress bar */}
          <div className="card py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-navy uppercase tracking-widest">Your progress</p>
              <p className="text-xs text-mid">
                Generated {new Date(currentSet.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <ProgressBar moves={moves} />
          </div>

          {/* All done celebration */}
          {allDone && (
            <div className="card bg-teal/5 border border-teal/20 text-center py-6 space-y-2">
              <p className="text-2xl">🎉</p>
              <p className="font-bold text-navy">You completed all moves in this set!</p>
              <p className="text-sm text-mid">Generate a fresh set to keep momentum — your scores will be higher now.</p>
              <button onClick={() => handleGenerate(true)} className="btn-teal mt-2">Generate next set →</button>
            </div>
          )}

          {/* Move cards */}
          <div className="space-y-4">
            {visibleMoves.map(move => (
              <MoveTrackerCard
                key={move.id}
                move={move}
                setId={currentSet.id}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
              />
            ))}

          </div>
        </div>
      )}

      {error && !loading && currentSet && (
        <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
      )}

      {/* ── Past sets ─────────────────────────────────────────────── */}
      {pastSets.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black text-navy uppercase tracking-widest">Previous sets</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-mid">{pastSets.length} archived</span>
          </div>
          <div className="space-y-2">
            {pastSets.map(set => <PastSetPanel key={set.id} set={set} />)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 text-sm">
        <Link href="/dashboard" className="text-mid hover:text-navy transition-colors">← Dashboard</Link>
        <Link href="/strategy" className="text-mid hover:text-navy transition-colors">Strategy report →</Link>
      </div>
    </div>
  )
}
