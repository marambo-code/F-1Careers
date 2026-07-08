// scripts/precedent.test.mjs
// Regression guard for the Precedent Engine. Run with:
//
//   node --test scripts/precedent.test.mjs
//
// Self-contained: no network, no env vars, no test framework. It transpiles
// lib/precedent/{labels,queries}.ts with the repo's own `typescript` package,
// swaps @supabase/supabase-js for an in-memory mock, and guards the two
// regressions most likely to recur:
//
//   (a) getPrecedentSummary must never return undefined hardestRequirement /
//       topRequirements for either pathway (and getPrecedentData must throw,
//       not return garbage, when the views come back empty).
//   (b) The precedent_failtags view must exclude met=true rows — asserted
//       against the SQL of both migrations 0005 and 0006, which also must
//       revoke write privileges before granting SELECT.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const ts = require('typescript')

// ── build the module under test with a mocked supabase client ──────

const outDir = mkdtempSync(join(tmpdir(), 'precedent-test-'))

function transpile(relPath) {
  const src = readFileSync(join(root, relPath), 'utf8')
  return ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
}

writeFileSync(join(outDir, 'labels.mjs'), transpile('lib/precedent/labels.ts'))
writeFileSync(
  join(outDir, 'queries.mjs'),
  transpile('lib/precedent/queries.ts')
    .replace(`'@supabase/supabase-js'`, `'./supabase-mock.mjs'`)
    .replace(`'./labels'`, `'./labels.mjs'`)
)

// Mock shaped after the exact call patterns in queries.ts:
//   .from(v).select('*').single()  /  .from(v).select('*')  /  ....limit(n)
// Set globalThis.__PRECEDENT_EMPTY = true to simulate empty/missing views.
// Every query increments globalThis.__MOCK_CALLS (lets tests assert the
// grounding flag-off path performs zero corpus I/O).
const supabaseMockSrc = `const FIXTURES = {
  precedent_corpus: [{ decisions: 3992, findings: 12000 }],
  precedent_outcome_rates: [
    { category: 'EB1A', outcome: 'dismissed', n: 900 },
    { category: 'EB1A', outcome: 'sustained', n: 40 },
    { category: 'EB1A', outcome: 'remanded', n: 60 },
    { category: 'NIW', outcome: 'dismissed', n: 2500 },
    { category: 'NIW', outcome: 'sustained', n: 300 },
    { category: 'NIW', outcome: 'remanded', n: 190 },
  ],
  precedent_criteria: [
    { criterion: 'judging', met_true: 400, met_false: 100 },
    { criterion: 'awards', met_true: 120, met_false: 500 },
    { criterion: 'original_contributions', met_true: 50, met_false: 900 },
    { criterion: 'high_salary', met_true: 90, met_false: 300 },
  ],
  precedent_prongs: [
    { criterion: 'dhanasar_prong_1', met_true: 800, met_false: 200 },
    { criterion: 'dhanasar_prong_2', met_true: 400, met_false: 600 },
    { criterion: 'dhanasar_prong_3', met_true: 350, met_false: 650 },
  ],
  precedent_failtags: [
    { failure_tag: 'contribution_not_major_significance', n: 400 },
    { failure_tag: 'role_not_leading', n: 150 },
    { failure_tag: 'salary_not_comparative', n: 90 },
    { failure_tag: 'media_not_major', n: 60 },
    { failure_tag: 'other', n: 500 },
  ],
  precedent_field_counts: [
    { category: 'EB1A', field_of_endeavor: 'business', n: 300 },
    { category: 'NIW', field_of_endeavor: 'computer_science', n: 700 },
  ],
  precedent_cases: [
    { decision_id: 'd1', decision_date: '2025-05-01', category: 'EB1A',
      field_of_endeavor: 'business', rfe_issued: true, source_file: 'MAY012025_01B2203' },
  ],
}

function result(view) {
  globalThis.__MOCK_CALLS = (globalThis.__MOCK_CALLS ?? 0) + 1
  const empty = globalThis.__PRECEDENT_EMPTY === true
  const noCorpus = globalThis.__PRECEDENT_NO_CORPUS === true && view === 'precedent_corpus'
  const rows = empty || noCorpus ? [] : FIXTURES[view] ?? []
  const p = Promise.resolve({ data: rows, error: empty ? { message: 'mock: view empty' } : null })
  return {
    then: (...a) => p.then(...a),
    single: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    limit: () => Promise.resolve({ data: rows, error: null }),
  }
}

export function createClient() {
  return { from: (view) => ({ select: () => result(view) }) }
}
`

