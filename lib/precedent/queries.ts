import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  CRITERION_LABELS,
  PRONG_LABELS,
  FAILTAG_LABELS,
  normalizeField,
  type Pathway,
} from './labels'

// ─── Shapes returned to the UI ────────────────────────────────────

export interface OutcomeRates {
  dismissed: number
  remanded: number
  sustained: number
  total: number
}
export interface CriterionStat {
  key: string
  label: string
  metRate: number // 0..1, met among decided
  decided: number
}
export interface FailTag {
  key: string
  label: string
  count: number
}
export interface PrecedentCase {
  id: string
  date: string | null
  category: string
  field: string
  rfe: boolean
  sourceFile: string
}
export interface PrecedentData {
  corpus: { decisions: number; findings: number }
  outcomes: Record<Pathway, OutcomeRates>
  criteria: CriterionStat[] // EB-1A, sorted by metRate desc
  prongs: CriterionStat[] // Dhanasar, in prong order
  failtags: FailTag[] // sorted desc, excludes the generic "other"
  fieldCounts: Record<Pathway, Record<string, number>>
  cases: PrecedentCase[]
}

// ─── Compact summary for Strategy / RFE / explorer callouts ───────

// Share of decided Dhanasar findings contested at each prong. This — not the
// prong "met rate" — is the honest NIW signal: AAO opinions in dismissals
// essentially never record a prong as satisfied (even sustained appeals are
// coded met=false/null), so met-rates for prongs are a denominator artifact
// and must never be surfaced as odds.
export interface ProngShare {
  key: string
  label: string
  decided: number
  share: number // 0..1 of all decided prong findings
}

export interface PrecedentSummary {
  pathway: Pathway
  field: string
  fieldDecisions: number
  corpus: { decisions: number; findings: number }
  outcomes: OutcomeRates
  topRequirements: CriterionStat[] // 3 most winnable for the pathway
  hardestRequirement: CriterionStat
  // Documented, criterion-coded denial reasons. These tags are derived from
  // EB-1A criterion findings (NIW failures are coded per-prong, not per-tag),
  // so surfaces must label them as EB-1A evidence standards.
  topFailures: FailTag[] // top 3
  prongShares: ProngShare[] // sorted by share desc; the NIW display metric
}

function rate(t: number, f: number): number {
  const d = t + f
  return d ? t / d : 0
}

// ─── Full dataset (used by the dedicated page, server-side) ───────

// The precedent views are public aggregates readable by `anon`, so we use a
// plain cookie-less client. This keeps public pages (e.g. /explorer) statically
// renderable — the cookie-bound server client would force them dynamic.
// Results are cached in-process for an hour: the underlying corpus changes
// rarely and every surface would otherwise fire 7 queries per request.
const CACHE_TTL_MS = 60 * 60 * 1000
let cache: { at: number; data: PrecedentData } | null = null

