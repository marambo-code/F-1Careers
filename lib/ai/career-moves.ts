/**
 * lib/ai/career-moves.ts
 * ─────────────────────────────────────────────────────────────────
 * Generates 3–5 hyper-specific, actionable career moves that will
 * materially improve a user's Green Card Score and petition readiness.
 *
 * Each move is tied to a specific EB-1A criterion or NIW prong so the
 * user can see exactly *why* it matters — not just generic advice.
 *
 * Caching: results are stored in profiles.career_moves and refreshed
 * whenever a new strategy report completes (score changes).
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers } from '@/lib/types'
import type { GreenCardScore } from '@/lib/scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

export interface CareerMove {
  id: string                        // stable slug for React keys
  title: string                     // e.g. "Submit a peer review for Nature Methods"
  why: string                       // 1-sentence link to petition impact
  criterion: string                 // e.g. "EB-1A §(iv) Judging" or "NIW Prong 2"
  impact: 'High' | 'Medium'        // how much this moves the score
  effort: 'Low' | 'Medium' | 'High'
  timeframe: string                 // e.g. "2–4 weeks"
  first_step: string                // The single next action (phone call, email, etc.)
}

export interface CareerMovesResult {
  moves: CareerMove[]
  generated_at: string              // ISO timestamp
}

// ─── Context builder ─────────────────────────────────────────────

function buildContext(answers: StrategyAnswers, score: GreenCardScore): string {
  const niw = `NIW Prong 1: ${answers.niw_prong1 ?? 2}/4, Prong 2: ${answers.niw_prong2 ?? 2}/4, Prong 3: ${answers.niw_prong3 ?? 2}/4`
  const eb1a = [
    `Awards: ${answers.cr_awards ?? 0}/4`,
    `Membership: ${answers.cr_membership ?? 0}/4`,
    `Press: ${answers.cr_press ?? 0}/4`,
    `Judging: ${answers.cr_judging ?? 0}/4`,
    `Contributions: ${answers.cr_contributions ?? 0}/4`,
    `Scholarly: ${answers.cr_scholarly ?? 0}/4`,
    `Critical Role: ${answers.cr_critical_role ?? 0}/4`,
    `High Salary: ${answers.cr_high_salary ?? 0}/4`,
  ].join(' | ')

  return `
PETITIONER PROFILE
──────────────────
Name: ${answers.full_name}
Field: ${answers.field_of_work} / ${answers.subfield}
Education: ${answers.education_level}, ${answers.university}
Role: ${answers.current_role} at ${answers.current_employer}
Experience: ${answers.years_in_field} years in field
Visa: ${answers.visa_status}, filing in ${answers.filing_timeline} months

GREEN CARD SCORE: ${score.overall}/100 (${score.label})
Best pathway: ${score.bestPathway}
NIW score: ${score.niw}/100 | EB-1A score: ${score.eb1a}/100

NIW PRONG RATINGS
${niw}

EB-1A CRITERION RATINGS
${eb1a}

WORK DESCRIPTION
${(answers.work_description ?? '').slice(0, 600)}

PROPOSED ENDEAVOR
${(answers.proposed_endeavor ?? '').slice(0, 400)}

WEAKEST AREAS (criteria rated 0 or 1):
${getWeakCriteria(answers).join(', ') || 'None identified'}
`.trim()
}

function getWeakCriteria(a: StrategyAnswers): string[] {
  const weak: string[] = []
  if ((a.cr_awards ?? 0) <= 1) weak.push('Awards (EB-1A §i)')
  if ((a.cr_membership ?? 0) <= 1) weak.push('Membership (EB-1A §ii)')
  if ((a.cr_press ?? 0) <= 1) weak.push('Press/Media (EB-1A §iii)')
  if ((a.cr_judging ?? 0) <= 1) weak.push('Judging (EB-1A §iv)')
  if ((a.cr_contributions ?? 0) <= 1) weak.push('Original Contributions (EB-1A §v)')
  if ((a.cr_scholarly ?? 0) <= 1) weak.push('Scholarly Articles (EB-1A §vi)')
  if ((a.cr_critical_role ?? 0) <= 1) weak.push('Critical Role (EB-1A §viii)')
  if ((a.niw_prong1 ?? 2) <= 1) weak.push('NIW Prong 1 (Substantial Merit)')
  if ((a.niw_prong2 ?? 2) <= 1) weak.push('NIW Prong 2 (Well Positioned)')
  if ((a.niw_prong3 ?? 2) <= 1) weak.push('NIW Prong 3 (National Interest)')
  return weak
}

// ─── Main generator ──────────────────────────────────────────────

export async function generateCareerMoves(
  answers: StrategyAnswers,
  score: GreenCardScore,
): Promise<CareerMovesResult> {
  const context = buildContext(answers, score)

  const systemPrompt = `You are an elite immigration strategist specializing in EB-1A and EB-2 NIW petitions.
Your job: generate 4 hyper-specific career moves that will materially strengthen this person's petition.

Rules:
- Each move must target a specific weak criterion or prong
- Be concrete — name specific journals, organizations, conference series, or publication types relevant to their exact field and subfield
- Do NOT give generic advice like "get media coverage" — say exactly which outlets, how to pitch, who to contact
- High impact moves address EB-1A criteria directly; medium impact moves build NIW prong strength
- Effort rating: Low = <1 week; Medium = 1-4 weeks; High = 1+ months
- First step must be a single, specific action (an email to send, a form to fill, a person to call)

Return ONLY valid JSON, no markdown, no commentary.`

  const userPrompt = `${context}

Generate exactly 4 career moves for this petitioner. Return JSON matching this exact schema:

{
  "moves": [
    {
      "id": "move-1",
      "title": "string (specific action, ≤10 words)",
      "why": "string (1 sentence linking to petition impact)",
      "criterion": "string (e.g. 'EB-1A §iv — Judging' or 'NIW Prong 2')",
      "impact": "High" | "Medium",
      "effort": "Low" | "Medium" | "High",
      "timeframe": "string (e.g. '2–4 weeks')",
      "first_step": "string (single specific next action)"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed: { moves: CareerMove[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Fallback: extract JSON object
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found in career moves response')
    parsed = JSON.parse(cleaned.slice(start, end + 1))
  }

  if (!Array.isArray(parsed.moves)) throw new Error('Invalid career moves response shape')

  return {
    moves: parsed.moves.slice(0, 5),
    generated_at: new Date().toISOString(),
  }
}