writeFileSync(join(outDir, 'supabase-mock.mjs'), supabaseMockSrc)

const queriesUrl = pathToFileURL(join(outDir, 'queries.mjs')).href
const { getPrecedentSummary } = await import(queriesUrl)

// ── (a) summary shape can never regress to undefined ───────────────

function assertRequirement(r, ctx) {
  assert.ok(r, `${ctx} is undefined`)
  assert.equal(typeof r.key, 'string', `${ctx}.key`)
  assert.equal(typeof r.label, 'string', `${ctx}.label`)
  assert.ok(Number.isFinite(r.metRate), `${ctx}.metRate`)
  assert.ok(r.metRate >= 0 && r.metRate <= 1, `${ctx}.metRate in [0,1]`)
  assert.ok(Number.isFinite(r.decided), `${ctx}.decided`)
}

for (const [input, expected] of [
  ['EB1A', 'EB1A'],
  ['EB-1A', 'EB1A'],
  ['NIW', 'NIW'],
  ['anything-else-defaults-to-niw', 'NIW'],
]) {
  test(`getPrecedentSummary(${JSON.stringify(input)}) returns defined requirements`, async () => {
    const s = await getPrecedentSummary(input, 'software engineering')
    assert.equal(s.pathway, expected)
    assert.ok(Array.isArray(s.topRequirements), 'topRequirements is an array')
    assert.equal(s.topRequirements.length, 3, 'topRequirements has 3 entries')
    s.topRequirements.forEach((r, i) => assertRequirement(r, `topRequirements[${i}]`))
    assertRequirement(s.hardestRequirement, 'hardestRequirement')
    // hardest must actually be the lowest met-rate of the pathway's set
    const min = Math.min(...s.topRequirements.map((r) => r.metRate), s.hardestRequirement.metRate)
    assert.equal(s.hardestRequirement.metRate, min, 'hardestRequirement has the lowest metRate')
    assert.ok(s.outcomes && Number.isFinite(s.outcomes.total), 'outcomes present')
    assert.ok(s.topFailures.length > 0 && s.topFailures.every((f) => f.key !== 'other'),
      'topFailures present and generic "other" excluded')

    // Denial-bias guardrails: the honest NIW display metric (contest shares)
    // must always ship with the summary so surfaces never fall back to
    // rendering prong met-rates (a denial-corpus artifact) as odds.
    assert.ok(Array.isArray(s.prongShares) && s.prongShares.length === 3, 'prongShares has 3 prongs')
    const shareSum = s.prongShares.reduce((t, p) => t + p.share, 0)
    assert.ok(Math.abs(shareSum - 1) < 1e-9, 'prong shares sum to 1')
    for (let i = 1; i < s.prongShares.length; i++) {
      assert.ok(s.prongShares[i - 1].share >= s.prongShares[i].share, 'prongShares sorted desc')
    }
    assert.ok(s.corpus && s.corpus.decisions > 0 && s.corpus.findings > 0, 'corpus totals present')
  })
}

test('corpus view failure degrades to derived totals, never zero', async () => {
  globalThis.__PRECEDENT_NO_CORPUS = true
  try {
    const fresh = await import(queriesUrl + '?variant=nocorpus')
    const s = await fresh.getPrecedentSummary('EB1A')
    // 900+40+60 EB1A + 2500+300+190 NIW appeal outcomes in the fixtures
    assert.equal(s.corpus.decisions, 3990, 'decisions derived from outcome totals')
    assert.ok(s.corpus.findings > 0, 'findings derived from decided counts')
  } finally {
    globalThis.__PRECEDENT_NO_CORPUS = false
  }
})

// The callout components must never lead with denial rates or render NIW
// prong met-rates. Source-level guard: cheap, but catches the exact copy
// regressions the founder is worried about.
for (const file of [
  'components/precedent/PrecedentCallout.tsx',
  'components/precedent/PrecedentCalloutClient.tsx',
]) {
  test(`${file}: framing guardrails hold`, () => {
    const src = readFileSync(join(root, file), 'utf8')
    assert.ok(!/Denials upheld/i.test(src), 'must not lead with "Denials upheld"')
    assert.ok(src.includes('prongShares'), 'must use contest shares for NIW display')
    assert.ok(/appeals of (already-)?denied petitions/i.test(src), 'must state the selection-bias caveat')
  })
}

