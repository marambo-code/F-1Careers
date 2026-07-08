'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PrecedentSummary } from '@/lib/precedent/queries'
import { FIELD_LABELS, PATHWAY_LABEL } from '@/lib/precedent/labels'

const MIN_FIELD_N = 25

// Client component for client-rendered surfaces (e.g. the RFE wizard).
// Fetches the compact summary from /api/precedent/summary.
//
// Same framing contract as PrecedentCallout: lead with what persuades
// adjudicators, never with denial rates; never show NIW prong met-rates
// (coding artifact); label failure tags as EB-1A derived.
export default function PrecedentCalloutClient({ pathway, field }: { pathway: string; field?: string | null }) {
  const [s, setS] = useState<PrecedentSummary | null>(null)

  useEffect(() => {
    let active = true
    const qs = new URLSearchParams({ pathway: pathway || 'NIW' })
    if (field) qs.set('field', field)
    fetch(`/api/precedent/summary?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setS(d && !d.error ? d : null))
      .catch(() => active && setS(null))
    return () => {
      active = false
    }
  }, [pathway, field])

  if (!s || !s.topRequirements?.length) return null
  const isEB1A = s.pathway === 'EB1A'
  const best = s.topRequirements[0]
  const battleground = s.prongShares?.[0]
  const topGap = s.topFailures?.[0]
  const showField = Boolean(field) && s.fieldDecisions >= MIN_FIELD_N

  return (
    <div className="card border-l-4 border-l-teal">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
          Precedent Engine · built from {(s.corpus?.decisions ?? 0).toLocaleString()} real AAO decisions
        </div>
        <Link href="/precedent-engine" className="text-teal text-sm font-bold hover:opacity-80 whitespace-nowrap">
          Open the Engine →
        </Link>
      </div>
      <h3 className="text-navy text-base font-bold mt-1.5 mb-1">
        Your RFE is answerable: the record shows exactly what {PATHWAY_LABEL[s.pathway]} officers accept
      </h3>
      <p className="text-sm text-mid mb-3">
        Patterns from {s.outcomes.total.toLocaleString()} adjudicated {PATHWAY_LABEL[s.pathway]} appeals
        {showField && <>, including {s.fieldDecisions.toLocaleString()} in {FIELD_LABELS[s.field]}</>}.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mb-1">
        {isEB1A ? (
          <>
            <div className="rounded-lg bg-gray-50 border border-border p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Most winnable criterion</div>
              <div className="text-xl font-bold mt-0.5 text-teal">{Math.round(best.metRate * 100)}%</div>
              <div className="text-[11px] text-mid mt-0.5 leading-tight">{best.label}, accepted when contested</div>
            </div>
            <div className="rounded-lg bg-gray-50 border border-border p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">#1 documented gap</div>
              <div className="text-sm font-bold mt-0.5 text-navy leading-tight">{topGap?.label ?? 'n/a'}</div>
              <div className="text-[11px] text-mid mt-0.5 leading-tight">fix this in your response before anything else</div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-gray-50 border border-border p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Where cases are decided</div>
              <div className="text-xl font-bold mt-0.5 text-teal">Prong 1</div>
              <div className="text-[11px] text-mid mt-0.5 leading-tight">
                contested in {Math.round((battleground?.share ?? 0) * 100)}% of prong findings, lead with national importance
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 border border-border p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Findings decoded</div>
              <div className="text-xl font-bold mt-0.5 text-navy">{(s.corpus?.findings ?? 0).toLocaleString()}</div>
              <div className="text-[11px] text-mid mt-0.5 leading-tight">criterion + prong level</div>
            </div>
          </>
        )}
        <div className="rounded-lg bg-gray-50 border border-border p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            {showField ? 'Decisions in your field' : 'Decisions analyzed'}
          </div>
          <div className="text-xl font-bold mt-0.5 text-navy">
            {(showField ? s.fieldDecisions : s.outcomes.total).toLocaleString()}
          </div>
          {!showField && (
            <div className="text-[11px] text-mid mt-0.5 leading-tight">{PATHWAY_LABEL[s.pathway]} appeals, 2023-2026</div>
          )}
        </div>
      </div>
      <p className="text-xs text-mid mt-3">
        These are appeals of denied petitions, not your odds. They document the exact reasons responses fall short,
        so your analysis targets what officers actually accept.
      </p>
    </div>
  )
}
