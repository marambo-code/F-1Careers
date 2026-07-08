// scripts/precedent-prong-reextract.mjs
// Audit REC 2: prong-outcome re-extraction for sustained/remanded NIW appeals.
//
// Problem: AAO opinions in the corpus almost never record a Dhanasar prong as
// satisfied (even in sustained appeals the prongs are coded met=false/null),
// which is why the app must display contest shares instead of prong met-rates.
// This script re-reads the source PDFs for every SUSTAINED or REMANDED NIW
// decision, asks Claude per prong whether the AAO expressly found that prong
// SATISFIED, and records met=true on confirmed prongs.
//
// Safe by construction (mirrors scripts/precedent-met-audit.mjs):
//   * Only ever flips met -> true (never records a new failure).
//   * Snapshots originals first: met_raw / failure_tag_raw are populated for
//     each touched row IF NOT already set, so the earliest known value is
//     always preserved. Revert for a run:
//       update outcomes_graph.criterion_findings
//       set met = met_raw, failure_tag = failure_tag_raw
//       where id in (<ids from the run log>);
//   * Every applied change is also appended to scripts/out/prong-reextract-<ts>.jsonl
//     with the before/after values (local audit trail for the revert).
//   * Dry run by default. Pass --apply to write.
//   * Idempotent: rows already met=true are excluded from the next run.
//
// Usage (run on a machine with internet access to uscis.gov + Anthropic):
//   node scripts/precedent-prong-reextract.mjs             # dry run
//   node scripts/precedent-prong-reextract.mjs --limit=20  # quick sample
//   node scripts/precedent-prong-reextract.mjs --apply     # write confirmed
//
// Requires in .env.local: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY. Deps already in package.json.

import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

// ── env ───────────────────────────────────────────────────────────
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const APPLY = process.argv.includes('--apply')
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0
const MODEL = 'claude-sonnet-4-6'
const CONCURRENCY = 4

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'outcomes_graph' },
})

// ── PDF fetch (same URL scheme as precedent-met-audit) ────────────
const FOLD = {
  B2203: 'B2%20-%20Aliens%20with%20Extraordinary%20Ability',
  B5203: 'B5%20-%20Members%20of%20the%20Professions%20holding%20Advanced%20Degrees%20or%20Aliens%20of%20Exceptional%20Ability',
}
const urlOf = (fn) =>
  `https://www.uscis.gov/sites/default/files/err/${FOLD[fn.slice(-5)]}/Decisions_Issued_in_${fn.slice(5, 9)}/${fn}.pdf`

async function getText(src) {
  const res = await fetch(urlOf(src))
  if (!res.ok) throw new Error('http ' + res.status)
  const buf = Buffer.from(await res.arrayBuffer())
  const out = await pdfParse(buf)
  return out.text.replace(/\s+/g, ' ')
}

// ── passage extraction per prong ──────────────────────────────────
const PRONGS = {
  dhanasar_prong_1: {
    rx: /(first prong|prong 1\b|substantial merit and national importance|national importance)/i,
    label: 'Prong 1, substantial merit and national importance',
  },
  dhanasar_prong_2: {
    rx: /(second prong|prong 2\b|well[- ]positioned to advance)/i,
    label: 'Prong 2, well positioned to advance the proposed endeavor',
  },
  dhanasar_prong_3: {
    rx: /(third prong|prong 3\b|on balance|waive the (job offer|requirements? of a job offer))/i,
    label: 'Prong 3, on balance beneficial to waive the job offer requirement',
  },
}

function passage(text, prong) {
  const { rx } = PRONGS[prong]
  const g = new RegExp(rx.source, 'gi')
  const idxs = []
  let m
  while ((m = g.exec(text))) idxs.push(m.index)
  if (!idxs.length) return null
  // Take up to two windows around the first and last anchors; conclusions for
  // a prong often appear far from its first mention.
  const windows = []
  const take = (i) => text.slice(Math.max(0, i - 300), i + 1500)
  windows.push(take(idxs[0]))
  if (idxs.length > 1) windows.push(take(idxs[idxs.length - 1]))
  return windows.join('\n[...]\n').slice(0, 4000)
}

// ── LLM judgment ──────────────────────────────────────────────────
async function judge(prongLabel, outcome, txt) {
  const prompt =
    `You are auditing a USCIS Administrative Appeals Office (AAO) decision on an EB-2 National Interest Waiver ` +
    `(Matter of Dhanasar). The appeal outcome was: ${outcome.toUpperCase()}.\n\n` +
    `Below are passages discussing "${prongLabel}".\n\n` +
    `Question: Did the AAO expressly conclude that the petitioner SATISFIED this specific prong?\n` +
    `Rules:\n` +
    `- MET only if the AAO affirmatively found the prong satisfied/established, or expressly agreed with ` +
    `(or reinstated) a favorable finding on it.\n` +
    `- If the decision was REMANDED for the Director to re-evaluate THIS prong, or the AAO left it undecided, answer UNCLEAR.\n` +
    `- If the AAO found the prong not satisfied, or withdrew a favorable finding, answer NOT_MET.\n` +
    `- If the passages do not make the outcome for THIS prong clear, answer UNCLEAR.\n\n` +
    `Answer with exactly one word: MET, NOT_MET, or UNCLEAR.\n\n` +
    `PASSAGES:\n"""${txt}"""`
  const r = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8,
    messages: [{ role: 'user', content: prompt }],
  })
  const w = (r.content[0]?.text || '').toUpperCase()
  return w.includes('NOT_MET') ? 'NOT_MET' : w.includes('MET') ? 'MET' : 'UNCLEAR'
}