test('empty views make getPrecedentData throw instead of yielding undefined stats', async () => {
  globalThis.__PRECEDENT_EMPTY = true
  try {
    // Fresh module instance: bypasses both the module-level cache and the
    // already-imported copy above.
    const fresh = await import(queriesUrl + '?variant=empty')
    await assert.rejects(
      () => fresh.getPrecedentSummary('EB1A'),
      /Precedent views returned no data/,
      'expected the throw-on-empty guard to fire'
    )
  } finally {
    globalThis.__PRECEDENT_EMPTY = false
  }
})

// ── (b) migration SQL keeps failtags clean and grants read-only ────

for (const file of [
  'supabase/migrations/0005_precedent_views.sql',
  'supabase/migrations/0006_precedent_view_hardening.sql',
]) {
  test(`${file}: failtags view excludes met=true rows`, () => {
    const sql = readFileSync(join(root, file), 'utf8')
    const m = sql.match(
      /create or replace view public\.precedent_failtags as([\s\S]*?)group by failure_tag;/i
    )
    assert.ok(m, 'precedent_failtags view definition found')
    assert.match(m[1], /where\s+failure_tag is not null\s+and\s+met is false/i,
      'failtags WHERE clause must require met is false')
  })

  test(`${file}: revokes writes before granting SELECT on all 7 views`, () => {
    // Strip `--` comments so prose like "default privileges grant ALL" in a
    // comment cannot trip (or mask) the statement-level assertions below.
    const sql = readFileSync(join(root, file), 'utf8').replace(/--[^\n]*/g, '')
    const revokeAt = sql.search(/revoke all on/i)
    const grantAt = sql.search(/grant select on/i)
    assert.ok(revokeAt !== -1, 'has revoke all')
    assert.ok(grantAt !== -1, 'has grant select')
    assert.ok(revokeAt < grantAt, 'revoke must precede grant')
    assert.ok(!/grant\s+(all|insert|update|delete|truncate)/i.test(sql), 'never grants writes')
    for (const v of ['corpus', 'outcome_rates', 'criteria', 'prongs', 'failtags', 'field_counts', 'cases']) {
      const stmt = sql.slice(revokeAt)
      assert.ok(stmt.includes(`public.precedent_${v}`), `revoke/grant covers precedent_${v}`)
    }
  })
}

// ═══ (c) Prompt grounding (REC 1): off by default, never breaks paid gen ═══
//
// Builds a second, isolated copy of the queries module ('queries-g.mjs') so
// the grounding/engine tests control their own in-process cache, plus mocked
// builds of the two PAID generators with a fake Anthropic client that captures
// every prompt. The tests then prove:
//   * flag off  -> zero corpus I/O, prompts contain no grounding text
//   * flag on + failing fetch -> prompts BYTE-IDENTICAL to flag-off prompts
//   * flag on + working fetch -> block injected once, removal restores the
//     ungrounded prompt exactly; honest framing strings present; length cap
//   * flag on + hanging fetch -> falls back to '' within the timeout

writeFileSync(join(outDir, 'queries-g.mjs'), readFileSync(join(outDir, 'queries.mjs'), 'utf8'))
writeFileSync(
  join(outDir, 'grounding.mjs'),
  transpile('lib/precedent/grounding.ts')
    .replace(`'./queries'`, `'./queries-g.mjs'`)
    .replace(`'./labels'`, `'./labels.mjs'`)
)

// Hanging-fetch variant for the timeout test.
writeFileSync(
  join(outDir, 'queries-slow.mjs'),
  `export async function getPrecedentSummary() { return new Promise(() => {}) }\n`
)
writeFileSync(
  join(outDir, 'grounding-slow.mjs'),
  transpile('lib/precedent/grounding.ts')
    .replace(`'./queries'`, `'./queries-slow.mjs'`)
    .replace(`'./labels'`, `'./labels.mjs'`)
)

