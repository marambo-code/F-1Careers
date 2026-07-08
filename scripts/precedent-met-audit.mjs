// scripts/precedent-met-audit.mjs
// Full LLM-judged met-direction audit for the two criteria whose raw met flag
// is unreliable: leading_critical_role and high_salary. For each finding still
// marked met=false, it fetches the source AAO decision, extracts the passage
// discussing that criterion, and asks Claude whether the AAO ultimately found
// the criterion SATISFIED. Confirmed mets are corrected in place.
//
// Safe by construction:
//   * Only ever flips met=false -> met=true (never the reverse).
//   * Originals are preserved in criterion_findings.met_raw / failure_tag_raw,
//     so the whole thing is reversible with a single UPDATE.
//   * Dry run by default. Pass --apply to write.
//
// Usage:
//   node scripts/precedent-met-audit.mjs            # dry run, prints summary
//   node scripts/precedent-met-audit.mjs --apply    # writes confirmed mets
//   node scripts/precedent-met-audit.mjs --limit=50 # cap for a quick test
//
// Requires in .env.local: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY. Deps already in package.json: @anthropic-ai/sdk,
// @supabase/supabase-js, pdf-parse.

import { readFileSync } from 'node:fs'
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

// ── passage extraction (same anchors as the corpus parser) ────────
const FOLD = {
  B2203: 'B2%20-%20Aliens%20with%20Extraordinary%20Ability',
  B5203: 'B5%20-%20Members%20of%20the%20Professions%20holding%20Advanced%20Degrees%20or%20Aliens%20of%20Exceptional%20Ability',
}
const urlOf = (fn) =>
  `https://www.uscis.gov/sites/default/files/err/${FOLD[fn.slice(-5)]}/Decisions_Issued_in_${fn.slice(5, 9)}/${fn}.pdf`

const META = {
  leading_critical_role: { rx: /leading or critical role/i, rom: 'viii', label: 'leading or critical role' },
  high_salary: { rx: /high salary|significantly high remuneration/i, rom: 'ix', label: 'high salary / high remuneration' },
}

async function getText(src) {
  const res = await fetch(urlOf(src))
  if (!res.ok) throw new Error('http ' + res.status)
  const buf = Buffer.from(await res.arrayBuffer())
  const out = await pdfParse(buf)
  return out.text.replace(/\s+/g, ' ')
}

function passage(text, criterion) {
  const { rx, rom } = META[criterion]
  const idxs = []
  const g = new RegExp(rx.source, 'gi')
  let m
  while ((m = g.exec(text))) idxs.push(m.index)
  const cg = new RegExp(`204\\.5\\(h\\)\\(3\\)\\(${rom}\\)`, 'gi')
  let c
  while ((c = cg.exec(text))) idxs.push(c.index)
  if (!idxs.length) return null
  idxs.sort((a, b) => a - b)
  // Prefer the anchor whose window contains a conclusion verb.
  const CONC = /(satisf|met|meet|withdraw|not (met|satisfied)|did not|does not|agree|conclude|determined)/i
  let best = idxs[0]
  for (const a of idxs) {
    if (CONC.test(text.slice(a, a + 1400))) {
      best = a
      break
    }
  }
  return text.slice(Math.max(0, best - 400), best + 1400)
}

// ── LLM judgment ──────────────────────────────────────────────────
async function judge(label, txt) {
  const prompt =
    `You are auditing a USCIS Administrative Appeals Office (AAO) decision. ` +
    `Below is the passage discussing the "${label}" criterion (8 CFR 204.5(h)(3)).\n\n` +
    `Question: Did the AAO ultimately conclude that the petitioner SATISFIED this specific criterion? ` +
    `Rules:\n` +
    `- A criterion counts as SATISFIED even if the overall petition was denied for failing the final-merits "totality" step or for not meeting three criteria.\n` +
    `- If the AAO WITHDREW or REVERSED a favorable finding on this criterion, it is NOT_MET.\n` +
    `- If a lower officer (Director/SCOPS) found it satisfied and the AAO did not disturb that, it is MET.\n` +
    `- If the passage does not make the outcome for THIS criterion clear, answer UNCLEAR.\n\n` +
    `Answer with exactly one word: MET, NOT_MET, or UNCLEAR.\n\n` +
    `PASSAGE:\n"""${txt}"""`
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
  const { data: findings, error } = await supa
    .from('criterion_findings')
    .select('id, decision_id, criterion')
    .in('criterion', ['leading_critical_role', 'high_salary'])
    .eq('met', false)
  if (error) throw error

  // Join to source_file in JS (no FK-embed dependency). Page through decisions.
  const ids = [...new Set(findings.map((f) => f.decision_id))]
  const srcById = new Map()
  for (let i = 0; i < ids.length; i += 500) {
    const { data: decs, error: dErr } = await supa
      .from('aao_decisions')
      .select('decision_id, source_file')
      .in('decision_id', ids.slice(i, i + 500))
    if (dErr) throw dErr
    for (const d of decs) srcById.set(d.decision_id, d.source_file)
  }

  let work = findings
    .map((f) => ({ id: f.id, criterion: f.criterion, src: srcById.get(f.decision_id) }))
    .filter((r) => r.src && /^[A-Z]{3}[0-9]{6}_/.test(r.src))
  if (LIMIT) work = work.slice(0, LIMIT)

  console.log(`Auditing ${work.length} findings (${APPLY ? 'APPLY' : 'DRY RUN'})\n`)
  const textCache = new Map()
  const confirmed = []
  let met = 0,
    notmet = 0,
    unclear = 0,
    errs = 0,
    done = 0

  async function run(item) {
    try {
      if (!textCache.has(item.src)) textCache.set(item.src, await getText(item.src))
      const txt = textCache.get(item.src)
      const pas = passage(txt, item.criterion)
      if (!pas) {
        unclear++
        return
      }
      const verdict = await judge(META[item.criterion].label, pas)
      if (verdict === 'MET') {
        met++
        confirmed.push(item.id)
      } else if (verdict === 'NOT_MET') notmet++
      else unclear++
    } catch (e) {
      errs++
    } finally {
      if (++done % 25 === 0) console.log(`  ${done}/${work.length}  met=${met} notmet=${notmet} unclear=${unclear} err=${errs}`)
    }
  }

  // simple concurrency pool
  const queue = [...work]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await run(queue.shift())
    })
  )

  console.log(`\nResult: MET=${met}  NOT_MET=${notmet}  UNCLEAR=${unclear}  ERR=${errs}`)

  if (APPLY && confirmed.length) {
    for (let i = 0; i < confirmed.length; i += 200) {
      const chunk = confirmed.slice(i, i + 200)
      const { error: uErr } = await supa
        .from('criterion_findings')
        .update({ met: true, failure_tag: null })
        .in('id', chunk)
      if (uErr) throw uErr
    }
    console.log(`Applied ${confirmed.length} confirmed mets (met=true, failure_tag=null).`)
  } else if (confirmed.length) {
    console.log(`Would apply ${confirmed.length} mets. Re-run with --apply to write.`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
