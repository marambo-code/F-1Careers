'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTemplateForPathway,
  computeRunwayDays,
  getGroupedItems,
  APPROVAL_SIGNALS,
  SERVICE_CENTERS,
  type EvidenceItem,
  type EvidenceStatus,
  type Pathway,
} from '@/lib/data/petition-evidence'

// ── Types ────────────────────────────────────────────────────────────────────

interface NarrativeFeedback {
  overall: string
  score: number
  issues: { severity: 'critical' | 'moderate' | 'minor'; quote: string; problem: string; fix: string }[]
  strengths: string[]
  next_step: string
}

type Tab = 'evidence' | 'narrative' | 'signal' | 'letters' | 'generate'

// ── Recommender types ────────────────────────────────────────────────────────

type RelationshipType = 'independent_expert' | 'collaborator' | 'supervisor' | 'employer'

interface Recommender {
  id: string
  name: string
  title: string
  institution: string
  relationship: RelationshipType
  briefing?: string
  briefing_generated_at?: string
}

interface PetitionPackage {
  personal_statement: string
  cover_letter: string
  generated_at: string
  pathway: string
  word_count: number
}

// ── Runway counter ───────────────────────────────────────────────────────────

function RunwayCounter({ days, total }: { days: number; total: number }) {
  const pct = total > 0 ? Math.round(((total - days) / total) * 100) : 0
  const color = pct >= 80 ? 'text-teal' : pct >= 50 ? 'text-yellow-500' : 'text-orange-500'
  const barColor = pct >= 80 ? 'bg-teal' : pct >= 50 ? 'bg-yellow-400' : 'bg-orange-400'

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="h-1.5 bg-navy-light">
        <div className={`h-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="p-5 flex items-center gap-6">
        <div className="flex-1">
          <p className="text-xs text-mid font-medium uppercase tracking-wide mb-0.5">Runway to Filing</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${color}`}>{days}</span>
            <span className="text-mid text-sm">days estimated</span>
          </div>
          <p className="text-xs text-mid mt-1">
            {days === 0
              ? '🎉 Your evidence package looks filing-ready'
              : `Complete the items below to reduce your runway. ${pct}% of evidence collected.`}
          </p>
        </div>
        <div className="flex-shrink-0 text-right hidden sm:block">
          <div className="text-3xl font-bold text-navy">{pct}%</div>
          <div className="text-xs text-mid">complete</div>
        </div>
      </div>
    </div>
  )
}

// ── Evidence track ───────────────────────────────────────────────────────────

