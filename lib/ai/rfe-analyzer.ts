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
  additionalContext?: string,
): string {
  return `PETITION TYPE: ${petLabel}
FIELD: ${fieldLabel}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n` : ''}LEGAL STANDARD:
${PETITION_CRITERIA['other']}

RFE DOCUMENT (first 14000 chars):
${rfeText.slice(0, 14000)}`
}

// ─── Call 1: Triage ────────────────────────────────────────────────────────────
// Reads the full RFE and identifies every distinct issue USCIS raised.
// Returns a minimal issue list (title + risk only) plus case_type and priority actions.
// Bounded output — always completes within ~600 tokens regardless of RFE complexity.

interface RFETriage {
  case_type: string
  issues: { number: number; title: string; risk_level: 'High' | 'Medium' | 'Low' }[]
  priority_action_list: string[]
}

async function callTriage(ctx: string): Promise<RFETriage> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You are a senior immigration attorney specializing in USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.`,
    messages: [{
      role: 'user',
      content: `${ctx}

Read the RFE carefully. Identify EVERY distinct issue USCIS raised — do not miss any.

Return ONLY this JSON:
{
  "case_type": "e.g. EB-1A Extraordinary Ability — 5 issues identified",
  "issues": [
    { "number": 1, "title": "5-8 word descriptive title of the issue", "risk_level": "High | Medium | Low" }
  ],
  "priority_action_list": [
    "Most urgent action the petitioner must take",
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

// ─── Call 2: Deep analysis ─────────────────────────────────────────────────────
// Takes the triage issue list and writes the full analysis for each issue.
// Knows the exact issue count upfront so it can't truncate mid-issue.
// Max tokens scaled to issue count: 600 per issue base, floor 2000, ceiling 6000.

interface RFEDeepAnalysis {
  issue_registry: import('@/lib/types').RFEIssue[]
}

async function callDeepAnalysis(ctx: string, triage: RFETriage): Promise<RFEDeepAnalysis> {
  const issueCount = triage.issues.length
  // 600 tokens per issue is comfortable for thorough analysis; floor at 2000, cap at 6000
  const maxTokens = Math.min(6000, Math.max(2000, issueCount * 600))

  const issueList = triage.issues
    .map(i => `  ${i.number}. "${i.title}" — Risk: ${i.risk_level}`)
    .join('\n')

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: `You are a senior immigration attorney specializing in USCIS RFE responses.
Return ONLY valid JSON. No markdown, no code fences, no text outside the JSON object.
You MUST produce a complete valid JSON object — close ALL braces and arrays before stopping.`,
    messages: [{
      role: 'user',
      content: `${ctx}

The triage identified ${issueCount} issues:
${issueList}

For EACH of these ${issueCount} issues, produce a complete analysis.

Return ONLY this JSON (issue_registry must have exactly ${issueCount} entries):
{
  "issue_registry": [
    {
      "number": <matches triage number>,
      "title": "<exact title from triage>",
      "plain_english": "What USCIS is really saying — translate legalese to plain English, 2-4 sentences",
      "evidence_gaps": ["specific document or evidence USCIS wants", "another specific item"],
      "risk_level": "<matches triage risk_level>",
      "response_strategy": "Rebut | Supplement | Narrow",
      "strategy_rationale": "Why this strategy, and exactly how to execute it for this specific issue — 2-3 sentences"
    }
  ]
}`,
    }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as RFEDeepAnalysis
  } catch (e) {
    console.error('[rfe/deep] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`RFE deep analysis failed (stop_reason: ${res.stop_reason}): ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Public: generate full RFE report (2 sequential calls) ───────────────────

export async function generateRFEReport(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEReport> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'
  const ctx = rfeContext(rfeText, petLabel, fieldLabel, opts.additionalContext)

  console.log('[rfe-analyzer] Starting triage call')
  const triage = await callTriage(ctx)
  console.log(`[rfe-analyzer] Triage complete — ${triage.issues.length} issues identified: ${triage.case_type}`)

  console.log('[rfe-analyzer] Starting deep analysis call')
  const deep = await callDeepAnalysis(ctx, triage)
  console.log(`[rfe-analyzer] Deep analysis complete — ${deep.issue_registry.length} issues analyzed`)

  return {
    case_type: triage.case_type,
    issue_registry: deep.issue_registry,
    priority_action_list: triage.priority_action_list,
    disclaimer: 'This analysis is a strategic planning tool and does not constitute legal advice. Work with a licensed immigration attorney to prepare your RFE response.',
  }
}
