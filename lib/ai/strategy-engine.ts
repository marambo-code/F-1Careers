import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers, StrategyReport, StrategyPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

// ─── Scoring ─────────────────────────────────────────────────────

const STRENGTH = ['None', 'Weak', 'Moderate', 'Strong', 'Exceptional']

const FIELD_WEIGHT: Record<string, number> = {
  stem_cs: 1.6, stem_bio: 1.6, stem_phys: 1.5, stem_eng: 1.5,
  medicine: 1.5, business: 1.4, arts: 1.5, sports: 1.5,
  education: 1.3, law: 1.3, other: 1.4,
}

function computeEB1AScore(a: StrategyAnswers): { score: number; metCount: number; metCriteria: string[] } {
  const crMap: Record<string, number> = {
    awards: a.cr_awards ?? 0, membership: a.cr_membership ?? 0,
    press: a.cr_press ?? 0, judging: a.cr_judging ?? 0,
    contributions: a.cr_contributions ?? 0, scholarly: a.cr_scholarly ?? 0,
    display: a.cr_display ?? 0, critical_role: a.cr_critical_role ?? 0,
    high_salary: a.cr_high_salary ?? 0, commercial: a.cr_commercial ?? 0,
  }
  const criterionNames: Record<string, string> = {
    awards: 'Awards & Prizes', membership: 'Association Membership',
    press: 'Media Coverage', judging: 'Judging the Work of Others',
    contributions: 'Original Contributions', scholarly: 'Scholarly Articles',
    display: 'Artistic Display', critical_role: 'Critical or Leading Role',
    high_salary: 'High Salary', commercial: 'Commercial Success',
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
  return { score: Math.min(98, Math.max(5, Math.round(base + bonus))), metCount, metCriteria }
}

function computeNIWScore(a: StrategyAnswers): { score: number; label: string } {
  const p1 = a.niw_prong1 ?? 2, p2 = a.niw_prong2 ?? 2, p3 = a.niw_prong3 ?? 2
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
    const line = `  • ${name}: ${STRENGTH[val] ?? 'None'} (${val}/4)${val >= 2 ? ' ✓' : ''}`
    return note ? line + `\n    Evidence: ${note}` : line
  }).join('\n')
}

// ─── Legacy ──────────────────────────────────────────────────────

function isLegacyAnswers(a: StrategyAnswers): boolean {
  return a.cr_awards === undefined && a.publications_count !== undefined
}

// ─── JSON extraction ─────────────────────────────────────────────

function extractJSON(text: string): string {
  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return cleaned.slice(start, end + 1)
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
IMPORTANT: Return ONLY a valid JSON object. No markdown, no code fences, no explanation — just the raw JSON.`,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(extractJSON(raw)) as StrategyPreview
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

CRITICAL RULES:
1. Only assess criteria based on evidence the user actually provided
2. Never fabricate, infer, or assume evidence that wasn't stated
3. Be honest about weak cases
4. Return ONLY a valid JSON object — no markdown, no code fences, no explanation
5. Keep all string values under 250 characters`,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(extractJSON(raw)) as StrategyReport
}

// ─── Prompts ─────────────────────────────────────────────────────

function buildPreviewPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  return `Analyze this candidate and return a JSON preview.

CANDIDATE:
- Field: ${a.field_of_work} — ${a.subfield}
- Education: ${a.education_level}, ${a.years_in_field} years experience
- Visa: ${a.visa_status}, filing in ${a.filing_timeline} months
- Role: ${a.current_role} at ${a.current_employer}
- Salary: ${a.us_salary}

WORK DESCRIPTION: ${a.work_description}
PROPOSED ENDEAVOR: ${a.proposed_endeavor || 'Not provided'}

PRE-COMPUTED SCORES:
- EB-1A: ${eb1a.score}/100 (${eb1a.metCount} criteria met)
- NIW: ${niw.score}/100 (${niw.label})

EB-1A CRITERIA:
${criteriaBlock(a)}

Return ONLY this JSON object (no markdown, no fences):
{
  "applicable_pathways": ["list of viable pathways"],
  "top_pathway": "single best recommendation",
  "overall_strength": "Strong | Developing | Early",
  "teaser": "2-3 sentence honest assessment specific to this candidate"
}`
}