// ── main ──────────────────────────────────────────────────────────
async function main() {
  // 1) Sustained/remanded NIW decisions
  const { data: decisions, error: dErr } = await supa
    .from('aao_decisions')
    .select('decision_id, source_file, outcome')
    .eq('category', 'NIW')
    .in('outcome', ['sustained', 'remanded'])
  if (dErr) throw dErr

  const decById = new Map(decisions.map((d) => [d.decision_id, d]))

  // 2) Their prong findings not already met=true
  const findings = []
  const ids = decisions.map((d) => d.decision_id)
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supa
      .from('criterion_findings')
      .select('id, decision_id, criterion, met, failure_tag, met_raw, failure_tag_raw')
      .in('decision_id', ids.slice(i, i + 200))
      .in('criterion', Object.keys(PRONGS))
      .or('met.is.null,met.eq.false')
    if (error) throw error
    findings.push(...data)
  }

  let work = findings.filter((f) => {
    const d = decById.get(f.decision_id)
    return d && /^[A-Z]{3}[0-9]{6}_/.test(d.source_file || '')
  })
  if (LIMIT) work = work.slice(0, LIMIT)

  console.log(
    `Re-extracting prong outcomes for ${work.length} findings across ` +
      `${new Set(work.map((f) => f.decision_id)).size} sustained/remanded NIW decisions (${APPLY ? 'APPLY' : 'DRY RUN'})\n`
  )

  const textCache = new Map()
  const confirmed = [] // rows to flip met=true
  const tally = {}
  let met = 0, notmet = 0, unclear = 0, errs = 0, done = 0

  async function run(f) {
    try {
      const d = decById.get(f.decision_id)
      if (!textCache.has(d.source_file)) textCache.set(d.source_file, await getText(d.source_file))
      const pas = passage(textCache.get(d.source_file), f.criterion)
      if (!pas) { unclear++; return }
      const verdict = await judge(PRONGS[f.criterion].label, d.outcome, pas)
      tally[f.criterion] = tally[f.criterion] || { MET: 0, NOT_MET: 0, UNCLEAR: 0 }
      tally[f.criterion][verdict]++
      if (verdict === 'MET') { met++; confirmed.push(f) }
      else if (verdict === 'NOT_MET') notmet++
      else unclear++
    } catch {
      errs++
    } finally {
      if (++done % 25 === 0) console.log(`  ${done}/${work.length}  met=${met} notmet=${notmet} unclear=${unclear} err=${errs}`)
    }
  }

  const queue = [...work]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await run(queue.shift())
    })
  )

  console.log(`\nResult: MET=${met}  NOT_MET=${notmet}  UNCLEAR=${unclear}  ERR=${errs}`)
  for (const [k, v] of Object.entries(tally)) console.log(`  ${k}: MET=${v.MET} NOT_MET=${v.NOT_MET} UNCLEAR=${v.UNCLEAR}`)

  if (!confirmed.length) return console.log('Nothing to apply.')
  if (!APPLY) return console.log(`Would set met=true on ${confirmed.length} prong findings. Re-run with --apply to write.`)

  // 3) Apply: snapshot originals (only if raw is still null), then flip.
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true })
  const logPath = new URL(`./out/prong-reextract-${Date.now()}.jsonl`, import.meta.url)
  writeFileSync(logPath, '')

  let applied = 0
  for (const f of confirmed) {
    const patch = { met: true, failure_tag: null }
    if (f.met_raw === null || f.met_raw === undefined) patch.met_raw = f.met
    if (f.failure_tag_raw === null || f.failure_tag_raw === undefined) patch.failure_tag_raw = f.failure_tag
    const { error } = await supa.from('criterion_findings').update(patch).eq('id', f.id)
    if (error) throw error
    appendFileSync(logPath, JSON.stringify({ id: f.id, decision_id: f.decision_id, criterion: f.criterion, before: { met: f.met, failure_tag: f.failure_tag }, after: patch }) + '\n')
    applied++
  }
  console.log(`Applied ${applied} confirmed prong mets. Audit log: ${logPath.pathname}`)
  console.log('Revert: set met = met_raw, failure_tag = failure_tag_raw for the ids in the log.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