function EvidenceTrack({
  items,
  onToggle,
  onNote,
}: {
  items: EvidenceItem[]
  onToggle: (id: string, status: EvidenceStatus) => void
  onNote: (id: string, notes: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const grouped = getGroupedItems(items)

  const doneCount = items.filter(i => i.status === 'done').length
  const inProgressCount = items.filter(i => i.status === 'in_progress').length

  return (
    <div className="space-y-6">
      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-teal/10 text-teal border border-teal/20">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          {doneCount} done
        </span>
        {inProgressCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            ◑ {inProgressCount} in progress
          </span>
        )}
        <span className="text-xs text-mid">{items.length - doneCount - inProgressCount} remaining</span>
      </div>

      {Object.entries(grouped).map(([group, groupItems]) => {
        const groupDone = groupItems.filter(i => i.status === 'done').length
        return (
          <div key={group} className="card !p-0 overflow-hidden">
            {/* Group header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-navy uppercase tracking-wide">{group}</h3>
              </div>
              <span className="text-xs text-mid font-medium">{groupDone}/{groupItems.length}</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {groupItems.map(item => {
                const isExpanded = expandedId === item.id
                const isEditingNote = editingNoteId === item.id

                return (
                  <div key={item.id} className={`transition-colors ${item.status === 'done' ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <div className="px-5 py-3.5 flex items-start gap-3">
                      {/* Status toggle */}
                      <button
                        onClick={() => {
                          const next: EvidenceStatus = item.status === 'todo' ? 'in_progress' : item.status === 'in_progress' ? 'done' : 'todo'
                          onToggle(item.id, next)
                        }}
                        className="flex-shrink-0 mt-0.5"
                        title="Click to cycle: Todo → In Progress → Done"
                      >
                        {item.status === 'done' ? (
                          <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : item.status === 'in_progress' ? (
                          <div className="w-5 h-5 rounded-full border-2 border-yellow-400 bg-yellow-50 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-teal transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-snug ${item.status === 'done' ? 'text-mid line-through' : 'text-navy'}`}>
                            {item.label}
                          </p>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-mid hover:text-navy flex-shrink-0 text-xs mt-0.5"
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>

                        {item.notes && !isExpanded && (
                          <p className="text-xs text-mid mt-1 truncate">{item.notes}</p>
                        )}

                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            <p className="text-xs text-mid leading-relaxed">{item.description}</p>
                            <p className="text-xs text-mid">
                              <span className="font-medium text-navy">Est. time:</span> {item.estimated_days} days
                            </p>

                            {/* Notes */}
                            {isEditingNote ? (
                              <div className="space-y-2">
                                <textarea
                                  className="input text-xs resize-none h-16"
                                  placeholder="Add notes, links, or reminders…"
                                  defaultValue={item.notes}
                                  onBlur={e => {
                                    onNote(item.id, e.target.value)
                                    setEditingNoteId(null)
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingNoteId(item.id)}
                                className="text-xs text-teal hover:underline"
                              >
                                {item.notes ? 'Edit note' : '+ Add note'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Narrative track ──────────────────────────────────────────────────────────

function NarrativeTrack({
  narrative,
  pathway,
  onChange,
}: {
  narrative: string
  pathway: Pathway
  onChange: (text: string) => void
}) {
  const [feedback, setFeedback] = useState<NarrativeFeedback | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const analyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/petition-builder/narrative-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative, pathway }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Analysis failed')
      setFeedback(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const severityConfig = {
    critical: { color: 'text-red-700 bg-red-50 border-red-200', label: 'Critical' },
    moderate: { color: 'text-orange-700 bg-orange-50 border-orange-200', label: 'Moderate' },
    minor: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', label: 'Minor' },
  }

  const scoreColor = feedback
    ? feedback.score >= 75 ? 'text-teal' : feedback.score >= 50 ? 'text-yellow-500' : 'text-red-500'
    : 'text-mid'

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="rounded-xl border border-navy/10 bg-navy/3 p-4">
        <p className="text-xs font-bold text-navy mb-1">What to write here</p>
        <p className="text-xs text-mid leading-relaxed">
          Write 2–4 sentences describing the specific work you will pursue after your green card is approved.
          This is your <span className="font-semibold text-navy">proposed endeavor</span>, the single most important phrase in your petition.
          Every document you file must use this exact language. The AI will review it the way a USCIS adjudicator would.
        </p>
      </div>

      {/* Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Proposed Endeavor Statement</label>
          <span className="text-xs text-mid">{narrative.length} chars</span>
        </div>
        <textarea
          className="input resize-none h-40 text-sm leading-relaxed font-medium"
          placeholder={pathway === 'NIW'
            ? 'Example: I propose to advance the development of energy-efficient machine learning inference systems that reduce the carbon footprint of large-scale AI deployments in the United States, directly supporting federal clean energy and AI competitiveness priorities…'
            : 'Example: I have demonstrated extraordinary ability in computational biology through internationally recognized research contributions that have been adopted by leading pharmaceutical companies in their drug discovery pipelines…'
          }
          value={narrative}
          onChange={e => onChange(e.target.value)}
        />
      </div>

      {/* Analyze button */}
      <div className="flex items-center gap-4">
        <button
          onClick={analyze}
          disabled={analyzing || narrative.trim().length < 50}
          className="btn-primary"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing…
            </span>
          ) : 'Run Adversarial Review'}
        </button>
        {narrative.trim().length < 50 && (
          <p className="text-xs text-mid">Write at least 50 characters to analyze</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Feedback panel */}
      {feedback && (
        <div className="space-y-4">
          {/* Score */}
          <div className="card flex items-center gap-5">
            <div className="text-center flex-shrink-0">
              <div className={`text-4xl font-bold ${scoreColor}`}>{feedback.score}</div>
              <div className="text-[10px] text-mid font-medium uppercase tracking-wide">/ 100</div>
            </div>
            <div>
              <p className="text-sm font-bold text-navy">{feedback.overall}</p>
              <p className="text-xs text-mid mt-1 leading-relaxed">{feedback.next_step}</p>
            </div>
          </div>

          {/* Issues */}
          {feedback.issues.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-navy uppercase tracking-wide">
                {feedback.issues.length} issue{feedback.issues.length !== 1 ? 's' : ''} found
              </p>
              {feedback.issues.map((issue, i) => {
                const cfg = severityConfig[issue.severity]
                return (
                  <div key={i} className={`rounded-xl border p-4 space-y-2 ${cfg.color}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {issue.quote && (
                      <blockquote className="text-xs italic border-l-2 border-current pl-3 opacity-80">
                        "{issue.quote}"
                      </blockquote>
                    )}
                    <p className="text-xs font-medium">{issue.problem}</p>
                    <div className="rounded-lg bg-white/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide mb-1 opacity-70">Suggested fix</p>
                      <p className="text-xs leading-relaxed">{issue.fix}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div className="card !p-4 space-y-2">
              <p className="text-xs font-bold text-navy uppercase tracking-wide">What's working</p>
              {feedback.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-mid">
                  <svg className="w-3.5 h-3.5 text-teal flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Signal track ─────────────────────────────────────────────────────────────

function SignalTrack({
  pathway,
  serviceCenter,
  onServiceCenterChange,
}: {
  pathway: Pathway
  serviceCenter: string
  onServiceCenterChange: (code: string) => void
}) {
  const signals = APPROVAL_SIGNALS[pathway]
  const currentSC = SERVICE_CENTERS.find(sc => sc.code === serviceCenter)

  const trendIcon = (trend: string) =>
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  const rateColor = (rate: number) =>
    rate >= 70 ? 'text-teal' : rate >= 50 ? 'text-yellow-500' : 'text-red-500'

  const filingClimate = signals.overall.rate >= 65
    ? { label: 'Favorable', color: 'bg-teal/10 text-teal border-teal/20', icon: '🟢' }
    : signals.overall.rate >= 45
    ? { label: 'Proceed with care', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '🟡' }
    : { label: 'High scrutiny period', color: 'bg-red-50 text-red-700 border-red-200', icon: '🔴' }

  return (
    <div className="space-y-5">
      {/* Climate banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${filingClimate.color}`}>
        <span className="text-lg">{filingClimate.icon}</span>
        <div>
          <p className="text-sm font-bold">Filing climate: {filingClimate.label}</p>
          <p className="text-xs opacity-80 mt-0.5">
            {pathway} overall approval rate is currently {signals.overall.rate}%, {signals.overall.trend === 'down' ? 'down from recent highs' : signals.overall.trend === 'up' ? 'trending upward' : 'holding steady'}.
          </p>
        </div>
      </div>

      {/* Approval rates */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-sm font-bold text-navy">Current Approval Rates</h3>
          <span className="text-[10px] text-mid">Updated {signals.lastUpdated}</span>
        </div>

        {[signals.overall, signals.stem, signals.entrepreneur].map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-navy">{s.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-navy-light overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.rate >= 70 ? 'bg-teal' : s.rate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${s.rate}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-12 text-right ${rateColor(s.rate)}`}>
                {s.rate}% {trendIcon(s.trend)}
              </span>
            </div>
          </div>
        ))}

        <p className="text-[10px] text-mid pt-1 border-t border-gray-100">
          Source: {signals.source}. Rates reflect I-140 adjudications and may fluctuate quarterly.
        </p>
      </div>

      {/* Service center */}
      <div className="card space-y-4">
        <div className="pb-2 border-b border-gray-100">
          <h3 className="text-sm font-bold text-navy">Your Service Center</h3>
          <p className="text-xs text-mid mt-0.5">Determines processing time and RFE likelihood. Set by USCIS based on your state.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICE_CENTERS.map(sc => (
            <button
              key={sc.code}
              onClick={() => onServiceCenterChange(sc.code)}
              className={`text-left p-3 rounded-xl border text-xs transition-colors ${
                serviceCenter === sc.code
                  ? 'border-teal bg-teal/6 text-navy'
                  : 'border-gray-200 hover:border-gray-300 text-mid'
              }`}
            >
              <p className="font-bold text-navy">{sc.code}</p>
              <p className="text-[11px] mt-0.5 leading-tight">{sc.name}</p>
              <p className={`text-[10px] mt-1 ${sc.code === 'TSC' ? 'text-orange-600' : 'text-mid'}`}>{sc.note}</p>
            </button>
          ))}
        </div>

        {currentSC?.code === 'TSC' && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs font-semibold text-orange-800">⚠️ Texas Service Center caution</p>
            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
              TSC issued the highest RFE rate among service centers in 2025. If you have a choice, consider premium processing to get a faster, more consistent adjudication.
            </p>
          </div>
        )}
      </div>

      {/* What to do with this */}
      <div className="card !p-4 space-y-2">
        <p className="text-xs font-bold text-navy">How to use this data</p>
        <p className="text-xs text-mid leading-relaxed">
          Approval rates fluctuate quarterly. A drop below 50% overall is a signal to wait until your evidence is stronger, marginal cases get denied faster in high-scrutiny periods. Strong cases (score 80+) can file in any climate.
        </p>
      </div>
    </div>
  )
}

// ── Letters track ────────────────────────────────────────────────────────────

const RELATIONSHIP_LABELS: Record<RelationshipType, { label: string; weight: string; color: string }> = {
  independent_expert: { label: 'Independent Expert', weight: 'Highest weight', color: 'text-teal bg-teal/8 border-teal/20' },
  collaborator:       { label: 'Collaborator',       weight: 'High weight',    color: 'text-blue-700 bg-blue-50 border-blue-200' },
  supervisor:         { label: 'Supervisor / Advisor', weight: 'High weight',  color: 'text-purple-700 bg-purple-50 border-purple-200' },
  employer:           { label: 'Employer',            weight: 'Medium weight', color: 'text-gray-700 bg-gray-50 border-gray-200' },
}

function LettersTrack({
  recommenders,
  pathway,
  narrative,
  onUpdate,
}: {
  recommenders: Recommender[]
  pathway: Pathway
  narrative: string
  onUpdate: (r: Recommender[]) => void
}) {
  const [adding, setAdding] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    title: '',
    institution: '',
    relationship: 'independent_expert' as RelationshipType,
  })

  const addRecommender = () => {
    if (!form.name.trim()) return
    const newRec: Recommender = {
      id: `rec_${Date.now()}`,
      name: form.name.trim(),
      title: form.title.trim(),
      institution: form.institution.trim(),
      relationship: form.relationship,
    }
    const updated = [...recommenders, newRec]
    onUpdate(updated)
    setForm({ name: '', title: '', institution: '', relationship: 'independent_expert' })
    setAdding(false)
  }

  const removeRecommender = (id: string) => {
    onUpdate(recommenders.filter(r => r.id !== id))
  }

  const generateBriefing = async (rec: Recommender) => {
    setGeneratingId(rec.id)
    setError(null)
    try {
      const res = await fetch('/api/petition-builder/rec-letter-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommender: rec, pathway, narrative }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Failed to generate briefing')
      const updated = recommenders.map(r =>
        r.id === rec.id
          ? { ...r, briefing: data.briefing, briefing_generated_at: new Date().toISOString() }
          : r
      )
      onUpdate(updated)
      setExpandedId(rec.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate briefing')
    } finally {
      setGeneratingId(null)
    }
  }

  const copyBriefing = async (rec: Recommender) => {
    if (!rec.briefing) return
    await navigator.clipboard.writeText(rec.briefing)
    setCopiedId(rec.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const independentCount = recommenders.filter(r => r.relationship === 'independent_expert').length
  const totalCount = recommenders.length

  return (
    <div className="space-y-5">

      {/* Header guidance */}
      <div className="card !p-4 space-y-2">
        <p className="text-xs font-bold text-navy">Why recommendation letters make or break your petition</p>
        <p className="text-xs text-mid leading-relaxed">
          USCIS adjudicators weight independent expert letters highest, they prove your standing in the field without any relationship bias. For NIW, 3–5 letters is standard: at least 2 from experts with no direct connection to you. For EB-1A, 6–9 letters, majority independent.
        </p>
        {totalCount > 0 && (
          <div className="flex gap-3 pt-1">
            <div className={`text-xs font-medium px-2.5 py-1 rounded-full border ${independentCount >= 2 ? 'bg-teal/8 text-teal border-teal/20' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
              {independentCount} independent {independentCount === 1 ? 'expert' : 'experts'} {independentCount >= 2 ? '✓' : `— need ${2 - independentCount} more`}
            </div>
            <div className="text-xs text-mid px-2.5 py-1">{totalCount} total {totalCount === 1 ? 'letter' : 'letters'}</div>
          </div>
        )}
      </div>

      {/* Recommender list */}
      {recommenders.length > 0 && (
        <div className="space-y-3">
          {recommenders.map(rec => {
            const rel = RELATIONSHIP_LABELS[rec.relationship]
            const isGenerating = generatingId === rec.id
            const isExpanded = expandedId === rec.id
            const hasBriefing = !!rec.briefing

            return (
              <div key={rec.id} className="card !p-0 overflow-hidden">
                {/* Card header */}
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0 text-sm font-bold text-navy">
                    {rec.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy leading-tight">{rec.name}</p>
                        {(rec.title || rec.institution) && (
                          <p className="text-xs text-mid mt-0.5">
                            {[rec.title, rec.institution].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeRecommender(rec.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none mt-0.5"
                        title="Remove recommender"
                      >
                        ×
                      </button>
                    </div>
                    <span className={`mt-2 inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${rel.color}`}>
                      {rel.label} · {rel.weight}
                    </span>
                  </div>
                </div>

                {/* Briefing section */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
                  {hasBriefing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs text-teal font-medium">Briefing ready</span>
                        {rec.briefing_generated_at && (
                          <span className="text-[10px] text-mid">· {new Date(rec.briefing_generated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => copyBriefing(rec)}
                          className="text-xs text-teal font-semibold hover:underline"
                        >
                          {copiedId === rec.id ? '✓ Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="text-xs text-mid hover:text-navy font-medium"
                        >
                          {isExpanded ? 'Hide ▲' : 'View ▼'}
                        </button>
                        <button
                          onClick={() => generateBriefing(rec)}
                          disabled={isGenerating}
                          className="text-xs text-mid hover:text-navy"
                        >
                          {isGenerating ? 'Regenerating…' : 'Regenerate'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-mid">
                        {isGenerating
                          ? 'Writing personalized briefing… (~30s)'
                          : 'No briefing yet, generate one to send to this recommender'}
                      </p>
                      <button
                        onClick={() => generateBriefing(rec)}
                        disabled={isGenerating}
                        className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-2 flex-shrink-0"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating…
                          </>
                        ) : 'Generate Briefing'}
                      </button>
                    </>
                  )}
                </div>

                {/* Expanded briefing view */}
                {isExpanded && rec.briefing && (
                  <div className="border-t border-gray-100">
                    <div className="bg-gray-50 px-5 py-4 max-h-[60vh] overflow-y-auto">
                      <pre className="text-xs text-navy leading-relaxed whitespace-pre-wrap font-sans">{rec.briefing}</pre>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 bg-white">
                      <p className="text-[10px] text-mid leading-relaxed">
                        Send this briefing to {rec.name} before they start writing. It tells them exactly what USCIS needs from their letter, without revealing anything about the petition strategy.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Add recommender form */}
      {adding ? (
        <div className="card space-y-4">
          <p className="text-sm font-bold text-navy">Add a Recommender</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-navy">Full name *</label>
              <input
                className="input text-sm"
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-navy">Title / Position</label>
              <input
                className="input text-sm"
                placeholder="Professor, Associate Director…"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-navy">Institution / Organization</label>
              <input
                className="input text-sm"
                placeholder="MIT, Google Research, Mayo Clinic…"
                value={form.institution}
                onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
              />
            </div>
          </div>

          {/* Relationship type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-navy">Relationship to you</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.entries(RELATIONSHIP_LABELS) as [RelationshipType, typeof RELATIONSHIP_LABELS[RelationshipType]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, relationship: key }))}
                  className={`text-left p-3 rounded-xl border text-xs transition-colors ${
                    form.relationship === key
                      ? 'border-navy bg-navy/4 text-navy'
                      : 'border-gray-200 text-mid hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-navy">{val.label}</p>
                  <p className={`text-[10px] mt-0.5 font-medium ${key === 'independent_expert' ? 'text-teal' : 'text-mid'}`}>{val.weight}</p>
                </button>
              ))}
            </div>
            {form.relationship === 'independent_expert' && (
              <p className="text-[10px] text-teal leading-relaxed">
                ✓ Independent experts carry the most weight. USCIS expects 2+ letters from people with no prior working relationship with you.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addRecommender}
              disabled={!form.name.trim()}
              className="btn-primary !py-2 !px-4 !text-sm"
            >
              Add Recommender
            </button>
            <button
              onClick={() => { setAdding(false); setForm({ name: '', title: '', institution: '', relationship: 'independent_expert' }) }}
              className="text-sm text-mid hover:text-navy transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-sm text-mid hover:border-teal hover:text-teal transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add a recommender
        </button>
      )}

      {/* Guidance footer */}
      {recommenders.length === 0 && !adding && (
        <div className="rounded-xl bg-navy/4 border border-navy/10 p-4 space-y-2">
          <p className="text-xs font-bold text-navy">Who should write your letters?</p>
          <div className="space-y-1.5">
            {[
              { type: 'Independent experts (must have)', desc: 'Professors, researchers, or industry leaders who know your work but have never worked with you directly. Start finding these first.' },
              { type: 'Direct collaborators', desc: 'Co-authors, research partners, or colleagues who worked alongside you on significant projects.' },
              { type: 'Supervisors or advisors', desc: 'PhD advisor, PI, or department head who can speak to your contributions relative to others at your level.' },
            ].map(g => (
              <div key={g.type} className="flex gap-2">
                <span className="text-teal text-xs mt-0.5 flex-shrink-0">→</span>
                <div>
                  <span className="text-xs font-semibold text-navy">{g.type}:</span>
                  <span className="text-xs text-mid ml-1">{g.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generate track ───────────────────────────────────────────────────────────

function GenerateTrack({
  items,
  narrative,
  pathway,
  savedPacket,
  onGenerated,
}: {
  items: EvidenceItem[]
  narrative: string
  pathway: Pathway
  savedPacket: PetitionPackage | null
  onGenerated: (p: PetitionPackage) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [packet, setPacket] = useState<PetitionPackage | null>(savedPacket)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeDoc, setActiveDoc] = useState<'statement' | 'cover'>('statement')
  const [downloading, setDownloading] = useState<string | null>(null)

  const doneCount = items.filter(i => i.status === 'done').length
  const inProgressCount = items.filter(i => i.status === 'in_progress').length
  const hasNarrative = narrative.trim().length > 100
  const readinessScore = Math.round(((doneCount + inProgressCount * 0.5) / items.length) * 100)

  const readinessColor = readinessScore >= 70 ? 'text-teal' : readinessScore >= 40 ? 'text-yellow-500' : 'text-orange-500'
  const readinessLabel = readinessScore >= 70 ? 'Strong, ready to generate' : readinessScore >= 40 ? 'Partial, generation will have gaps' : 'Early, add more evidence for better output'

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const download = async (docType: 'statement' | 'cover' | 'package') => {
    if (!packet) return
    setDownloading(docType)
    try {
      const res = await fetch('/api/petition-builder/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType, packet }),
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('Content-Disposition') ?? ''
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
      a.download = filenameMatch?.[1] ?? `petition-${docType}.rtf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent, copy fallback still works
    } finally {
      setDownloading(null)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/petition-builder/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Generation failed')
      setPacket(data)
      onGenerated(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Readiness card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Generation Readiness</h3>
          <span className={`text-sm font-bold ${readinessColor}`}>{readinessScore}%</span>
        </div>

        <div className="h-2 rounded-full bg-navy-light overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${readinessScore >= 70 ? 'bg-teal' : readinessScore >= 40 ? 'bg-yellow-400' : 'bg-orange-400'}`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        <p className="text-xs text-mid">{readinessLabel}</p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Evidence done', value: `${doneCount}/${items.length}`, ok: doneCount > 0 },
            { label: 'Narrative written', value: hasNarrative ? 'Yes' : 'No', ok: hasNarrative },
            { label: 'Pathway set', value: pathway, ok: true },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl p-3 border text-center ${stat.ok ? 'border-teal/20 bg-teal/4' : 'border-gray-200 bg-gray-50'}`}>
              <p className={`text-sm font-bold ${stat.ok ? 'text-teal' : 'text-mid'}`}>{stat.value}</p>
              <p className="text-[10px] text-mid mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {!hasNarrative && (
          <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            ⚠️ No narrative statement written. Go to the Narrative tab and write your proposed endeavor, it's the spine of the petition.
          </p>
        )}
      </div>

      {/* Generate + Download buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={generate}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating… (60–90s)
            </>
          ) : packet ? 'Regenerate' : 'Generate petition package'}
        </button>

        {packet && !generating && (
          <button
            onClick={() => download('package')}
            disabled={!!downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal text-teal text-sm font-semibold hover:bg-teal/6 transition-colors disabled:opacity-50"
          >
            {downloading === 'package' ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Downloading…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download (.rtf)
              </>
            )}
          </button>
        )}

        {packet && !generating && (
          <p className="text-xs text-mid">
            Last generated {new Date(packet.generated_at).toLocaleDateString()} · {packet.word_count.toLocaleString()} words
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Output */}
      {packet && !generating && (
        <div className="space-y-4">

          {/* Doc tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {([
              { id: 'statement', label: 'Personal Statement' },
              { id: 'cover', label: 'Cover Letter' },
            ] as const).map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDoc(d.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeDoc === d.id ? 'border-navy text-navy' : 'border-transparent text-mid hover:text-navy'}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Document display */}
          {activeDoc === 'statement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-mid font-medium">Personal Statement · {packet.personal_statement.split(/\s+/).length.toLocaleString()} words</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => download('statement')}
                    disabled={!!downloading}
                    className="text-xs text-mid hover:text-navy font-medium flex items-center gap-1 disabled:opacity-40"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloading === 'statement' ? 'Downloading…' : '.rtf'}
                  </button>
                  <button
                    onClick={() => copy(packet.personal_statement, 'statement')}
                    className="text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'statement' ? '✓ Copied' : 'Copy all'}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-h-[60vh] overflow-y-auto">
                <pre className="text-xs text-navy leading-relaxed whitespace-pre-wrap font-sans">{packet.personal_statement}</pre>
              </div>
            </div>
          )}

          {activeDoc === 'cover' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-mid font-medium">Cover Letter · {packet.cover_letter.split(/\s+/).length.toLocaleString()} words</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => download('cover')}
                    disabled={!!downloading}
                    className="text-xs text-mid hover:text-navy font-medium flex items-center gap-1 disabled:opacity-40"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloading === 'cover' ? 'Downloading…' : '.rtf'}
                  </button>
                  <button
                    onClick={() => copy(packet.cover_letter, 'cover')}
                    className="text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'cover' ? '✓ Copied' : 'Copy all'}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-h-[60vh] overflow-y-auto">
                <pre className="text-xs text-navy leading-relaxed whitespace-pre-wrap font-sans">{packet.cover_letter}</pre>
              </div>
            </div>
          )}

          {/* Usage note */}
          <div className="rounded-xl bg-navy/4 border border-navy/10 p-4 space-y-2">
            <p className="text-xs font-bold text-navy">What to do next</p>
            <div className="space-y-1.5">
              {[
                'Download both documents and open in Word or Google Docs',
                'Replace all bracketed placeholders [ ] with your specific details',
                'Send recommender briefings (Letters tab) to each letter writer',
                'Assemble your exhibit package with supporting documents',
              ].map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-teal text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-mid">{step}</p>
                </div>
              ))}
            </div>
            <div className="pt-1 flex items-center gap-3">
              <a
                href="/filing-guide"
                className="text-xs text-teal font-semibold hover:underline"
              >
                Filing checklist & submission guide →
              </a>
              <span className="text-xs text-mid">Not legal advice, consult an attorney before filing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PetitionBuilderClient() {
  const [tab, setTab] = useState<Tab>('evidence')
  const [pathway, setPathway] = useState<Pathway>('NIW')
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [narrative, setNarrative] = useState('')
  const [serviceCenter, setServiceCenter] = useState('NSC')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recommenders, setRecommenders] = useState<Recommender[]>([])
  const [generatedPacket, setGeneratedPacket] = useState<PetitionPackage | null>(null)
  const [showPathwayConfirm, setShowPathwayConfirm] = useState<Pathway | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load
  useEffect(() => {
    fetch('/api/petition-builder')
      .then(r => r.json())
      .then(data => {
        if (data.error) return
        setPathway(data.pathway ?? 'NIW')
        setItems(data.evidence_items?.length ? data.evidence_items : getTemplateForPathway(data.pathway ?? 'NIW'))
        setNarrative(data.narrative_text ?? '')
        setServiceCenter(data.service_center ?? 'NSC')
        if (data.recommenders?.length) setRecommenders(data.recommenders)
        if (data.generated_petition) setGeneratedPacket(data.generated_petition)
      })
      .finally(() => setLoading(false))
  }, [])

  // Auto-save with debounce
  const save = useCallback((updates: Record<string, unknown>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    setSaving(true)
    saveTimeout.current = setTimeout(async () => {
      await fetch('/api/petition-builder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      setSaving(false)
    }, 800)
  }, [])

  const handleToggle = (id: string, status: EvidenceStatus) => {
    const updated = items.map(i => i.id === id ? { ...i, status } : i)
    setItems(updated)
    save({ evidence_items: updated })
  }

  const handleNote = (id: string, notes: string) => {
    const updated = items.map(i => i.id === id ? { ...i, notes } : i)
    setItems(updated)
    save({ evidence_items: updated })
  }

  const handleNarrative = (text: string) => {
    setNarrative(text)
    save({ narrative_text: text })
  }

  const handleServiceCenter = (code: string) => {
    setServiceCenter(code)
    save({ service_center: code })
  }

  const handleRecommenders = (updated: Recommender[]) => {
    setRecommenders(updated)
    save({ recommenders: updated })
  }

  const handlePathwayChange = (p: Pathway) => {
    const hasDoneItems = items.some(i => i.status !== 'todo')
    if (hasDoneItems) {
      setShowPathwayConfirm(p)
    } else {
      applyPathwayChange(p)
    }
  }

  const applyPathwayChange = (p: Pathway) => {
    const newItems = getTemplateForPathway(p)
    setPathway(p)
    setItems(newItems)
    setShowPathwayConfirm(null)
    save({ pathway: p, evidence_items: newItems })
  }

  const runwayDays = computeRunwayDays(items)
  const totalDays = items.reduce((s, i) => s + i.estimated_days, 0) * 0.6

  const lettersWithBriefings = recommenders.filter(r => r.briefing).length
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'evidence', label: 'Evidence', icon: '📋' },
    { id: 'narrative', label: 'Narrative', icon: '✍️' },
    { id: 'signal', label: 'Signal', icon: '📡' },
    { id: 'letters', label: recommenders.length > 0 ? `Letters (${lettersWithBriefings}/${recommenders.length})` : 'Letters', icon: '✉️' },
    { id: 'generate', label: generatedPacket ? 'Petition ✓' : 'Generate', icon: '📄' },
  ]

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-gray-100" />
        <div className="h-12 rounded-2xl bg-gray-100" />
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Petition Builder</h1>
          <p className="text-sm text-mid mt-1">Your structured path from today to a filing-ready petition.</p>
        </div>
        {saving && (
          <span className="text-xs text-mid mt-1.5 flex-shrink-0">Saving…</span>
        )}
      </div>

      {/* ── Pathway selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-mid font-medium">Pathway:</span>
        {(['NIW', 'EB-1A'] as Pathway[]).map(p => (
          <button
            key={p}
            onClick={() => handlePathwayChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              pathway === p
                ? 'bg-navy text-white border-navy'
                : 'border-gray-200 text-mid hover:border-navy hover:text-navy'
            }`}
          >
            {p}
          </button>
        ))}
        <span className="text-xs text-mid ml-1">
          {pathway === 'NIW' ? '— National Interest Waiver (Dhanasar)' : '— Extraordinary Ability (8 CFR §204.5(h))'}
        </span>
      </div>

      {/* ── Pathway change confirm ────────────────────────────────────── */}
      {showPathwayConfirm && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-orange-900">
            Switch to {showPathwayConfirm}?
          </p>
          <p className="text-xs text-orange-700 leading-relaxed">
            Switching pathway resets your evidence checklist to the {showPathwayConfirm} criteria. Your notes and narrative are preserved.
          </p>
          <div className="flex gap-3">
            <button onClick={() => applyPathwayChange(showPathwayConfirm)} className="text-xs font-bold bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              Yes, switch to {showPathwayConfirm}
            </button>
            <button onClick={() => setShowPathwayConfirm(null)} className="text-xs text-mid hover:text-navy transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Runway counter ───────────────────────────────────────────── */}
      <RunwayCounter days={Math.round(runwayDays)} total={Math.round(totalDays)} />

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0 ${
                tab === t.id
                  ? 'border-navy text-navy'
                  : 'border-transparent text-mid hover:text-navy'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {tab === 'evidence' && (
        <EvidenceTrack items={items} onToggle={handleToggle} onNote={handleNote} />
      )}
      {tab === 'narrative' && (
        <NarrativeTrack narrative={narrative} pathway={pathway} onChange={handleNarrative} />
      )}
      {tab === 'signal' && (
        <SignalTrack pathway={pathway} serviceCenter={serviceCenter} onServiceCenterChange={handleServiceCenter} />
      )}
      {tab === 'letters' && (
        <LettersTrack
          recommenders={recommenders}
          pathway={pathway}
          narrative={narrative}
          onUpdate={handleRecommenders}
        />
      )}
      {tab === 'generate' && (
        <GenerateTrack
          items={items}
          narrative={narrative}
          pathway={pathway}
          savedPacket={generatedPacket}
          onGenerated={setGeneratedPacket}
        />
      )}
    </div>
  )
}
