// Server-side corpus grounding for the paid AI generators (Strategy Report,
// RFE Analyzer). REC 1 of the Precedent Engine audit.
//
// Contract, in order of importance (the paid report must never break):
//   1. OFF BY DEFAULT. getPrecedentGrounding() resolves to '' unless the env
//      flag PRECEDENT_GROUNDING=on is set, so with the flag off the prompts
//      the generators build are byte-identical to the pre-grounding prompts.
//   2. NEVER throws and NEVER hangs. Any fetch failure, empty views, or a
//      fetch slower than the timeout resolves to '' and the generator runs
//      on the exact ungrounded prompt.
//   3. SHORT. The block is hard-capped at MAX_CHARS (~500 tokens) so it can
//      never crowd the model context window.
//   4. HONEST. The corpus is appeals of already-denied petitions. The block
//      is framed as "what persuades adjudicators on appeal", never as
//      approval odds or percentiles, and instructs the model likewise.
//
// Guarded by tests in scripts/precedent.test.mjs (flag-off equivalence,
// failure fallback, timeout fallback, length cap, framing strings).

import { getPrecedentSummary, type PrecedentSummary } from './queries'
import { PATHWAY_LABEL, FIELD_LABELS } from './labels'

export const GROUNDING_FLAG = 'PRECEDENT_GROUNDING'
const DEFAULT_TIMEOUT_MS = 3000
const MAX_CHARS = 2000 // hard ceiling, roughly 500 tokens

export function precedentGroundingEnabled(): boolean {
  return process.env[GROUNDING_FLAG] === 'on'
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`
}

// Pure formatter, exported for tests. Returns the block WITHOUT the leading
// separator; getPrecedentGrounding adds '\n\n' so an empty result appends
// nothing to the prompt.
export function formatGroundingBlock(s: PrecedentSummary): string {
  const lines: string[] = []

  lines.push('═══ AAO PRECEDENT GROUNDING (adjudication-pattern data) ═══')
  lines.push(
    `Basis: ${s.corpus.decisions.toLocaleString()} published USCIS AAO appeal decisions ` +
      `(${s.corpus.findings.toLocaleString()} coded findings) on EB-1A / EB-2 NIW petitions. ` +
      `These are appeals of already-denied petitions: the numbers describe what persuades or fails to persuade ` +
      `adjudicators on appeal, never approval odds. Do NOT present any figure below as the candidate's ` +
      `probability of approval or as a percentile. Use them only to sharpen RFE-risk framing, evidence ` +
      `priorities, and rebuttal language.`
  )

  if (s.pathway === 'NIW') {
    lines.push('Where denied NIW cases were actually contested on appeal (share of decided Dhanasar prong findings):')
    for (const p of s.prongShares) {
      lines.push(`  • ${p.label}: ${pct(p.share)} of contested findings (n=${p.decided})`)
    }
    lines.push('Read: the largest share marks where denied NIW petitions most often lost; harden that prong first.')
  } else {
    lines.push('EB-1A criterion met-rates among decided findings on appeal (how often the AAO accepted the criterion as satisfied):')
    for (const r of s.topRequirements) {
      lines.push(`  • ${r.label}: ${pct(r.metRate)} met (n=${r.decided})`)
    }
    if (s.hardestRequirement) {
      lines.push(
        `  • Hardest on appeal: ${s.hardestRequirement.label}, ${pct(s.hardestRequirement.metRate)} met ` +
          `(n=${s.hardestRequirement.decided})`
      )
    }
  }

  // Failure tags are derived from EB-1A criterion findings; keep any future
  // NIW-specific tags (niw_* from the re-taxonomy script) out of this list.
  const eb1aFailures = s.topFailures.filter((f) => !f.key.startsWith('niw_'))
  if (eb1aFailures.length) {
    lines.push('Most common documented EB-1A evidence failure patterns (as named by the AAO):')
    for (const f of eb1aFailures) {
      lines.push(`  • ${f.label} (${f.count} findings)`)
    }
  }

  if (s.fieldDecisions >= 25) {
    lines.push(
      `Field context: ${s.fieldDecisions} of the ${PATHWAY_LABEL[s.pathway]} decisions are coded ` +
        `${FIELD_LABELS[s.field] ?? s.field}.`
    )
  }

  return lines.join('\n').slice(0, MAX_CHARS)
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`precedent grounding timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

// The single entry point the generators call. Resolves to '' (append-safe
// no-op) when the flag is off, on any error, or on timeout. When non-empty,
// the result starts with '\n\n' so callers can do `prompt + grounding`.
export async function getPrecedentGrounding(
  pathwayInput: string,
  field?: string | null,
  opts: { timeoutMs?: number } = {}
): Promise<string> {
  if (!precedentGroundingEnabled()) return ''
  return getPrecedentGroundingAlways(pathwayInput, field, opts)
}

// Flag-independent variant for the Pro interactive tools (Petition Builder
// narrative review). Keeps every other safety property of the contract:
// never throws, never hangs past the timeout, hard length cap, honest
// framing. The paid one-time generators must keep using the flagged
// getPrecedentGrounding above.
export async function getPrecedentGroundingAlways(
  pathwayInput: string,
  field?: string | null,
  opts: { timeoutMs?: number } = {}
): Promise<string> {
  try {
    const summary = await withTimeout(
      getPrecedentSummary(pathwayInput, field),
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    )
    const block = formatGroundingBlock(summary)
    return block ? `\n\n${block}` : ''
  } catch (err) {
    console.warn(
      '[precedent/grounding] falling back to ungrounded prompt:',
      err instanceof Error ? err.message : err
    )
    return ''
  }
}