// Fake Anthropic SDK: captures prompts, returns canned JSON that satisfies
// both the Strategy merge and the RFE triage/plan parsers.
writeFileSync(
  join(outDir, 'anthropic-mock.mjs'),
  `const CANNED = JSON.stringify({
  case_type: 't', overall_assessment: 'a', response_deadline_note: 'd',
  issues: [], priority_action_list: [],
})
export default class Anthropic {
  constructor() {}
  messages = {
    create: async (args) => {
      ;(globalThis.__PROMPTS ??= []).push(args.messages[0].content)
      return { content: [{ type: 'text', text: CANNED }], stop_reason: 'end_turn' }
    },
  }
}
`
)

writeFileSync(
  join(outDir, 'strategy-engine.mjs'),
  transpile('lib/ai/strategy-engine.ts')
    .replace(`'@anthropic-ai/sdk'`, `'./anthropic-mock.mjs'`)
    .replace(`'@/lib/precedent/grounding'`, `'./grounding.mjs'`)
)
writeFileSync(
  join(outDir, 'rfe-analyzer.mjs'),
  transpile('lib/ai/rfe-analyzer.ts')
    .replace(`'@anthropic-ai/sdk'`, `'./anthropic-mock.mjs'`)
    .replace(`'@/lib/precedent/grounding'`, `'./grounding.mjs'`)
)

const grounding = await import(pathToFileURL(join(outDir, 'grounding.mjs')).href)
const groundingSlow = await import(pathToFileURL(join(outDir, 'grounding-slow.mjs')).href)
const strat = await import(pathToFileURL(join(outDir, 'strategy-engine.mjs')).href)
const rfe = await import(pathToFileURL(join(outDir, 'rfe-analyzer.mjs')).href)

const GROUNDING_MARKER = 'AAO PRECEDENT GROUNDING'
const SAMPLE_ANSWERS = {
  cr_awards: 2, cr_membership: 0, cr_press: 1, cr_judging: 3, cr_contributions: 2,
  cr_scholarly: 2, cr_display: 0, cr_critical_role: 3, cr_high_salary: 2, cr_commercial: 0,
  field_of_work: 'stem_cs', subfield: 'machine learning', full_name: 'Test Person',
  education_level: 'Masters', university: 'Test U', degree: 'MS', field_of_study: 'CS',
  years_in_field: 5, visa_status: 'F-1 OPT', filing_timeline: 6,
  current_role: 'ML Engineer', current_employer: 'TestCo', us_salary: '$150,000',
  employer_support: 'yes', attorney_consulted: 'no',
  niw_prong1: 3, niw_prong2: 3, niw_prong3: 2,
  work_description: 'Builds ML systems', proposed_endeavor: 'Advance ML reliability',
}
const SAMPLE_RFE = 'USCIS has reviewed the petition and finds the evidence insufficient. '.repeat(20)

async function capturePrompts(fn) {
  globalThis.__PROMPTS = []
  await fn()
  const prompts = globalThis.__PROMPTS
  globalThis.__PROMPTS = []
  return prompts
}

async function runBothGenerators() {
  await strat.generateStrategyReport(SAMPLE_ANSWERS)
  await rfe.generateRFEReport(SAMPLE_RFE, { petitionType: 'eb2niw', rfeField: 'stem' })
}

let offPrompts // captured with the flag off; the equivalence baseline

test('grounding: flag off returns "" with zero corpus queries', async () => {
  delete process.env.PRECEDENT_GROUNDING
  const before = globalThis.__MOCK_CALLS ?? 0
  const g = await grounding.getPrecedentGrounding('NIW', 'software engineering')
  assert.equal(g, '', 'flag off must be an append-safe no-op')
  assert.equal(globalThis.__MOCK_CALLS ?? 0, before, 'flag off must not query the corpus')
})

test('paid generators: flag off builds prompts with no grounding text', async () => {
  delete process.env.PRECEDENT_GROUNDING
  offPrompts = await capturePrompts(runBothGenerators)
  // 4 Strategy calls + RFE triage + RFE response plan (0 issues in canned triage)
  assert.equal(offPrompts.length, 6, 'expected 6 model calls')
  for (const p of offPrompts) {
    assert.ok(!p.includes(GROUNDING_MARKER), 'flag-off prompt must contain no grounding block')
  }
})

