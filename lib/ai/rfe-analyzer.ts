import Anthropic from '@anthropic-ai/sdk'
import type { RFEReport, RFEPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

const PETITION_LABELS: Record<string, string> = {
  eb1a:    'EB-1A — Extraordinary Ability',
  eb2niw:  'EB-2 NIW — National Interest Waiver',
  eb1b:    'EB-1B — Outstanding Researcher/Professor',
  o1:      'O-1A/O-1B — Temporary Extraordinary Ability',
  eb2perm: 'EB-2/EB-3 — PERM Labor Certification',
  h1b:     'H-1B — Specialty Occupation',
  other:   'Other petition type',
}

const FIELD_LABELS: Record<string, string> = {
  stem:      'STEM (Science, Technology, Engineering, Math)',
  medicine:  'Medicine / Healthcare / Clinical Research',
  business:  'Business / Finance / Economics',
  arts:      'Arts / Film / Design / Music / Architecture',
  sports:    'Athletics / Sports',
  law:       'Law / Policy / Government',
  education: 'Education / Social Sciences',
  other:     'Other field',
}

const PETITION_CRITERIA: Record<string, string> = {
  eb1a: `EB-1A requires meeting ≥3 of 10 criteria (8 CFR 204.5(h)(3)):
(i) Awards  (ii) Elite memberships  (iii) Media coverage  (iv) Judging
(v) Original contributions  (vi) Scholarly articles  (vii) Artistic display
(viii) Critical/leading role  (ix) High salary  (x) Commercial success
PLUS Kazarian final merits determination.`,
  eb2niw: `EB-2 NIW — Dhanasar three-prong test (AAO Dec. 27, 2016):
Prong 1: Substantial merit and national importance
Prong 2: Well-positioned to advance the endeavor
Prong 3: On balance, beneficial to waive job offer requirement`,
  eb1b: `EB-1B: International recognition, 3+ years research/teaching, permanent offer. At least 2 of 6 criteria (8 CFR 204.5(i)(3)).`,
  o1: `O-1A: Extraordinary ability, sustained national/international acclaim.
O-1B: Distinction in arts/film/TV.`,
  eb2perm: `PERM: Advertising requirements, prevailing wage, job duties, minimum requirements.`,
  h1b: `H-1B: Specialty occupation, degree in specific specialty, not general field.`,
  other: 'Analyze based on applicable USCIS regulatory standards.',
}

function extractJSON(text: string): string {
  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const start = cleaned.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')

  // Walk braces to find matching close — avoids lastIndexOf bug on truncated JSON
  let depth = 0
  let end = -1
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++
    else if (cleaned[i] === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  if (end === -1) {
    throw new Error(`JSON is truncated — response ended before closing brace (parsed ${cleaned.length - start} chars)`)
  }

  return cleaned.slice(start, end + 1)
}

export async function generateRFEPreview(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEPreview> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    temperature: 0,
    system: `You are an expert immigration attorney specializing in USCIS Requests for Evidence.
IMPORTANT: Return ONLY a valid JSON object. No markdown, no code fences, no explanation.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this USCIS RFE and return a preview summary.

PETITION TYPE: ${petLabel}
FIELD: ${fieldLabel}
${opts.additionalContext ? `CONTEXT: ${opts.additionalContext}\n` : ''}
LEGAL STANDARD:
${PETITION_CRITERIA[opts.petitionType ?? 'other'] ?? PETITION_CRITERIA.other}

RFE TEXT:
${rfeText.slice(0, 6000)}

Return ONLY this JSON object (no markdown, no fences):
{
  "case_type": "petition type and primary issue, e.g. EB-1A RFE — 3 criteria challenged",
  "issue_count": <integer — total number of distinct issues USCIS raised>,
  "high_risk_count": <integer — issues where USCIS explicitly found evidence insufficient or criterion unmet>,
  "teaser": "2-3 sentence plain English summary of the most critical issue — be direct and specific, name the criterion and what USCIS is challenging"
}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = JSON.parse(extractJSON(raw)) as Omit<RFEPreview, 'overall_denial_risk'>

  // Compute denial risk from counts — same formula as the full report, never AI-judged
  const fakeIssues = [
    ...Array(parsed.high_risk_count).fill({ risk_level: 'High' }),
    ...Array(Math.max(0, parsed.issue_count - parsed.high_risk_count)).fill({ risk_level: 'Medium' }),
  ]
  const overall_denial_risk = computeRFEDenialRisk(fakeIssues)

  return { ...parsed, overall_denial_risk }
}

// ─── Context builders ─────────────────────────────────────────────────────────

// Full context for triage + response-plan calls — needs the complete document
// to identify every issue and build an accurate timeline.
// 25,000 chars ≈ 6,250 tokens input per call (only 2 calls use this).
function rfeContext(
  rfeText: string,
  petLabel: string,
  fieldLabel: string,
  criteria: string,
  additionalContext?: string,
): string {
  return `PETITION TYPE: ${petLabel}
FIELD: ${fieldLabel}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n` : ''}LEGAL STANDARD:
${criteria}

RFE DOCUMENT (first 25000 chars):
${rfeText.slice(0, 25000)}`
}

// Compact context for per-issue calls — issues are already identified by triage.
// Each call only needs enough RFE text to cite specific USCIS language in the rebuttal.
// 8,000 chars ≈ 2,000 tokens → keeps each call under 2,800 tokens total input.
// At CONCURRENCY=5: 5 × 2,800 = 14,000 tokens/round — well under 30k/min limit.
function issueContext(
  rfeText: string,
  petLabel: string,
  fieldLabel: string,
  criteria: string,
  triage: RFETriage,
  additionalContext?: string,
): string {
  const issueList = triage.issues
    .map(i => `  ${i.number}. ${i.title} (${i.risk_level} risk)`)
    .join('\n')

  return `PETITION TYPE: ${petLabel}
FIELD: ${fieldLabel}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n` : ''}LEGAL STANDARD:
${criteria}

TRIAGE SUMMARY (${triage.issues.length} issues identified):
${issueList}

RFE DOCUMENT EXCERPT (first 8000 chars — sufficient for issue-level analysis):
${rfeText.slice(0, 8000)}`
}

// ─── Call 1: Triage ────────────────────────────────────────────────────────────
// Reads the full RFE, identifies every issue, overall denial risk, and priority actions.
// Bounded ~800 tokens — always completes regardless of RFE complexity.

interface RFETriage {
  case_type: string
  overall_assessment: string
  response_deadline_note: string
  issues: { number: number; title: string; risk_level: 'High' | 'Medium' | 'Low' }[]
  priority_action_list: string[]
}

// Compute denial risk algorithmically from actual issue data — never ask the AI
// to make this call, because it produces inconsistent editorial judgments.
//
// Logic (applies to all petition types):
//   High   — 3+ High-risk issues, OR >50% of all issues are High
//   Low    — zero High-risk issues AND ≤1 Medium
//   Medium — everything else
//
// For EB-1A specifically, 3+ High issues almost certainly means the petitioner
// cannot clear the 3-of-10 criteria threshold, making denial near-certain without
// a strong response — so "High" is the correct signal.
export function computeRFEDenialRisk(
  issues: { risk_level: string }[],
): 'High' | 'Medium' | 'Low' {
  const total = issues.length
  if (total === 0) return 'Medium'
  const highCount = issues.filter(i => i.risk_level === 'High').length
  const medCount  = issues.filter(i => i.risk_level === 'Medium').length
  if (highCount >= 3 || highCount / total > 0.5) return 'High'
  if (highCount === 0 && medCount <= 1)           return 'Low'
  return 'Medium'
}

async function callTriage(ctx: string): Promise<RFETriage> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0,
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`,
    messages: [{
      role: 'user',
      content: `${ctx}

Read the RFE carefully. Identify EVERY distinct issue USCIS raised — do not miss any.

For each issue, classify risk_level using ONLY these definitions — do not deviate:
  High   = USCIS explicitly states the evidence is insufficient or the criterion is not met;
           OR the evidentiary gap is fundamental (e.g. no qualifying evidence submitted at all)
  Medium = USCIS has concerns but some evidence was submitted; gap is fillable with supplemental docs
  Low    = Minor documentation deficiency; straightforward to cure with a single letter or document

Return ONLY this JSON:
{
  "case_type": "e.g. EB-2 NIW National Interest Waiver — 5 issues identified",
  "overall_assessment": "2-3 sentence honest assessment. What did USCIS find most deficient? What is the realistic outcome if properly responded to vs. not responded to?",
  "response_deadline_note": "USCIS RFEs allow 87 days to respond from the date of the notice. Identify the RFE issue date from the document if visible and calculate the exact deadline. If not visible, state: 'Count 87 days from the date printed on your RFE notice.'",
  "issues": [
    { "number": 1, "title": "5-8 word descriptive title of the specific USCIS objection", "risk_level": "High | Medium | Low" }
  ],
  "priority_action_list": [
    "Most urgent specific action — name exactly what to do and why",
    "Second priority action",
    "Third priority action",
    "Fourth if applicable",
    "Fifth if applicable"
  ]
}`,
    }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as RFETriage
  } catch (e) {
    console.error('[rfe/triage] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`RFE triage failed (stop_reason: ${res.stop_reason}): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Call 2: Deep analysis per issue ──────────────────────────────────────────
// Produces the full per-issue analysis including draft rebuttal language.
// Runs in parallel with Call 3.

interface RFEDeepAnalysis {
  issue_registry: import('@/lib/types').RFEIssue[]
}

// ─── Call 2: Deep analysis — one call per issue, rate-limit-safe ──────────────
// Uses compact issueContext (~2,800 tokens input) instead of the full 25k-char
// context, so 5 parallel calls = ~14,000 tokens/round — under the 30k/min limit.
// Output capped at 1500 tokens (one issue cannot exceed this), so no truncation.

async function callSingleIssue(
  ctx: string,
  issue: RFETriage['issues'][number],
  totalIssues: number,
): Promise<import('@/lib/types').RFEIssue> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,   // One issue with all rich fields = ~800-1200 tokens — well within limit
    temperature: 0,
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY a single valid JSON object. No markdown, no code fences, no text outside the JSON.`,
    messages: [{
      role: 'user',
      content: `${ctx}

This RFE has ${totalIssues} total issues. Analyse ONLY this one issue:
Issue ${issue.number}: "${issue.title}" — Risk level: ${issue.risk_level}

The most important field is "draft_rebuttal_paragraph" — actual petition response language
the petitioner can hand to their attorney or use directly. It should read like a real RFE response
brief: formal, specific, citing evidence by exhibit number (e.g. "See Exhibit ___"),
directly addressing the USCIS objection and explaining why the evidence satisfies the legal standard.
Write 3-5 sentences of professional legal writing grounded in the specific RFE text above.

Return ONLY this JSON object:
{
  "number": ${issue.number},
  "title": "${issue.title}",
  "uscis_citation": "The exact regulation, legal standard, or AAO precedent USCIS is invoking for THIS issue — e.g. '8 CFR 204.5(h)(3)(v) — original contributions of major significance' or 'Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016), Prong 2'",
  "plain_english": "What USCIS is really saying in plain language — translate the legalese, 2-4 sentences. Start with 'USCIS is saying that...'",
  "denial_risk_if_unaddressed": "1-2 sentences: what specifically happens to this petition if this exact issue is not addressed",
  "evidence_gaps": [
    "Specific document or evidence USCIS wants for this issue — be precise about format and source",
    "Second specific item if applicable"
  ],
  "specific_documents": [
    "Exact document to obtain or create — name the source, who must sign it, what it must state",
    "Second document with full specifics"
  ],
  "draft_rebuttal_paragraph": "3-5 sentences of ready-to-use RFE response language for this specific issue. Professional legal tone. Cite the applicable standard, reference evidence by type (e.g. 'the expert declaration of [Name], submitted as Exhibit ___'), and explain directly why the evidence satisfies the criterion.",
  "risk_level": "${issue.risk_level}",
  "response_strategy": "Rebut | Supplement | Narrow",
  "strategy_rationale": "Why this specific strategy for this issue, and the 2-3 most important execution steps"
}`,
    }],
  })

  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as import('@/lib/types').RFEIssue
  } catch (e) {
    console.error(`[rfe/issue-${issue.number}] parse fail. stop_reason:`, res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`RFE issue ${issue.number} analysis failed (stop_reason: ${res.stop_reason}): ${e instanceof Error ? e.message : e}`)
  }
}

// Concurrency runner — processes items in rounds of `concurrency` at a time.
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<import('@/lib/types').RFEIssue>,
): Promise<import('@/lib/types').RFEIssue[]> {
  const results: import('@/lib/types').RFEIssue[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

async function callDeepAnalysis(
  _fullCtx: string,
  triage: RFETriage,
  compactCtx: string,
): Promise<RFEDeepAnalysis> {
  const issues = triage.issues
  // Compact context ≈ 2,800 tokens/call × 5 concurrent = ~14,000 tokens/round
  // → safely under the 30,000 input TPM limit with headroom to spare.
  // EB-1A with 10 issues: 2 rounds (5+5) instead of the old 4 rounds (3+3+3+1).
  const CONCURRENCY = 5
  console.log(`[rfe/deep] ${issues.length} issues — ${CONCURRENCY} concurrent (compact context ~2800 tok/call)`)

  const issueResults = await runWithConcurrency(
    issues,
    CONCURRENCY,
    issue => callSingleIssue(compactCtx, issue, issues.length),
  )

  // Return in original triage order
  const sorted = [...issueResults].sort((a, b) => a.number - b.number)
  console.log(`[rfe/deep] All ${sorted.length} issues complete`)

  return { issue_registry: sorted }
}

// ─── Call 3: Response plan ────────────────────────────────────────────────────
// Produces the week-by-week timeline, cover letter outline, and attorney briefing.
// Runs in PARALLEL with Call 2 (both only need triage + context as input).

interface RFEResponsePlan {
  response_timeline: import('@/lib/types').RFEResponseWeek[]
  cover_letter_outline: string[]
  attorney_briefing: string
}

async function callResponsePlan(ctx: string, triage: RFETriage): Promise<RFEResponsePlan> {
  const issueList = triage.issues.map(i => `${i.number}. ${i.title} (${i.risk_level} risk)`).join('\n')

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 5000,
    temperature: 0,
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`,
    messages: [{
      role: 'user',
      content: `${ctx}

The RFE has ${triage.issues.length} issues:
${issueList}

${triage.response_deadline_note}

Produce the response plan.

Return ONLY this JSON:
{
  "response_timeline": [
    {
      "week": "Week 1 (Days 1–7) — Immediate triage",
      "actions": [
        "Specific action — what exactly to do, who to contact, what to request",
        "Another specific action",
        "Third action if applicable"
      ]
    },
    { "week": "Week 2–3 (Days 8–21) — Evidence gathering", "actions": ["..."] },
    { "week": "Week 4–6 (Days 22–42) — Drafting and expert coordination", "actions": ["..."] },
    { "week": "Week 7–9 (Days 43–63) — Review and supplementation", "actions": ["..."] },
    { "week": "Week 10–12 (Days 64–87) — Final assembly and filing", "actions": ["..."] }
  ],
  "cover_letter_outline": [
    "Section 1: Opening — State case number, beneficiary name, petition type, date of RFE, and that this is a timely response",
    "Section 2: Overview of response — summarize the ${triage.issues.length} issues and state that each is fully addressed below",
    "Section 3: Issue-by-issue response — one subsection per USCIS issue, in order",
    "Section 4: Conclusion — restate why petitioner meets the legal standard and request approval",
    "Exhibit list — number and label every exhibit in the order referenced in the letter"
  ],
  "attorney_briefing": "A ready-to-send 4-6 sentence paragraph to email to an immigration attorney. Include: petition type, number of RFE issues, overall risk level, the 2 most critical issues, what evidence has already been gathered vs. what is missing, desired timeline, and a clear ask for representation or a paid strategy consultation."
}`,
    }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as RFEResponsePlan
  } catch (e) {
    console.error('[rfe/plan] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`RFE response plan failed (stop_reason: ${res.stop_reason}): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Public: generate full RFE report (triage → deep + plan in parallel) ────

export async function generateRFEReport(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEReport> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'
  const criteria = PETITION_CRITERIA[opts.petitionType ?? 'other'] ?? PETITION_CRITERIA.other

  // Full context (25k chars) — used only by triage and response-plan (2 calls total)
  const fullCtx = rfeContext(rfeText, petLabel, fieldLabel, criteria, opts.additionalContext)

  // Call 1: Triage — must complete first; needs full document to find every issue
  console.log('[rfe-analyzer] Starting triage')
  const triage = await callTriage(fullCtx)
  console.log(`[rfe-analyzer] Triage complete — ${triage.issues.length} issues: ${triage.case_type}`)

  // Compact context (8k chars + triage summary) — used by per-issue calls only.
  // ~2,800 tokens/call vs 6,750 with full context → 5 concurrent calls = ~14k tokens/round.
  const compactCtx = issueContext(rfeText, petLabel, fieldLabel, criteria, triage, opts.additionalContext)

  // Calls 2 + 3: Run in parallel — deep analysis uses compact context, plan uses full
  console.log('[rfe-analyzer] Starting deep analysis + response plan in parallel')
  const [deep, plan] = await Promise.all([
    callDeepAnalysis(fullCtx, triage, compactCtx),
    callResponsePlan(fullCtx, triage),
  ])
  console.log(`[rfe-analyzer] Complete — ${deep.issue_registry.length} issues fully analyzed`)

  // Compute denial risk from actual issue data — never trust the AI to do this consistently
  const overall_denial_risk = computeRFEDenialRisk(deep.issue_registry)

  return {
    case_type: triage.case_type,
    overall_denial_risk,
    overall_assessment: triage.overall_assessment,
    response_deadline_note: triage.response_deadline_note,
    issue_registry: deep.issue_registry,
    response_timeline: plan.response_timeline,
    cover_letter_outline: plan.cover_letter_outline,
    attorney_briefing: plan.attorney_briefing,
    priority_action_list: triage.priority_action_list,
    disclaimer: 'This analysis is a strategic planning tool and does not constitute legal advice. Work with a licensed immigration attorney to prepare your RFE response.',
  }
}