function buildLegacyPreviewPrompt(a: StrategyAnswers): string {
  return `Analyze this candidate and return a JSON preview.

CANDIDATE:
- Visa: ${a.visa_status}, Goal: ${a.career_goal}
- Role: ${a.current_role} at ${a.current_employer}
- Publications: ${a.publications_count}, Citations: ${a.citations_count}
- Awards: ${a.awards}, Media: ${a.media_coverage}

Return ONLY this JSON object (no markdown, no fences):
{
  "applicable_pathways": ["list of viable pathways"],
  "top_pathway": "single best recommendation",
  "overall_strength": "Strong | Developing | Early",
  "teaser": "2-3 sentence honest assessment"
}`
}

function buildLegacyPrompt(a: StrategyAnswers): string {
  return `Generate a complete career and immigration strategy report.

CANDIDATE:
- Visa: ${a.visa_status}, Goal: ${a.career_goal}
- Role: ${a.current_role} at ${a.current_employer}
- Publications: ${a.publications_count} (${a.publications_detail})
- Citations: ${a.citations_count}, Awards: ${a.awards}
- Media: ${a.media_coverage}, Speaking: ${a.speaking_engagements}
- Memberships: ${a.professional_memberships}

${FULL_REPORT_SCHEMA}`
}

const FULL_REPORT_SCHEMA = `Return ONLY this JSON object (no markdown, no code fences). Every string under 250 chars:
{
  "career_visa_assessment": {
    "summary": "2-paragraph honest assessment referencing this candidate's actual field and evidence",
    "pathways": [
      { "pathway": "EB-2 NIW", "feasibility": "High | Medium | Low", "rationale": "specific rationale" },
      { "pathway": "EB-1A", "feasibility": "High | Medium | Low", "rationale": "specific rationale" }
    ]
  },
  "criterion_breakdown": [
    { "pathway": "EB-1A", "criterion": "Awards & Prizes §(i)", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-1A", "criterion": "Scholarly Articles §(vi)", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 1 — Substantial Merit", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 2 — Well-Positioned", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" },
    { "pathway": "EB-2 NIW", "criterion": "Prong 3 — National Interest Waiver", "rating": "Strong | Developing | Gap", "evidence_summary": "specific to this user" }
  ],
  "evidence_mapping": [
    { "criterion": "Original Contributions", "evidence": ["specific evidence item", "another item"] },
    { "criterion": "National Importance", "evidence": ["specific evidence item", "another item"] }
  ],
  "gap_analysis": [
    { "gap": "specific gap for this user", "materiality": "High | Medium | Low", "action": "specific actionable step" },
    { "gap": "another gap", "materiality": "High | Medium | Low", "action": "specific actionable step" }
  ],
  "roadmap": {
    "three_month": ["action 1", "action 2", "action 3"],
    "six_month": ["action 1", "action 2", "action 3"],
    "twelve_month": ["action 1", "action 2", "action 3"]
  },
  "recommended_next_step": "single most important thing in next 30 days, specific to this person",
  "disclaimer": "This report is a career strategy tool and does not constitute legal advice. Consult a licensed immigration attorney before filing any petition."
}`

function buildFullReportPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  return `Generate a complete career and immigration strategy report for this candidate.

CANDIDATE PROFILE:
- Education: ${a.education_level}, ${a.years_in_field} years in ${a.field_of_work} (${a.subfield})
- Visa: ${a.visa_status} | Filing: ${a.filing_timeline} months | Goal: ${a.career_goal}
- Role: ${a.current_role} at ${a.current_employer} | Salary: ${a.us_salary}

WORK NARRATIVE: ${a.work_description || 'Not provided'}
PROPOSED ENDEAVOR: ${a.proposed_endeavor || 'Not provided'}

EB-1A CRITERIA (${eb1a.metCount} criteria met, score: ${eb1a.score}/100):
${criteriaBlock(a)}

NIW PRONGS (score: ${niw.score}/100 — ${niw.label}):
- Prong 1: ${STRENGTH[a.niw_prong1 ?? 2]} (${a.niw_prong1 ?? 2}/4)
- Prong 2: ${STRENGTH[a.niw_prong2 ?? 2]} (${a.niw_prong2 ?? 2}/4)
- Prong 3: ${STRENGTH[a.niw_prong3 ?? 2]} (${a.niw_prong3 ?? 2}/4)

MAIN CONCERN: ${a.biggest_concern || 'Not provided'}

${FULL_REPORT_SCHEMA}`
}
