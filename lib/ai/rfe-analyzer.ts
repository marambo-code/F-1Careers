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
  "issue_count": <number>,
  "high_risk_count": <number>,
  "teaser": "2-3 sentence plain English summary of the most critical issue"
}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(extractJSON(raw)) as RFEPreview
}

// ─── RFE shared context block ─────────────────────────────────────────────────

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

// ─── Call 1: Triage ────────────────────────────────────────────────────────────
// Reads the full RFE, identifies every issue, overall denial risk, and priority actions.
// Bounded ~800 tokens — always completes regardless of RFE complexity.

interface RFETriage {
  case_type: string
  overall_denial_risk: 'High' | 'Medium' | 'Low'
  overall_assessment: string
  response_deadline_note: string
  issues: { number: number; title: string; risk_level: 'High' | 'Medium' | 'Low' }[]
  priority_action_list: string[]
}

async function callTriage(ctx: string): Promise<RFETriage> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`,
    messages: [{
      role: 'user',
      content: `${ctx}

Read the RFE carefully. Identify EVERY distinct issue USCIS raised — do not miss any.

Return ONLY this JSON:
{
  "case_type": "e.g. EB-2 NIW National Interest Waiver — 5 issues identified",
  "overall_denial_risk": "High | Medium | Low",
  "overall_assessment": "2-3 sentence honest assessment of the case. How serious is this RFE? What is the realistic outcome if properly responded to vs. ignored?",
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

// Analyses a specific slice of issues — reusable for both single and split-call paths
async function callDeepAnalysisBatch(
  ctx: string,
  allIssues: RFETriage['issues'],
  batchIssues: RFETriage['issues'],
  batchLabel: string,
): Promise<RFEDeepAnalysis> {
  const batchCount = batchIssues.length
  // 900 tokens per issue, floor 2500, ceiling 7500 (leave headroom under 8096 hard limit)
  const maxTokens = Math.min(7500, Math.max(2500, batchCount * 900))

  const issueList = batchIssues
    .map(i => `  ${i.number}. "${i.title}" — Risk: ${i.risk_level}`)
    .join('\n')

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.
You MUST produce a complete valid JSON object — close ALL braces and arrays before stopping.`,
    messages: [{
      role: 'user',
      content: `${ctx}

This RFE has ${allIssues.length} total issues. You are analysing batch ${batchLabel} — the following ${batchCount} issue(s):
${issueList}

For EACH of these ${batchCount} issues, produce a complete analysis.

The most important field is "draft_rebuttal_paragraph" — this is actual petition response language
the petitioner can hand to their attorney or use directly. It should read like a real RFE response
brief: formal, specific, citing evidence by exhibit number where appropriate (e.g. "See Exhibit ___"),
directly addressing the USCIS objection and explaining why the evidence satisfies the legal standard.
Make it 3-5 sentences of professional legal writing.

Return ONLY this JSON (issue_registry must have exactly ${batchCount} entries):
{
  "issue_registry": [
    {
      "number": <matches issue number above>,
      "title": "<exact title from the list above>",
      "uscis_citation": "The specific regulation, legal standard, or AAO decision USCIS is invoking — e.g. '8 CFR 204.5(h)(3)(v) — original contributions of major significance' or 'Matter of Dhanasar, Prong 1'",
      "plain_english": "What USCIS is really saying in plain language — translate the legalese, 2-4 sentences. Start with 'USCIS is saying that...'",
      "denial_risk_if_unaddressed": "1-2 sentences: what specifically happens to this petition if this issue is not addressed in the response",
      "evidence_gaps": ["Specific document or evidence USCIS wants — be precise", "Another specific item"],
      "specific_documents": ["Exact document to obtain or create — name the source and what it must contain", "Another document with specifics"],
      "draft_rebuttal_paragraph": "3-5 sentences of ready-to-use RFE response language addressing this specific issue. Professional legal tone. Reference specific evidence by type (e.g., 'the supplemental expert declaration of Dr. X, submitted herewith as Exhibit ___'). Directly rebut the USCIS objection by citing the applicable legal standard and explaining how the evidence satisfies it.",
      "risk_level": "<matches risk_level from the list above>",
      "response_strategy": "Rebut | Supplement | Narrow",
      "strategy_rationale": "Why this strategy, and the 2-3 most important execution steps specific to this issue"
    }
  ]
}`,
    }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as RFEDeepAnalysis
  } catch (e) {
    console.error(`[rfe/deep-${batchLabel}] parse fail. stop_reason:`, res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`RFE deep analysis failed (stop_reason: ${res.stop_reason}): ${e instanceof Error ? e.message : e}`)
  }
}

async function callDeepAnalysis(ctx: string, triage: RFETriage): Promise<RFEDeepAnalysis> {
  const issues = triage.issues

  // For ≤5 issues: single call (fast path)
  // For 6+ issues: split into two parallel calls to stay under the 8096-token output limit
  // Each batch handles ~half the issues, comfortably within 7500-token ceiling
  if (issues.length <= 5) {
    return callDeepAnalysisBatch(ctx, issues, issues, '1/1')
  }

  const mid = Math.ceil(issues.length / 2)
  const batchA = issues.slice(0, mid)
  const batchB = issues.slice(mid)

  console.log(`[rfe/deep] ${issues.length} issues — splitting into 2 parallel batches (${batchA.length} + ${batchB.length})`)

  const [resA, resB] = await Promise.all([
    callDeepAnalysisBatch(ctx, issues, batchA, `1/2 (issues ${batchA[0].number}–${batchA[batchA.length - 1].number})`),
    callDeepAnalysisBatch(ctx, issues, batchB, `2/2 (issues ${batchB[0].number}–${batchB[batchB.length - 1].number})`),
  ])

  return {
    issue_registry: [...resA.issue_registry, ...resB.issue_registry],
  }
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
    system: `You are a senior immigration attorney with 20+ years handling USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`,
    messages: [{
      role: 'user',
      content: `${ctx}

The RFE has ${triage.issues.length} issues:
${issueList}

Overall denial risk: ${triage.overall_denial_risk}
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
  const ctx = rfeContext(rfeText, petLabel, fieldLabel, criteria, opts.additionalContext)

  // Call 1: Triage — must complete first so we know the issues
  console.log('[rfe-analyzer] Starting triage')
  const triage = await callTriage(ctx)
  console.log(`[rfe-analyzer] Triage complete — ${triage.issues.length} issues: ${triage.case_type}`)

  // Calls 2 + 3: Run in parallel — both only need triage + context
  console.log('[rfe-analyzer] Starting deep analysis + response plan in parallel')
  const [deep, plan] = await Promise.all([
    callDeepAnalysis(ctx, triage),
    callResponsePlan(ctx, triage),
  ])
  console.log(`[rfe-analyzer] Complete — ${deep.issue_registry.length} issues fully analyzed`)

  return {
    case_type: triage.case_type,
    overall_denial_risk: triage.overall_denial_risk,
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