export async function getPrecedentData(): Promise<PrecedentData> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const [corpusR, outcomesR, critR, prongR, tagR, fieldR, caseR] = await Promise.all([
    supabase.from('precedent_corpus').select('*').single(),
    supabase.from('precedent_outcome_rates').select('*'),
    supabase.from('precedent_criteria').select('*'),
    supabase.from('precedent_prongs').select('*'),
    supabase.from('precedent_failtags').select('*'),
    supabase.from('precedent_field_counts').select('*'),
    supabase.from('precedent_cases').select('*').limit(60),
  ])

  const outcomes: Record<Pathway, OutcomeRates> = {
    EB1A: { dismissed: 0, remanded: 0, sustained: 0, total: 0 },
    NIW: { dismissed: 0, remanded: 0, sustained: 0, total: 0 },
  }
  for (const row of outcomesR.data ?? []) {
    const cat = row.category as string
    const key: Pathway | null = cat === 'EB1A' ? 'EB1A' : cat === 'NIW' ? 'NIW' : null
    if (!key) continue
    if (row.outcome === 'dismissed' || row.outcome === 'remanded' || row.outcome === 'sustained') {
      outcomes[key][row.outcome as 'dismissed' | 'remanded' | 'sustained'] = row.n
      outcomes[key].total += row.n
    }
  }

  const criteria: CriterionStat[] = (critR.data ?? [])
    .map((r) => ({
      key: r.criterion as string,
      label: CRITERION_LABELS[r.criterion as string] ?? (r.criterion as string),
      metRate: rate(r.met_true, r.met_false),
      decided: r.met_true + r.met_false,
    }))
    .sort((a, b) => b.metRate - a.metRate)

  const prongOrder = ['dhanasar_prong_1', 'dhanasar_prong_2', 'dhanasar_prong_3']
  const prongs: CriterionStat[] = (prongR.data ?? [])
    .map((r) => ({
      key: r.criterion as string,
      label: PRONG_LABELS[r.criterion as string] ?? (r.criterion as string),
      metRate: rate(r.met_true, r.met_false),
      decided: r.met_true + r.met_false,
    }))
    .sort((a, b) => prongOrder.indexOf(a.key) - prongOrder.indexOf(b.key))

  const failtags: FailTag[] = (tagR.data ?? [])
    .filter((r) => r.failure_tag !== 'other')
    .map((r) => ({
      key: r.failure_tag as string,
      label: FAILTAG_LABELS[r.failure_tag as string] ?? (r.failure_tag as string),
      count: r.n,
    }))
    .sort((a, b) => b.count - a.count)

  const fieldCounts: Record<Pathway, Record<string, number>> = { EB1A: {}, NIW: {} }
  for (const row of fieldR.data ?? []) {
    const cat = row.category as string
    if (cat === 'EB1A' || cat === 'NIW') {
      fieldCounts[cat as Pathway][row.field_of_endeavor as string] = row.n
    }
  }

  const cases: PrecedentCase[] = (caseR.data ?? []).map((r) => ({
    id: r.decision_id as string,
    date: r.decision_date as string | null,
    category: r.category as string,
    field: r.field_of_endeavor as string,
    rfe: Boolean(r.rfe_issued),
    sourceFile: r.source_file as string,
  }))

  // If the views are missing, empty, or unreadable, fail loudly here so
  // callers (PrecedentCallout, the API route) can catch and degrade — instead
  // of rendering with undefined stats and crashing mid-render inside pages
  // that embed the callout (Strategy, RFE, explorer).
  if (!criteria.length || !prongs.length) {
    throw new Error(
      `Precedent views returned no data (criteria=${criteria.length}, prongs=${prongs.length}); ` +
        `first error: ${critR.error?.message ?? prongR.error?.message ?? 'none'}`
    )
  }

  // If the corpus view alone fails, degrade to totals derived from the other
  // views instead of rendering "0 decisions" in hero copy.
  const derivedDecisions = outcomes.EB1A.total + outcomes.NIW.total
  const derivedFindings =
    criteria.reduce((s, c) => s + c.decided, 0) + prongs.reduce((s, p) => s + p.decided, 0)

  const data: PrecedentData = {
    corpus: {
      decisions: corpusR.data?.decisions || derivedDecisions,
      findings: corpusR.data?.findings || derivedFindings,
    },
    outcomes,
    criteria,
    prongs,
    failtags,
    fieldCounts,
    cases,
  }
  cache = { at: Date.now(), data }
  return data
}

// ─── Petition Builder payload ─────────────────────────────────────

// Serializable slice of the corpus for the Petition Builder client:
// per-criterion met rates (EB-1A), prong contest shares (NIW), and the
// documented failure tags. Same honesty contract as everywhere else:
// this is a denial-appeal corpus, never approval odds.
export interface PetitionPrecedent {
  corpus: { decisions: number; findings: number }
  criteria: Record<string, { label: string; metRate: number; decided: number }>
  prongShares: ProngShare[]
  failtags: FailTag[]
}

export async function getPetitionBuilderPrecedent(): Promise<PetitionPrecedent | null> {
  try {
    const data = await getPrecedentData()
    const criteria: PetitionPrecedent['criteria'] = {}
    for (const c of data.criteria) {
      criteria[c.key] = { label: c.label, metRate: c.metRate, decided: c.decided }
    }
    const prongDecidedTotal = data.prongs.reduce((s, p) => s + p.decided, 0) || 1
    const prongShares: ProngShare[] = data.prongs.map((p) => ({
      key: p.key,
      label: p.label,
      decided: p.decided,
      share: p.decided / prongDecidedTotal,
    }))
    return {
      corpus: data.corpus,
      criteria,
      prongShares,
      failtags: data.failtags.slice(0, 6),
    }
  } catch {
    return null
  }
}

// ─── Compact summary (used by callouts + the API route) ───────────

export async function getPrecedentSummary(
  pathwayInput: string,
  fieldInput?: string | null
): Promise<PrecedentSummary> {
  const pathway: Pathway = pathwayInput === 'EB1A' || pathwayInput === 'EB-1A' ? 'EB1A' : 'NIW'
  const field = normalizeField(fieldInput)
  const data = await getPrecedentData()

  const reqs = pathway === 'EB1A' ? data.criteria : data.prongs
  const byRate = [...reqs].sort((a, b) => b.metRate - a.metRate)
  const topRequirements = byRate.slice(0, 3)
  const hardestRequirement = byRate[byRate.length - 1]
  const fieldDecisions = data.fieldCounts[pathway][field] ?? 0

  const prongDecidedTotal = data.prongs.reduce((s, p) => s + p.decided, 0) || 1
  const prongShares: ProngShare[] = [...data.prongs]
    .map((p) => ({
      key: p.key,
      label: p.label,
      decided: p.decided,
      share: p.decided / prongDecidedTotal,
    }))
    .sort((a, b) => b.share - a.share)

  return {
    pathway,
    field,
    fieldDecisions,
    corpus: data.corpus,
    outcomes: data.outcomes[pathway],
    topRequirements,
    hardestRequirement,
    topFailures: data.failtags.slice(0, 3),
    prongShares,
  }
}
