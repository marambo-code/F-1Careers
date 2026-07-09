#!/usr/bin/env node
// scripts/precedent-grounding-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
// QA harness for the PRECEDENT_GROUNDING feature flag (REC 1).
//
// Runs the REAL generateStrategyReport() code path from lib/ai/strategy-engine.ts
// against a FICTIONAL sample profile (EB-2 NIW, business/entrepreneurship),
// twice: once with PRECEDENT_GROUNDING=on and once with it off. Prints:
//   (a) the exact assembled prompt for each of the 4 report calls, showing
//       the AAO grounding block in place (grounded run) and absent (ungrounded),
//   (b) a check that the grounded prompt minus the block is byte-identical
//       to the ungrounded prompt,
//   (c) both full generated reports, then a side-by-side comparison of the
//       sections grounding is meant to sharpen (petition_readiness, rfe_risks).
//
// Run (from repo root, on a machine that can reach api.anthropic.com and
// supabase.co, i.e. your laptop, NOT a sandbox):
//
//   node scripts/precedent-grounding-check.mjs
//   node scripts/precedent-grounding-check.mjs --grounded-only   # half the API cost
//
// Requires in .env.local: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY.
//
// SAFETY (this script is a read-only QA tool):
//   • NEVER imports or touches Stripe; no payment is involved. The $297
//     checkout only gates access to the generator route, not report quality.
//   • NEVER writes to the database. The only DB access is grounding's
//     SELECT on the public precedent_* aggregate views via the anon key.
//   • Uses a FICTIONAL profile; no customer records are read or created.
//   • Makes 8 Anthropic API calls (4 grounded + 4 ungrounded) at your
//     account's expense, roughly one paid report's worth of tokens per run.
//     Use --grounded-only for 4 calls.
//   • Cost aside, safe to re-run any time; it leaves no state anywhere.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const groundedOnly = process.argv.includes('--grounded-only')

// ── Load .env.local (same pattern as the other scripts) ─────────────────────
for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  const k = t.slice(0, eq).trim()
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!(k in process.env)) process.env[k] = v
}
for (const k of ['ANTHROPIC_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  if (!process.env[k]) {
    console.error(`✗ ${k} missing from .env.local`)
    process.exit(1)
  }
}

// ── Transpile the REAL production modules (same approach as precedent.test.mjs)
// Only two substitutions, neither changes report logic:
//   • bare npm specifiers are bridged through createRequire so the transpiled
//     ESM files in the temp dir can resolve the repo's node_modules;
//   • the Anthropic client is wrapped (not replaced) so we can capture the
//     exact prompt each call sends before forwarding it to the real API.
const require_ = createRequire(join(ROOT, 'package.json'))
const ts = require_('typescript')
const out = mkdtempSync(join(tmpdir(), 'grounding-check-'))

