// scripts/precedent-failtag-retag.mjs
// Audit REC 3: failure-tag re-taxonomy with an expanded, closed tag set that
// includes NIW-specific tags (niw_* prefix). Today NIW prong failures are all
// coded per-prong with generic/no tags; this script re-reads each met=false
// finding (its stored `reasoning` quote first, the source PDF as fallback)
// and asks Claude to pick exactly ONE tag from the allowed set for that
// criterion or prong.
//
// Safe by construction (mirrors scripts/precedent-met-audit.mjs):
//   * NEVER touches `met`. Only failure_tag changes, and only on met=false rows.
//   * Snapshots originals first: failure_tag_raw is populated for each touched
//     row IF NOT already set, so the earliest known tag is preserved. Revert:
//       update outcomes_graph.criterion_findings
//       set failure_tag = failure_tag_raw
//       where id in (<ids from the run log>);
//   * Every applied change is appended to scripts/out/failtag-retag-<ts>.jsonl
//     with before/after values.
//   * Dry run by default. Pass --apply to write.
//   * Idempotent: the default scope only processes rows whose tag is NULL or
//     'other'; once a row carries a specific tag it is skipped on re-runs.
//     Pass --retag-all to re-judge every met=false row (temperature 0, so
//     re-runs converge to the same tags).
//
// Usage (run on a machine with internet access to uscis.gov + Anthropic):
//   node scripts/precedent-failtag-retag.mjs                    # dry run, all
//   node scripts/precedent-failtag-retag.mjs --scope=niw        # prongs only
//   node scripts/precedent-failtag-retag.mjs --scope=eb1a       # criteria only
//   node scripts/precedent-failtag-retag.mjs --limit=50         # quick sample
//   node scripts/precedent-failtag-retag.mjs --apply            # write tags
//   node scripts/precedent-failtag-retag.mjs --retag-all --apply
//
// UI note: new keys already have display labels in lib/precedent/labels.ts
// (FAILTAG_LABELS); niw_* tags are excluded from EB-1A failure lists in the
// prompt grounding block. Run order and revert: see scripts/README.md.
//
// Requires in .env.local: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY.

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
const RETAG_ALL = process.argv.includes('--retag-all')
const SCOPE = (process.argv.find((a) => a.startsWith('--scope=')) || '--scope=all').split('=')[1]
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0
const MODEL = 'claude-sonnet-4-6'
const CONCURRENCY = 4

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'outcomes_graph' },
})

// ── expanded closed taxonomy ──────────────────────────────────────
// Every key below MUST have a display label in lib/precedent/labels.ts
// FAILTAG_LABELS (enforced by scripts/precedent.test.mjs).
// BEGIN TAG SET
const TAXONOMY = {
  awards: ['award_not_nationally_recognized', 'evidence_credibility_questioned', 'other'],
  membership: ['membership_not_selective', 'evidence_credibility_questioned', 'other'],
  published_material: ['media_not_major', 'published_material_not_about_person', 'other'],
  judging: ['judging_not_documented', 'other'],
  original_contributions: ['contribution_not_major_significance', 'citations_not_significant', 'other'],
  scholarly_articles: ['articles_not_scholarly', 'citations_not_significant', 'other'],
  exhibitions: ['exhibition_not_qualifying', 'other'],
  leading_critical_role: ['role_not_leading', 'other'],
  high_salary: ['salary_not_comparative', 'other'],
  commercial_success: ['commercial_success_not_shown', 'other'],
  final_merits: ['final_merits_not_shown', 'other'],
  dhanasar_prong_1: ['niw_merit_not_substantial', 'niw_importance_not_national', 'niw_endeavor_too_vague', 'other'],
  dhanasar_prong_2: ['niw_not_well_positioned', 'niw_progress_not_shown', 'niw_endeavor_too_vague', 'other'],
  dhanasar_prong_3: ['niw_balance_not_favorable', 'other'],
}
// END TAG SET

const CRITERION_DESC = {
  awards: 'lesser nationally/internationally recognized prizes or awards, 8 CFR 204.5(h)(3)(i)',
  membership: 'membership in associations requiring outstanding achievement, (ii)',
  published_material: 'published material about the person in major media, (iii)',
  judging: 'participation as a judge of the work of others, (iv)',
  original_contributions: 'original contributions of major significance, (v)',
  scholarly_articles: 'authorship of scholarly articles, (vi)',
  exhibitions: 'display of work at artistic exhibitions, (vii)',
  leading_critical_role: 'leading or critical role for distinguished organizations, (viii)',
  high_salary: 'high salary or significantly high remuneration, (ix)',
  commercial_success: 'commercial success in the performing arts, (x)',
  final_merits: 'Kazarian final merits determination',
  dhanasar_prong_1: 'Dhanasar prong 1, substantial merit and national importance of the proposed endeavor',
  dhanasar_prong_2: 'Dhanasar prong 2, whether the person is well positioned to advance the endeavor',
  dhanasar_prong_3: 'Dhanasar prong 3, whether on balance it is beneficial to waive the job offer requirement',
}

// ── PDF fallback (same URL scheme as precedent-met-audit) ─────────
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

