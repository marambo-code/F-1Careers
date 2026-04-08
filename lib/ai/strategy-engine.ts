import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers, StrategyReport, StrategyPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

// ─── Scoring (matches reference HTML tool logic) ─────────────────

const STRENGTH = ['None', 'Weak', 'Moderate', 'Strong', 'Exceptional']

/** Field weights for contributions criterion (most important) */
const FIELD_WEIGHT: Record<string, number> = {
  stem_cs: 1.6, stem_bio: 1.6, stem_phys: 1.5, stem_eng: 1.5,
  medicine: 1.5, business: 1.4, arts: 1.5, sports: 1.5,
  education: 1.3, law: 1.3, other: 1.4,
}

function computeEB1AScore(a: StrategyAnswers): { score: number; metCount: number; metCriteria: string[] } {
  const crMap: Record<string, number> = {
    awards: a.cr_awards ?? 0,
    membership: a.cr_membership ?? 0,
    press: a.cr_press ?? 0,
    judging: a.cr_judging ?? 0,
    contributions: a.cr_contributions ?? 0,
    scholarly: a.cr_scholarly ?? 0,
    display: a.cr_display ?? 0,
    critical_role: a.cr_critical_role ?? 0,
    high_salary: a.cr_high_salary ?? 0,
    commercial: a.cr_commercial ?? 0,
  }

  const criterionNames: Record<string, string> = {
    awards: 'Awards & Prizes',
    membership: 'Association Membership',
    press: 'Media Coverage',
    judging: 'Judging the Work of Others',
    contributions: 'Original Contributions',
    scholarly: 'Scholarly Articles',
    display: 'Artistic Display',
    critical_role: 'Critical or Leading Role',
    high_salary: 'High Salary',
    commercial: 'Commercial Success',
  }

  const w = FIELD_WEIGHT[a.field_of_work ?? 'other'] ?? 1.0
  let totalWeighted = 0, maxPossible = 0, metCount = 0
  const metCriteria: string[] = []

  Object.entries(crMap).forEach(([id, raw]) => {
    const weight = id === 'contributions' ? w : 1.0
    totalWeighted += raw * weight
    maxPossible += 4 * weight
    if (raw >= 2) { metCount++; metCriteria.push(criterionNames[id]) }
  })

  const base = (totalWeighted / maxPossible) * 100
  const bonus = metCount >= 3 ? Math.min(20, (metCount - 3) * 6) : -(3 - metCount) * 15
  const score = Math.min(98, Math.max(5, Math.round(base + bonus)))
  return { score, metCount, metCriteria }
}

function computeNIWScore(a: StrategyAnswers): { score: number; label: string } {
  const p1 = a.niw_prong1 ?? 2
  const p2 = a.niw_prong2 ?? 2
  const p3 = a.niw_prong3 ?? 2
  const minP = Math.min(p1, p2, p3)
  const raw = minP <= 1
    ? Math.min(40, (p1 + p2 + p3) / 3 * 10 + minP * 5)
    : ((p1 * 0.3 + p2 * 0.35 + p3 * 0.35) / 4) * 100
  const score = Math.min(98, Math.max(5, Math.round(raw)))
  const label = score >= 80 ? 'Exceptional' : score >= 60 ? 'Strong' : score >= 40 ? 'Moderate' : score >= 20 ? 'Developing' : 'Insufficient'
  return { score, label }
}

function criteriaBlock(a: StrategyAnswers): string {
  const rows = [
    ['Awards & Prizes §(i)', a.cr_awards ?? 0, a.notes_awards],
    ['Association Membership §(ii)', a.cr_membership ?? 0, null],
    ['Media Coverage §(iii)', a.cr_press ?? 0, a.notes_press],
    ['Judging the Work of Others §(iv)', a.cr_judging ?? 0, null],
    ['Original Contributions §(v)', a.cr_contributions ?? 0, a.notes_contributions],
    ['Scholarly Articles §(vi)', a.cr_scholarly ?? 0, a.notes_scholarly],
    ['Artistic Display §(vii)', a.cr_display ?? 0, null],
    ['Critical/Leading Role §(viii)', a.cr_critical_role ?? 0, a.notes_critical_role],
    ['High Salary §(ix)', a.cr_high_salary ?? 0, null],
    ['Commercial Success §(x)', a.cr_commercial ?? 0, null],
  ] as [string, number, string | null | undefined][]

  return rows.map(([name, val, note]) => {
    const line = `  • ${name}: ${STRENGTH[val] ?? 'None'} (${val}/4)${val >= 2 ? ' ✓ meets threshold' : ''}`
    return note ? line + `\n    Evidence: ${note}` : line
  }).join('\n')
}

// ─── Legacy field adaptor ────────────────────────────────────────
// Handles reports submitted with the OLD questionnaire format

function isLegacyAnswers(a: StrategyAnswers): boolean {
  return a.cr_awards === undefined && a.publications_count !== undefined
}