test('paid generators: flag on + failing grounding fetch -> prompts byte-identical to flag off', async () => {
  process.env.PRECEDENT_GROUNDING = 'on'
  globalThis.__PRECEDENT_EMPTY = true // getPrecedentSummary throws
  try {
    const prompts = await capturePrompts(runBothGenerators)
    assert.deepEqual(prompts, offPrompts, 'fallback prompts must equal the ungrounded prompts exactly')
  } finally {
    delete process.env.PRECEDENT_GROUNDING
    globalThis.__PRECEDENT_EMPTY = false
  }
})

test('grounding: flag on + failing fetch resolves to "" (never throws)', async () => {
  process.env.PRECEDENT_GROUNDING = 'on'
  globalThis.__PRECEDENT_EMPTY = true
  try {
    assert.equal(await grounding.getPrecedentGrounding('EB1A', 'software'), '')
  } finally {
    delete process.env.PRECEDENT_GROUNDING
    globalThis.__PRECEDENT_EMPTY = false
  }
})

test('grounding: flag on returns a short, honestly framed block', async () => {
  process.env.PRECEDENT_GROUNDING = 'on'
  try {
    const niw = await grounding.getPrecedentGrounding('NIW', 'machine learning')
    const eb1a = await grounding.getPrecedentGrounding('EB1A', 'machine learning')
    for (const g of [niw, eb1a]) {
      assert.ok(g.startsWith('\n\n'), 'block starts with separator so callers can append safely')
      assert.ok(g.includes(GROUNDING_MARKER), 'has the grounding header')
      assert.ok(/appeals of already-denied petitions/i.test(g), 'states the selection-bias caveat')
      assert.ok(/never approval odds/i.test(g), 'forbids approval-odds framing')
      assert.ok(g.length <= 2002, 'token-bounded (<= 2000 chars + separator)')
    }
    assert.ok(/Prong/.test(niw), 'NIW block shows prong contest shares')
    assert.ok(!/% met \(n=/.test(niw), 'NIW block never renders prong met-rates')
    assert.ok(/% met \(n=/.test(eb1a), 'EB-1A block shows criterion met-rates')
    assert.ok(/Hardest on appeal/.test(eb1a), 'EB-1A block names the hardest criterion')
    assert.ok(/failure patterns/i.test(eb1a), 'EB-1A failure patterns present')
  } finally {
    delete process.env.PRECEDENT_GROUNDING
  }
})

test('paid generators: flag on injects the block exactly once; removing it restores the ungrounded prompt', async () => {
  process.env.PRECEDENT_GROUNDING = 'on'
  try {
    const gStrategy = await grounding.getPrecedentGrounding('NIW', 'stem_cs machine learning')
    const gRfe = await grounding.getPrecedentGrounding('NIW', 'stem')
    assert.ok(gStrategy.length > 0 && gRfe.length > 0)
    const prompts = await capturePrompts(runBothGenerators)
    assert.equal(prompts.length, offPrompts.length)
    prompts.forEach((p, i) => {
      const block = i < 4 ? gStrategy : gRfe
      assert.equal(p.split(GROUNDING_MARKER).length, 2, `prompt ${i} contains the block exactly once`)
      assert.equal(p.replace(block, ''), offPrompts[i], `prompt ${i} minus block equals the ungrounded prompt`)
    })

    // Petition types outside the corpus (e.g. H-1B) must stay ungrounded even
    // with the flag on.
    const h1b = await capturePrompts(() => rfe.generateRFEReport(SAMPLE_RFE, { petitionType: 'h1b' }))
    for (const p of h1b) assert.ok(!p.includes(GROUNDING_MARKER), 'h1b prompts stay ungrounded')
  } finally {
    delete process.env.PRECEDENT_GROUNDING
  }
})

test('grounding: hanging fetch falls back to "" within the timeout', async () => {
  process.env.PRECEDENT_GROUNDING = 'on'
  try {
    const t0 = Date.now()
    const g = await groundingSlow.getPrecedentGrounding('NIW', 'software', { timeoutMs: 50 })
    assert.equal(g, '', 'timeout must fall back to the ungrounded prompt')
    assert.ok(Date.now() - t0 < 1500, 'must resolve promptly, never block the paid report')
  } finally {
    delete process.env.PRECEDENT_GROUNDING
  }
})

test('grounding: formatGroundingBlock enforces the hard length cap', async () => {
  const huge = 'x'.repeat(5000)
  const block = grounding.formatGroundingBlock({
    pathway: 'EB1A',
    field: 'business',
    fieldDecisions: 300,
    corpus: { decisions: 3992, findings: 11373 },
    outcomes: { dismissed: 1, remanded: 1, sustained: 1, total: 3 },
    topRequirements: [{ key: 'a', label: huge, metRate: 0.5, decided: 10 }],
    hardestRequirement: { key: 'b', label: huge, metRate: 0.1, decided: 10 },
    topFailures: [{ key: 'c', label: huge, count: 5 }],
    prongShares: [],
  })
  assert.ok(block.length <= 2000, 'hard cap holds even with pathological labels')
})

// ═══ (d) REC 4: /precedent-engine stays gated unless the single switch is on ═══

test('middleware: /precedent-engine gated by default; public only via PRECEDENT_ENGINE_PUBLIC=on', () => {
  const src = readFileSync(join(root, 'middleware.ts'), 'utf8')
  const m = src.match(/const protectedPaths = \[([^\]]*)\]/)
  assert.ok(m, 'protectedPaths array found')
  assert.ok(m[1].includes(`'/precedent-engine'`), '/precedent-engine remains in the protected list')
  assert.match(src, /process\.env\.PRECEDENT_ENGINE_PUBLIC === 'on'/, 'exact-match single switch')
  assert.match(
    src,
    /filter\(p => !\(precedentEnginePublic && p === '\/precedent-engine'\)\)/,
    'the toggle can only ever remove /precedent-engine, nothing else'
  )
})

// ═══ (e) REC 2/3 factory scripts: safety pattern + taxonomy/label sync ═══

for (const file of ['scripts/precedent-prong-reextract.mjs', 'scripts/precedent-failtag-retag.mjs']) {
  test(`${file}: dry-run default, outcomes_graph scope, snapshots originals`, () => {
    const src = readFileSync(join(root, file), 'utf8')
    assert.ok(src.includes(`process.argv.includes('--apply')`), 'writes gated behind --apply')
    assert.ok(src.includes(`db: { schema: 'outcomes_graph' }`), 'service client scoped to outcomes_graph')
    assert.ok(src.includes('failure_tag_raw'), 'references the failure_tag_raw snapshot column')
    assert.ok(!/\.delete\(|\.insert\(|\.upsert\(|truncate/i.test(src), 'update-only, no destructive ops')
  })
}

test('prong re-extraction only ever flips met toward true', () => {
  const src = readFileSync(join(root, 'scripts/precedent-prong-reextract.mjs'), 'utf8')
  assert.ok(src.includes('{ met: true, failure_tag: null }'), 'writes met: true')
  assert.ok(!/met:\s*false/.test(src), 'never writes met: false')
  assert.ok(src.includes('met_raw'), 'snapshots met_raw')
})

test('failtag re-taxonomy never touches met and only targets met=false rows', () => {
  const src = readFileSync(join(root, 'scripts/precedent-failtag-retag.mjs'), 'utf8')
  assert.ok(src.includes(`.eq('met', false)`), 'scoped to met=false rows')
  const patches = [...src.matchAll(/const patch = \{([^}]*)\}/g)].map((m) => m[1])
  assert.ok(patches.length > 0, 'found the update patch')
  for (const p of patches) assert.ok(!/\bmet\b/.test(p), 'patch must never include met')
})

test('every tag in the retag taxonomy has a display label in FAILTAG_LABELS', async () => {
  const src = readFileSync(join(root, 'scripts/precedent-failtag-retag.mjs'), 'utf8')
  const block = src.split('// BEGIN TAG SET')[1]?.split('// END TAG SET')[0]
  assert.ok(block, 'TAG SET markers present')
  const tags = [...new Set([...block.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]))]
  assert.ok(tags.length >= 15, `expected an expanded taxonomy, got ${tags.length} tags`)
  assert.ok(tags.some((t) => t.startsWith('niw_')), 'includes NIW-specific tags')
  const { FAILTAG_LABELS } = await import(pathToFileURL(join(outDir, 'labels.mjs')).href)
  for (const t of tags) assert.ok(FAILTAG_LABELS[t], `missing FAILTAG_LABELS entry for tag "${t}"`)
})