function pdfPassage(text, criterion) {
  const desc = CRITERION_DESC[criterion] || criterion
  const anchor = desc.split(',')[0]
  const i = text.toLowerCase().indexOf(anchor.toLowerCase().slice(0, 24))
  if (i === -1) return null
  return text.slice(Math.max(0, i - 300), i + 1600)
}

// ── LLM tagging ───────────────────────────────────────────────────
async function pickTag(criterion, evidence) {
  const tags = TAXONOMY[criterion]
  const prompt =
    `You are classifying WHY a USCIS AAO panel found a requirement NOT satisfied in an appeal of a denied ` +
    `EB-1A / EB-2 NIW petition.\n\n` +
    `Requirement: ${CRITERION_DESC[criterion] || criterion}\n\n` +
    `Choose exactly ONE tag from this closed set that best names the documented failure reason. ` +
    `If none clearly fits, answer "other".\n` +
    `Allowed tags: ${tags.join(', ')}\n\n` +
    `Answer with the tag only, nothing else.\n\n` +
    `EVIDENCE (AAO reasoning / decision excerpt):\n"""${evidence.slice(0, 3500)}"""`
  const r = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = (r.content[0]?.text || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  return tags.includes(raw) ? raw : 'other'
}

// ── main ──────────────────────────────────────────────────────────
async function main() {
  const prongKeys = ['dhanasar_prong_1', 'dhanasar_prong_2', 'dhanasar_prong_3']
  const eb1aKeys = Object.keys(TAXONOMY).filter((k) => !prongKeys.includes(k) && k !== 'final_merits')
  const criteria = SCOPE === 'niw' ? prongKeys : SCOPE === 'eb1a' ? eb1aKeys : [...eb1aKeys, ...prongKeys]

  // met=false only; never touches met. Default scope: untagged or generic rows.
  let query = supa
    .from('criterion_findings')
    .select('id, decision_id, criterion, failure_tag, failure_tag_raw, reasoning')
    .eq('met', false)
    .in('criterion', criteria)
  if (!RETAG_ALL) query = query.or('failure_tag.is.null,failure_tag.eq.other')
  const { data: rows, error } = await query.limit(20000)
  if (error) throw error

  // Source files for PDF fallback
  const ids = [...new Set(rows.map((r) => r.decision_id))]
  const srcById = new Map()
  for (let i = 0; i < ids.length; i += 500) {
    const { data: decs, error: dErr } = await supa
      .from('aao_decisions')
      .select('decision_id, source_file')
      .in('decision_id', ids.slice(i, i + 500))
    if (dErr) throw dErr
    for (const d of decs) srcById.set(d.decision_id, d.source_file)
  }

  let work = LIMIT ? rows.slice(0, LIMIT) : rows
  console.log(`Re-tagging ${work.length} met=false findings, scope=${SCOPE} (${APPLY ? 'APPLY' : 'DRY RUN'})\n`)

  const textCache = new Map()
  const proposals = [] // { row, tag }
  const dist = {}
  let errs = 0, done = 0

  async function run(row) {
    try {
      let evidence = (row.reasoning || '').trim()
      if (evidence.length < 120) {
        const src = srcById.get(row.decision_id)
        if (src && /^[A-Z]{3}[0-9]{6}_/.test(src)) {
          if (!textCache.has(src)) textCache.set(src, await getText(src))
          evidence = pdfPassage(textCache.get(src), row.criterion) || evidence
        }
      }
      if (!evidence) return
      const tag = await pickTag(row.criterion, evidence)
      dist[tag] = (dist[tag] || 0) + 1
      if (tag !== (row.failure_tag ?? null)) proposals.push({ row, tag })
    } catch {
      errs++
    } finally {
      if (++done % 50 === 0) console.log(`  ${done}/${work.length}  changed=${proposals.length} err=${errs}`)
    }
  }

  const queue = [...work]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await run(queue.shift())
    })
  )

  console.log('\nProposed tag distribution:')
  for (const [tag, n] of Object.entries(dist).sort((a, b) => b[1] - a[1])) console.log(`  ${tag}: ${n}`)
  console.log(`\n${proposals.length} rows would change (errors: ${errs}).`)

  if (!proposals.length) return console.log('Nothing to apply.')
  if (!APPLY) return console.log('Re-run with --apply to write.')

  mkdirSync(new URL('./out/', import.meta.url), { recursive: true })
  const logPath = new URL(`./out/failtag-retag-${Date.now()}.jsonl`, import.meta.url)
  writeFileSync(logPath, '')

  let applied = 0
  for (const { row, tag } of proposals) {
    const patch = { failure_tag: tag }
    if (row.failure_tag_raw === null || row.failure_tag_raw === undefined) patch.failure_tag_raw = row.failure_tag
    const { error: uErr } = await supa.from('criterion_findings').update(patch).eq('id', row.id)
    if (uErr) throw uErr
    appendFileSync(logPath, JSON.stringify({ id: row.id, criterion: row.criterion, before: row.failure_tag, after: tag }) + '\n')
    applied++
  }
  console.log(`Applied ${applied} tag updates. Audit log: ${logPath.pathname}`)
  console.log('Revert: set failure_tag = failure_tag_raw for the ids in the log.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
