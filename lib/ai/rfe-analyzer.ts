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

export async function generateRFEReport(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEReport> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: `You are a senior immigration attorney with 15+ years handling USCIS Requests for Evidence.

CRITICAL RULES:
1. List EVERY distinct issue USCIS raised
2. Translate legalese into plain English
3. Risk ratings reflect realistic denial likelihood
4. Evidence gaps must be specific to what USCIS asked
5. Return ONLY a valid JSON object — no markdown, no code fences
6. IMPORTANT: You must produce a COMPLETE, syntactically valid JSON object. Close all braces before stopping.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this USCIS RFE and generate a complete response strategy.

PETITION TYPE: ${petLabel}
FIELD: ${fieldLabel}
${opts.additionalContext ? `CONTEXT: ${opts.additionalContext}\n` : ''}
LEGAL STANDARD:
${PETITION_CRITERIA[opts.petitionType ?? 'other'] ?? PETITION_CRITERIA.other}

RFE DOCUMENT:
${rfeText.slice(0, 12000)}

Return ONLY this JSON object (no markdown, no fences). All strings under 250 chars:
{
  "case_type": "e.g. EB-1A Extraordinary Ability — 4 issues identified",
  "issue_registry": [
    {
      "number": 1,
      "title": "5-8 word descriptive title",
      "plain_english": "What USCIS is saying in plain language",
      "evidence_gaps": ["specific missing item", "another item"],
      "risk_level": "High | Medium | Low",
      "response_strategy": "Rebut | Supplement | Narrow",
      "strategy_rationale": "Why this strategy works for this issue"
    }
  ],
  "priority_action_list": ["Most urgent action", "Second priority", "Third priority"],
  "disclaimer": "This analysis is a strategic planning tool and does not constitute legal advice. Work with a licensed immigration attorney to prepare your RFE response."
}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as RFEReport
  } catch (parseErr) {
    console.error('[rfe-analyzer] JSON parse failed. stop_reason:', response.stop_reason)
    console.error('[rfe-analyzer] Raw response length:', raw.length)
    console.error('[rfe-analyzer] Last 500 chars:', raw.slice(-500))
    throw new Error(`RFE report generation failed: JSON parse error after ${raw.length} chars (stop_reason: ${response.stop_reason}). ${parseErr instanceof Error ? parseErr.message : ''}`)
  }
}