const transpile = (rel) =>
  ts.transpileModule(readFileSync(join(ROOT, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText

writeFileSync(join(out, 'labels.mjs'), transpile('lib/precedent/labels.ts'))
writeFileSync(
  join(out, 'queries.mjs'),
  transpile('lib/precedent/queries.ts')
    .replace(`'@supabase/supabase-js'`, `'./supabase-bridge.mjs'`)
    .replace(`'./labels'`, `'./labels.mjs'`)
)
writeFileSync(
  join(out, 'grounding.mjs'),
  transpile('lib/precedent/grounding.ts')
    .replace(`'./queries'`, `'./queries.mjs'`)
    .replace(`'./labels'`, `'./labels.mjs'`)
)
writeFileSync(
  join(out, 'strategy-engine.mjs'),
  transpile('lib/ai/strategy-engine.ts')
    .replace(`'@anthropic-ai/sdk'`, `'./anthropic-capture.mjs'`)
    .replace(`'@/lib/precedent/grounding'`, `'./grounding.mjs'`)
)

// Real supabase-js, re-exported for the temp dir (READ-ONLY anon client).
writeFileSync(
  join(out, 'supabase-bridge.mjs'),
  `import { createRequire } from 'node:module'
const req = createRequire(${JSON.stringify(join(ROOT, 'package.json'))})
const mod = req('@supabase/supabase-js')
export const createClient = mod.createClient
`
)

// Real Anthropic SDK wrapped to record each prompt before sending it.
writeFileSync(
  join(out, 'anthropic-capture.mjs'),
  `import { createRequire } from 'node:module'
const req = createRequire(${JSON.stringify(join(ROOT, 'package.json'))})
const mod = req('@anthropic-ai/sdk')
const Real = mod.Anthropic ?? mod.default ?? mod
export default class AnthropicCapture {
  constructor(opts) {
    const real = new Real(opts)
    this.messages = {
      create: (body, callOpts) => {
        ;(globalThis.__CAPTURED_PROMPTS ??= []).push({
          model: body.model,
          max_tokens: body.max_tokens,
          system: body.system,
          user: body.messages[0].content,
        })
        return real.messages.create(body, callOpts)
      },
    }
  }
}
`
)

const { generateStrategyReport } = await import(pathToFileURL(join(out, 'strategy-engine.mjs')).href)

// ── Fictional sample profile (EB-2 NIW, business/entrepreneurship). ─────────
// No real customer data. Scores make NIW the recommended pathway, matching
// the corpus' largest segment (NIW × business).
const profile = {
  full_name: 'QA Sample Candidate',
  university: 'University of Michigan, Ross School of Business',
  degree: 'MBA',
  field_of_study: 'Business Administration',
  graduation_date: '2024-05',
  visa_status: 'F-1 OPT',
  visa_expiration: '2027-07',
  career_goal: 'Permanent residency via EB-2 NIW',
  field_of_work: 'business',
  subfield: 'entrepreneurship, cross-border fintech',
  education_level: 'masters',
  years_in_field: '6',
  current_role: 'Co-founder and Head of Product',
  current_employer: 'RemitBridge (fintech startup, 11 employees)',
  us_salary: '$145,000',
  filing_timeline: '6',
  work_description:
    'Built a cross-border remittance platform reducing transfer fees for US immigrant workers. ' +
    'Platform processes $4M/month, partnered with two US community banks, featured in TechCrunch. ' +
    'Advises a state small-business development center on fintech access for underbanked communities.',
  proposed_endeavor:
    'Expand low-cost remittance and banking infrastructure for underbanked immigrant communities ' +
    'across the US, in partnership with community banks and CDFIs, lowering remittance costs and ' +
    'improving financial inclusion, an area of documented federal policy interest.',
  cr_awards: 1, cr_membership: 1, cr_press: 2, cr_judging: 1, cr_contributions: 2,
  cr_scholarly: 0, cr_display: 0, cr_critical_role: 3, cr_high_salary: 2, cr_commercial: 1,
  notes_awards: 'Regional fintech pitch competition winner (2023)',
  notes_scholarly: '',
  notes_contributions: 'Proprietary FX-batching model cut average remittance cost 38%',
  notes_press: 'TechCrunch feature, American Banker interview',
  notes_critical_role: 'Co-founder; leads product org at a VC-backed startup',
  niw_prong1: 3, niw_prong2: 3, niw_prong3: 2,
  employer_support: 'Self-petitioning (founder)',
  attorney_consulted: 'no',
  biggest_concern: 'Whether a startup founder without scholarly publications can win NIW',
  job_history: [
    { role: 'Product Manager', employer: 'Intuit', duration: '2019-2022' },
    { role: 'Analyst', employer: 'McKinsey & Company', duration: '2017-2019' },
  ],
}

const GROUNDING_MARKER = 'AAO PRECEDENT GROUNDING'
const banner = (t) => console.log(`\n${'═'.repeat(78)}\n  ${t}\n${'═'.repeat(78)}`)

async function run(flag) {
  if (flag) process.env.PRECEDENT_GROUNDING = 'on'
  else delete process.env.PRECEDENT_GROUNDING
  globalThis.__CAPTURED_PROMPTS = []
  const report = await generateStrategyReport(profile)
  return { report, prompts: globalThis.__CAPTURED_PROMPTS }
}

banner('RUN 1 of ' + (groundedOnly ? 1 : 2) + ': PRECEDENT_GROUNDING=on (grounded)')
const grounded = await run(true)

let ungrounded = null
if (!groundedOnly) {
  banner('RUN 2 of 2: flag off (ungrounded)')
  ungrounded = await run(false)
}

// ── (a) Assembled prompt with the grounding block in place ──────────────────
banner('ASSEMBLED PROMPT, grounded run, call 1 of 4 (assessment)')
console.log(grounded.prompts[0].user)
console.log(`\n[model=${grounded.prompts[0].model}, max_tokens=${grounded.prompts[0].max_tokens}]`)
const nGrounded = grounded.prompts.filter((p) => p.user.includes(GROUNDING_MARKER)).length
console.log(`\nGrounding block present in ${nGrounded}/4 grounded call prompts (shared context; calls 2-4 differ only in the JSON schema instructions below it).`)

if (ungrounded) {
  banner('ASSEMBLED PROMPT, ungrounded run, call 1 of 4 (assessment)')
  console.log(ungrounded.prompts[0].user)
  const nUngrounded = ungrounded.prompts.filter((p) => p.user.includes(GROUNDING_MARKER)).length
  console.log(`\nGrounding block present in ${nUngrounded}/4 ungrounded call prompts (expected 0).`)

  // ── (b) Equivalence: grounded prompt minus block === ungrounded prompt ────
  const blockStart = grounded.prompts[0].user.indexOf('\n\n═══ ' + GROUNDING_MARKER)
  const blockEnd = grounded.prompts[0].user.indexOf('\n\nReturn ONLY this JSON', blockStart)
  const stripped =
    grounded.prompts[0].user.slice(0, blockStart) + grounded.prompts[0].user.slice(blockEnd)
  const identical = stripped === ungrounded.prompts[0].user
  console.log(
    `\nEquivalence check (grounded prompt minus block === ungrounded prompt): ${identical ? 'PASS' : 'FAIL'}`
  )
}

// ── (c) Full reports + side-by-side of the grounding-sensitive sections ─────
banner('FULL GROUNDED REPORT (json)')
console.log(JSON.stringify(grounded.report, null, 2))

if (ungrounded) {
  banner('FULL UNGROUNDED REPORT (json)')
  console.log(JSON.stringify(ungrounded.report, null, 2))

  const W = 58
  const wrap = (s) => {
    const words = String(s ?? '').split(/\s+/), lines = ['']
    for (const w of words) {
      if ((lines[lines.length - 1] + ' ' + w).trim().length > W) lines.push(w)
      else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim()
    }
    return lines
  }
  const sideBySide = (label, a, b) => {
    console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 2 * W + 5 - label.length - 4))}`)
    console.log('GROUNDED'.padEnd(W + 3) + '| UNGROUNDED')
    const la = wrap(a), lb = wrap(b)
    for (let i = 0; i < Math.max(la.length, lb.length); i++) {
      console.log((la[i] ?? '').padEnd(W + 3) + '| ' + (lb[i] ?? ''))
    }
  }

  banner('SIDE BY SIDE, sections the grounding is meant to sharpen')
  const g = grounded.report, u = ungrounded.report
  sideBySide('petition_readiness.niw_benchmark', g.petition_readiness?.niw_benchmark, u.petition_readiness?.niw_benchmark)
  sideBySide('petition_readiness.eb1a_assessment', g.petition_readiness?.eb1a_assessment, u.petition_readiness?.eb1a_assessment)
  const maxRisks = Math.max(g.rfe_risks?.length ?? 0, u.rfe_risks?.length ?? 0)
  for (let i = 0; i < maxRisks; i++) {
    const gr = g.rfe_risks?.[i], ur = u.rfe_risks?.[i]
    sideBySide(
      `rfe_risks[${i}]`,
      gr ? `[${gr.likelihood}] ${gr.likely_objection} STRATEGY: ${gr.preemptive_strategy}` : '(none)',
      ur ? `[${ur.likelihood}] ${ur.likely_objection} STRATEGY: ${ur.preemptive_strategy}` : '(none)'
    )
  }
}

banner('DONE')
console.log('No Stripe was imported, no payment occurred, no database rows were written.')
console.log('Judge: does the grounded report cite the AAO patterns usefully (RFE risks,')
console.log('evidence priorities) without quoting raw stats as approval odds?')