function buildLegacyPrompt(a: StrategyAnswers): string {
  return `Generate a complete career and immigration strategy report for this candidate.

CANDIDATE PROFILE:
- Name: ${a.full_name}
- University: ${a.university} — ${a.degree} in ${a.field_of_study}, ${a.graduation_date}
- Current Visa: ${a.visa_status}
- Career Goal: ${a.career_goal}
- Role: ${a.current_role} at ${a.current_employer}
- US Experience: ${a.years_experience} years
- US Salary: ${a.us_salary}
- Publications: ${a.publications_count} (${a.publications_detail})
- Citations: ${a.citations_count}
- Awards: ${a.awards}
- Media Coverage: ${a.media_coverage}
- Speaking: ${a.speaking_engagements}
- Patents: ${a.patents}
- Memberships: ${a.professional_memberships}
- Critical Role Evidence: ${a.critical_role_evidence}
- Employer Support: ${a.employer_support}
- Attorney Consulted: ${a.attorney_consulted}
- Main Concern: ${a.biggest_concern}

${FULL_REPORT_SCHEMA}`
}

// ─── PREVIEW ─────────────────────────────────────────────────────

export async function generateStrategyPreview(answers: StrategyAnswers): Promise<StrategyPreview> {
  const eb1a = computeEB1AScore(answers)
  const niw = computeNIWScore(answers)

  const prompt = isLegacyAnswers(answers)
    ? buildLegacyPreviewPrompt(answers)
    : buildPreviewPrompt(answers, eb1a, niw)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert immigration strategist specializing in US employment-based visa petitions (EB-1A, EB-2 NIW, O-1A, O-1B, H-1B).
You analyze career profiles with the rigor of a senior immigration attorney.
Return valid JSON only — no markdown, no prose, no code fences.
Never fabricate evidence. Be honest about gaps.`,
    messages: [
      { role: 'user', content: prompt },
      { role: 'assistant', content: '{' },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(stripFences('{' + raw)) as StrategyPreview
}

// ─── FULL REPORT ──────────────────────────────────────────────────

export async function generateStrategyReport(answers: StrategyAnswers): Promise<StrategyReport> {
  const eb1a = computeEB1AScore(answers)
  const niw = computeNIWScore(answers)

  const prompt = isLegacyAnswers(answers)
    ? buildLegacyPrompt(answers)
    : buildFullReportPrompt(answers, eb1a, niw)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 7000,
    system: `You are a senior immigration strategist with deep expertise in USCIS employment-based visa petitions.
You analyze career profiles against specific USCIS regulatory criteria for EB-1A, EB-2 NIW, O-1A, O-1B, and H-1B.

CRITICAL RULES:
1. Only assess criteria based on evidence the user actually provided
2. Never fabricate, infer, or assume evidence that wasn't stated
3. Be honest about weak cases — false confidence is harmful and unethical
4. The report must be defensible if shown to an immigration attorney
5. Roadmap items must be specific and actionable, not generic
6. Return valid JSON only — no markdown, no prose, no code fences
7. Keep all string values under 250 characters each to ensure the response fits within token limits`,
    messages: [
      { role: 'user', content: prompt },
      { role: 'assistant', content: '{' },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(stripFences('{' + raw)) as StrategyReport
}

// ─── Utilities ────────────────────────────────────────────────────

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

// ─── Prompts ─────────────────────────────────────────────────────

function buildPreviewPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  return `Analyze this candidate's profile and return a JSON preview.

CANDIDATE:
- Name: ${a.full_name || 'Not provided'}
- Field: ${a.field_of_work} — ${a.subfield}
- Education: ${a.education_level}, ${a.years_in_field} years experience
- Visa: ${a.visa_status}, filing in ${a.filing_timeline} months
- Role: ${a.current_role} at ${a.current_employer}
- Salary: ${a.us_salary}

WORK DESCRIPTION:
${a.work_description}

PROPOSED ENDEAVOR:
${a.proposed_endeavor || 'Not provided'}

PRE-COMPUTED SCORES:
- EB-1A: ${eb1a.score}/100 (${eb1a.metCount} criteria at Moderate or above)
- NIW: ${niw.score}/100 (${niw.label})
- EB-1A criteria met: ${eb1a.metCriteria.join(', ') || 'None at threshold'}

EB-1A CRITERIA SELF-ASSESSMENT:
${criteriaBlock(a)}

Return exactly this JSON structure and nothing else:
{
  "applicable_pathways": ["list of viable pathways based on actual evidence"],
  "top_pathway": "single best recommendation",
  "overall_strength": "Strong | Developing | Early",
  "teaser": "2-3 sentence honest, specific assessment of this candidate's strongest asset and the most important gap to address. Reference their actual field and evidence."
}`
}

function buildLegacyPreviewPrompt(a: StrategyAnswers): string {
  return `Analyze this candidate's profile and return a JSON preview.

CANDIDATE:
- Name: ${a.full_name}, Visa: ${a.visa_status}
- Education: ${a.degree} in ${a.field_of_study} from ${a.university} (${a.graduation_date})
- Role: ${a.current_role} at ${a.current_employer}, ${a.years_experience} years US experience
- Salary: ${a.us_salary}
- Publications: ${a.publications_count} (${a.publications_detail})
- Citations: ${a.citations_count}
- Awards: ${a.awards}
- Media: ${a.media_coverage}
- Speaking: ${a.speaking_engagements}
- Patents: ${a.patents}
- Memberships: ${a.professional_memberships}
- Critical Role: ${a.critical_role_evidence}
- Career Goal: ${a.career_goal}

Return exactly this JSON structure and nothing else:
{
  "applicable_pathways": ["list of viable pathways"],
  "top_pathway": "single best recommendation",
  "overall_strength": "Strong | Developing | Early",
  "teaser": "2-3 sentence honest assessment specific to this candidate."
}`
}

const FULL_REPORT_SCHEMA = `Return exactly this JSON structure and nothing else. Every string must be under 250 chars:
{
  "career_visa_assessment": {
    "summary": "2-paragraph honest assessment of this specific candidate's trajectory and best pathway. Reference their actual field, scores, and evidence.",
    "pathways": [
      { "pathway": "EB-2 NIW", "feasibility": "High | Medium | Low", "rationale": "specific rationale for this candidate" },
      { "pathway": "EB-1A", "feasibility": "High | Medium | Low", "rationale": "specific rationale for this candidate" }
    ]
  },
  "criterion_breakdown": [
    { "pathway": "EB-1A", "criterion": "Awards & Prizes §(i)", "rating": "Strong | Developing | Gap", "evidence_summary": "what specifically supports or weakens this for this user" },
    { "pathway": "EB-1A", "criterion": "Scholarly Articles §(vi)", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 1 — Substantial Merit", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 2 — Well-Positioned", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 3 — National Interest Waiver", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" }
  ],
  "evidence_mapping": [
    { "criterion": "Original Contributions", "evidence": ["specific evidence item from user profile", "another item"] },
    { "criterion": "National Importance", "evidence": ["specific evidence item", "another item"] }
  ],
  "gap_analysis": [
    { "gap": "specific gap tied to this user", "materiality": "High | Medium | Low", "action": "specific actionable step" },
    { "gap": "another gap", "materiality": "High | Medium | Low", "action": "specific actionable step" }
  ],
  "roadmap": {
    "three_month": ["specific action 1", "specific action 2", "specific action 3"],
    "six_month": ["specific action 1", "specific action 2", "specific action 3"],
    "twelve_month": ["specific action 1", "specific action 2", "specific action 3"]
  },
  "recommended_next_step": "single most important thing this person should do in the next 30 days, specific to their situation",
  "disclaimer": "This report is a career strategy tool and does not constitute legal advice. Consult a licensed immigration attorney before filing any petition."
}`

function buildFullReportPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  return `Generate a complete career and immigration strategy report for this candidate.

═══ CANDIDATE PROFILE ═══
Name: ${a.full_name || 'Not provided'}
Education: ${a.education_level} degree, ${a.years_in_field} years in ${a.field_of_work} (${a.subfield})
University: ${a.university} — ${a.degree} in ${a.field_of_study} (${a.graduation_date})
Visa: ${a.visa_status} | Target filing: ${a.filing_timeline} months | Goal: ${a.career_goal}
Role: ${a.current_role} at ${a.current_employer}
Salary: ${a.us_salary}
Employer support: ${a.employer_support}
Attorney consulted: ${a.attorney_consulted}

═══ WORK & CONTRIBUTION NARRATIVE ═══
${a.work_description || 'Not provided'}

═══ PROPOSED US ENDEAVOR (for NIW) ═══
${a.proposed_endeavor || 'Not provided'}

═══ EB-1A CRITERIA ASSESSMENT (rated by petitioner, 0=None → 4=Exceptional) ═══
USCIS requires meeting ≥ 3 criteria. Petitioner meets ${eb1a.metCount} criteria at Moderate (2/4) or above.
Pre-computed EB-1A strength score: ${eb1a.score}/100

${criteriaBlock(a)}

Met criteria (≥ Moderate): ${eb1a.metCriteria.length > 0 ? eb1a.metCriteria.join(', ') : 'None yet at threshold'}

═══ EB-2 NIW — DHANASAR PRONG ANALYSIS ═══
Pre-computed NIW score: ${niw.score}/100 (${niw.label})
Prong 1 — Substantial Merit & National Importance: ${STRENGTH[a.niw_prong1 ?? 2]} (${a.niw_prong1 ?? 2}/4)
Prong 2 — Well-Positioned to Advance Endeavor:     ${STRENGTH[a.niw_prong2 ?? 2]} (${a.niw_prong2 ?? 2}/4)
Prong 3 — Benefit Justifies Waiving Job Offer:     ${STRENGTH[a.niw_prong3 ?? 2]} (${a.niw_prong3 ?? 2}/4)

═══ MAIN CONCERN ═══
${a.biggest_concern || 'Not provided'}

${FULL_REPORT_SCHEMA}`
}
