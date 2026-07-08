import Link from 'next/link'
import { getPrecedentSummary } from '@/lib/precedent/queries'
import { FIELD_LABELS, PATHWAY_LABEL } from '@/lib/precedent/labels'

// Only claim field-level coverage when the corpus actually has enough
// decisions in that field to mean something.
const MIN_FIELD_N = 25

// Server component. Drop into any RSC (Strategy, explorer) to surface the
// precedent evidence base for a given pathway + field.
//
// Framing contract (do not regress):
// - Lead with what the record shows persuades adjudicators, never with
//   denial percentages. The corpus is 100% appealed denials, so raw outcome
//   rates read as the user's odds when they are nothing of the sort.
// - Never surface NIW prong met-rates (a coding artifact, ~0%); use contest
//   shares instead.
// - Label failure tags as EB-1A evidence standards (that is where they come
//   from).
export default async function PrecedentCallout({
  pathway,
  field,
  compact = false,
}: {
  pathway: string
  field?: string | null
  compact?: boolean
}) {
  let summary
  try {
    summary = await getPrecedentSummary(pathway, field)
  } catch {
    return null
  }

  const isEB1A = summary.pathway === 'EB1A'
  const showField = Boolean(field) && summary.fieldDecisions >= MIN_FIELD_N
  const best = summary.topRequirements[0]
  const battleground = summary.prongShares[0]

  return (
    <div className="card border-l-4 border-l-teal">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[11px] font-bold tracking-widest uppercase text-gray-400">
          Precedent Engine · built from {summary.corpus.decisions.toLocaleString()} real AAO decisions
        </div>
        <Link href="/precedent-engine" className="text-teal text-sm font-bold hover:opacity-80 whitespace-nowrap">
          Open the Engine →
        </Link>
      </div>

      <h3 className="text-navy text-base font-bold mt-1.5 mb-1">
        What actually persuades adjudicators in {PATHWAY_LABEL[summary.pathway]} cases
      </h3>
      <p className="text-sm text-mid mb-3">
        Patterns from {summary.outcomes.total.toLocaleString()} adjudicated {PATHWAY_LABEL[summary.pathway]} appeals
        {showField && (
          <>, including {summary.fieldDecisions.toLocaleString()} decisions in {FIELD_LABELS[summary.field]}</>
        )}
        .
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {isEB1A ? (
          <>
            <Stat
              label="Most winnable criterion"
              value={`${Math.round(best.metRate * 100)}%`}
              sub={`${best.label}, accepted when contested`}
              tone="teal"
            />
            <Stat
              label="Toughest to document"
              value={`${Math.round(summary.hardestRequirement.metRate * 100)}%`}
              sub={`${summary.hardestRequirement.label}, needs independent corroboration`}
              tone="navy"
            />
          </>
        ) : (
          <>
            <Stat
              label="Where cases are decided"
              value="Prong 1"
              sub={`contested in ${Math.round((battleground?.share ?? 0) * 100)}% of prong findings, win the national-importance framing`}
              tone="teal"
            />
            <Stat
              label="Findings decoded"
              value={summary.corpus.findings.toLocaleString()}
              sub="criterion + prong level, linked to sources"
              tone="navy"
            />
          </>
        )}
        {showField ? (
          <Stat label="Decisions in your field" value={summary.fieldDecisions.toLocaleString()} tone="navy" />
        ) : (
          <Stat
            label="Decisions analyzed"
            value={summary.outcomes.total.toLocaleString()}
            sub={`${PATHWAY_LABEL[summary.pathway]} appeals, 2023-2026`}
            tone="navy"
          />
        )}
      </div>

      {!compact && (
        <div className="grid sm:grid-cols-2 gap-4">
          {isEB1A ? (
            <div>
              <div className="text-xs font-bold text-navy mb-1.5">Most winnable criteria (accepted when contested)</div>
              <ul className="space-y-1.5">
                {summary.topRequirements.map((r) => (
                  <li key={r.key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{r.label}</span>
                    <span className="badge-strong">{Math.round(r.metRate * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-navy mb-1.5">Where contested NIW cases are decided</div>
              <ul className="space-y-1.5">
                {summary.prongShares.map((p) => (
                  <li key={p.key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{p.label}</span>
                    <span className="badge-strong">{Math.round(p.share * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-navy mb-1.5">
              {isEB1A ? 'Documented evidence gaps to avoid' : 'Evidence standards officers apply (from EB-1A findings)'}
            </div>
            <ul className="space-y-1.5">
              {summary.topFailures.map((f) => (
                <li key={f.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{f.label}</span>
                  <span className="badge-gap">{f.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="text-xs text-mid mt-4">
        Honest denominator: these are appeals of already-denied petitions, so nothing here is your approval odds.
        What the record does show, criterion by criterion, is which evidence adjudicators accepted. Your report is
        built to keep your petition out of these statistics.
      </p>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'navy' | 'teal' }) {
  const color = tone === 'teal' ? 'text-teal' : 'text-navy'
  return (
    <div className="rounded-lg bg-gray-50 border border-border p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-0.5 ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-mid mt-0.5 leading-tight">{sub}</div>}
    </div>
  )
}
