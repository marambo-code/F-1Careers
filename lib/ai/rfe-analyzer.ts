import Anthropic from '@anthropic-ai/sdk'
import type { RFEReport, RFEPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

// ─── Petition type labels ─────────────────────────────────────────

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

// ─── Petition-specific criteria context ──────────────────────────

const PETITION_CRITERIA: Record<string, string> = {
  eb1a: `EB-1A requires meeting ≥3 of 10 criteria (8 CFR 204.5(h)(3)):
(i) Awards & prizes  (ii) Membership in elite associations  (iii) Media coverage
(iv) Judging the work of others  (v) Original contributions of major significance
(vi) Scholarly articles  (vii) Artistic display  (viii) Critical/leading role
(ix) High salary  (x) Commercial success
PLUS the final merits determination under Kazarian v. USCIS, 596 F.3d 1115 (9th Cir. 2010).`,

  eb2niw: `EB-2 NIW uses the three-prong Dhanasar test (AAO Dec. 27, 2016):
Prong 1: Proposed endeavor has substantial merit and national importance
Prong 2: Petitioner is well-positioned to advance the endeavor
Prong 3: On balance, it would be beneficial to US to waive the job offer requirement
Key cases: Matter of Dhanasar; Kazarian for underlying EB-2 extraordinary ability.`,

  eb1b: `EB-1B requires:
(1) International recognition for outstanding achievements in academic field
(2) 3+ years teaching/research experience
(3) Offer of permanent research or tenured/tenure-track teaching position
Evidence: at least 2 of 6 criteria OR comparable evidence (8 CFR 204.5(i)(3)).`,

  o1: `O-1A requires extraordinary ability in sciences/education/business/athletics.
Must show sustained national/international acclaim — evidence of top percentile.
O-1B for arts/motion picture/TV: "distinction" standard (slightly lower threshold).
USCIS evaluates totality of achievement, not merely satisfying a checkbox count.`,

  eb2perm: `PERM Labor Certification issues typically involve:
- Advertising requirements (DOL-mandated recruitment steps not properly completed)
- Prevailing wage determination disputes
- Job duties drafted too narrowly or broadly
- Unduly restrictive minimum requirements
- Audit triggers: degree-equivalent, unusual duties, combination jobs`,

  h1b: `H-1B Specialty Occupation (8 CFR 214.2(h)(4)(ii)) requires:
- Position normally requires at least a bachelor's degree in a specific specialty
- Petitioner's degree in that specific specialty, not a general field
Common RFE grounds: duties are not specialty occupation, degree mismatch,
entry-level wage for complex role, itinerary issues for consulting/staffing.`,

  other: 'Analyze the RFE based on the applicable USCIS regulatory standards for the petition type described in the document.',
}

// ─── PREVIEW ─────────────────────────────────────────────────────

export async function generateRFEPreview(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEPreview> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based immigration petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are an expert immigration attorney specializing in USCIS Requests for Evidence.
Analyze RFE documents with precision. Return valid JSON only — no markdown, no code fences.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this USCIS RFE and return a preview summary.

PETITION TYPE: ${petLabel}
PETITIONER FIELD: ${fieldLabel}
${opts.additionalContext ? `ADDITIONAL CONTEXT: ${opts.additionalContext}\n` : ''}
APPLICABLE CRITERIA:
${PETITION_CRITERIA[opts.petitionType ?? 'other'] ?? PETITION_CRITERIA.other}

RFE TEXT (first 6000 chars):
${rfeText.slice(0, 6000)}

Return exactly this JSON:
{
  "case_type": "specific petition type and primary issue, e.g. 'EB-1A RFE — Extraordinary Ability: 3 criteria challenged'",
  "issue_count": <number of distinct USCIS issues>,
  "high_risk_count": <number of High-risk issues>,
  "teaser": "2-3 sentence plain English summary of the most critical issue. Be specific to this document."
}`,
      },
      { role: 'assistant', content: '{' },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(stripFences('{' + raw)) as RFEPreview
}

// ─── FULL REPORT ──────────────────────────────────────────────────

export async function generateRFEReport(
  rfeText: string,
  opts: { petitionType?: string; rfeField?: string; additionalContext?: string } = {},
): Promise<RFEReport> {
  const petLabel = PETITION_LABELS[opts.petitionType ?? ''] ?? 'employment-based petition'
  const fieldLabel = FIELD_LABELS[opts.rfeField ?? ''] ?? 'general field'

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 7000,
    system: `You are a senior immigration attorney with 15+ years of experience handling USCIS Requests for Evidence.
You produce structured, attorney-quality RFE response strategies.

CRITICAL RULES:
1. List EVERY distinct issue USCIS raised — do not bundle or skip separate issues
2. Translate legalese into plain English without losing legal accuracy
3. Risk ratings reflect realistic likelihood of denial if the issue is not addressed
4. Response strategies (Rebut/Supplement/Narrow) must be legally sound
5. Evidence gaps must be specific to what USCIS actually asked for
6. Priority action list must be ordered by urgency — highest risk first
7. Return valid JSON only — no markdown, no code fences
8. Keep all string values under 250 characters`,
    messages: [
      {
        role: 'user',
        content: `Analyze this USCIS Request for Evidence and generate a complete, attorney-ready response strategy.

═══ PETITION CONTEXT ═══
Petition Type: ${petLabel}
Petitioner's Field: ${fieldLabel}
${opts.additionalContext ? `Additional Context from Petitioner:\n${opts.additionalContext}\n` : ''}
═══ APPLICABLE USCIS LEGAL STANDARD ═══
${PETITION_CRITERIA[opts.petitionType ?? 'other'] ?? PETITION_CRITERIA.other}

═══ RFE DOCUMENT TEXT ═══
${rfeText.slice(0, 12000)}

═══ INSTRUCTIONS ═══
For each distinct issue USCIS raised:
- Assign risk level (how likely is denial if this issue is not addressed)
- Choose response strategy:
  Rebut = USCIS made a factual/legal error; argue they are wrong
  Supplement = Evidence was insufficient; provide more
  Narrow = Reframe the claim to what evidence can actually support
- List specific evidence gaps (what exactly needs to be submitted)
- Write plain_english as if explaining directly to the petitioner

Return exactly this JSON. All strings under 250 chars:
{
  "case_type": "e.g. EB-1A Extraordinary Ability — 4 issues identified",
  "issue_registry": [
    {
      "number": 1,
      "title": "5-8 word descriptive title for this issue",
      "plain_english": "What USCIS is saying and asking for in clear non-legal language",
      "evidence_gaps": ["specific missing document or evidence", "another specific item"],
      "risk_level": "High | Medium | Low",
      "response_strategy": "Rebut | Supplement | Narrow",
      "strategy_rationale": "Why this strategy works for this specific issue"
    }
  ],
  "priority_action_list": [
    "Most urgent specific action",
    "Second priority action",
    "Third priority action"
  ],
  "disclaimer": "This analysis is a strategic planning tool and does not constitute legal advice. Work with a licensed immigration attorney to prepare and file your RFE response."
}`,
      },
      { role: 'assistant', content: '{' },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(stripFences('{' + raw)) as RFEReport
}

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}
