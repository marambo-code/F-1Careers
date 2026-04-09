import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers, StrategyReport, StrategyPreview } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

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

function isLegacyAnswers(a: StrategyAnswers): boolean {
  return a.cr_awards === undefined && a.publications_count !== undefined
}

function extractJSON(text: string): string {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return cleaned.slice(start, end + 1)
}

// ─── PREVIEW ─────────────────────────────────────────────────────

export async function generateStrategyPreview(answers: StrategyAnswers): Promise<StrategyPreview> {
  const eb1a = computeEB1AScore(answers)
  const niw = computeNIWScore(answers)

  const resumeBlock = answers.resume_text
    ? `\nRESUME EXTRACT (first 3000 chars):\n${answers.resume_text.slice(0, 3000)}\n`
    : ''

  const prompt = isLegacyAnswers(answers)
    ? buildLegacyPreviewPrompt(answers)
    : `Analyze this candidate and return a JSON preview.

CANDIDATE:
- Field: ${answers.field_of_work} — ${answers.subfield}
- Education: ${answers.education_level}, ${answers.years_in_field} years experience
- Visa: ${answers.visa_status}${answers.visa_expiration ? `, expires ${answers.visa_expiration}` : ''}
- Role: ${answers.current_role} at ${answers.current_employer}
- Salary: ${answers.us_salary}
- Work: ${answers.work_description}
${resumeBlock}
EB-1A score: ${eb1a.score}/100 (${eb1a.metCount} criteria met)
NIW score: ${niw.score}/100 (${niw.label})

Return ONLY this JSON (no markdown, no fences):
{
  "applicable_pathways": ["list of viable pathways"],
  "top_pathway": "single best recommendation",
  "overall_strength": "Strong | Developing | Early",
  "teaser": "2-3 sentence honest, specific assessment referencing their actual role, employer, and field"
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are an expert immigration strategist. Analyze career profiles with the rigor of a senior immigration attorney.
IMPORTANT: Return ONLY a valid JSON object. No markdown, no code fences, no explanation.`,
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
    max_tokens: 9000,
    system: `You are a senior immigration attorney and career strategist with 20+ years handling EB-1A, EB-2 NIW, O-1, and H-1B petitions.

YOUR JOB: Produce a report so specific, so actionable, and so deeply researched that the reader says "this knows my case better than I do."

CRITICAL RULES:
1. Read the resume line by line — extract real evidence, cite real accomplishments
2. Never use generic advice — everything must be specific to THIS person
3. Draft proposed endeavor using their ACTUAL job titles, employers, and work
4. Name real publications, real organizations, real conferences in the playbook
5. Expert letter guidance must name specific types of people this person can actually reach
6. Return ONLY valid JSON — no markdown, no code fences
7. Keep all strings under 300 characters`,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(extractJSON(raw)) as StrategyReport
}

// ─── Prompts ─────────────────────────────────────────────────────

function buildLegacyPreviewPrompt(a: StrategyAnswers): string {
  return `Analyze this candidate and return a JSON preview.
Role: ${a.current_role} at ${a.current_employer}
Goal: ${a.career_goal} | Visa: ${a.visa_status}
Return ONLY this JSON: { "applicable_pathways": [], "top_pathway": "", "overall_strength": "Strong | Developing | Early", "teaser": "" }`
}

function buildLegacyPrompt(a: StrategyAnswers): string {
  return `Generate a career and immigration strategy report for:
- Role: ${a.current_role} at ${a.current_employer}
- Visa: ${a.visa_status}, Goal: ${a.career_goal}
- Publications: ${a.publications_count}, Citations: ${a.citations_count}
${FULL_REPORT_SCHEMA}`
}

const FULL_REPORT_SCHEMA = `
Return ONLY this JSON object. No markdown. No code fences. All strings under 300 chars.

{
  "petition_readiness": {
    "niw_score": <0-100 integer>,
    "niw_benchmark": "Compare this score to typical successful NIW filers in their field with a specific percentile or range",
    "eb1a_score": <0-100 integer>,
    "eb1a_assessment": "Honest 1-sentence verdict on EB-1A viability and timeline",
    "recommended_pathway": "EB-2 NIW | EB-1A | O-1A | H-1B",
    "filing_recommendation": "File now with confidence | File in 3 months after X | Wait 6 months and build Y first",
    "visa_urgency": "Specific urgency note based on visa status and expiration — if OPT STEM, calculate deadline precisely"
  },

  "resume_evidence_map": [
    {
      "resume_line": "Exact quote or close paraphrase from their resume or work description",
      "criterion": "Which USCIS criterion this maps to (e.g. NIW Prong 1, EB-1A Critical Role §(viii))",
      "strength": "Strong | Developing | Gap",
      "petition_argument": "How a skilled attorney would use this line in the actual petition — cite the legal standard"
    }
  ],

  "draft_proposed_endeavor": "Write 3-5 sentences of actual petition-ready language for the proposed endeavor statement. Use their specific job titles, employers, products, and national impact framing. This must be specific enough to submit to an attorney as a first draft.",

  "expert_letters": [
    {
      "letter_number": 1,
      "who": "Specific type of person — e.g. VP of Partnerships at Apple, not just 'employer'",
      "what_they_should_say": "Exactly what this letter needs to establish — cite the USCIS standard it addresses",
      "how_to_approach": "Practical guidance on how to request this letter given this person's situation"
    }
  ],

  "evidence_playbook": [
    {
      "gap": "Specific gap name",
      "priority": "High | Medium | Low",
      "specific_action": "Exactly what to do — not generic, not vague",
      "named_targets": "Real publication names, real organizations, real conferences specific to their field",
      "deadline": "Realistic timeframe, e.g. '30 days' or '60 days before filing'"
    }
  ],

  "career_visa_assessment": {
    "summary": "2-paragraph honest, deeply personalized assessment. Reference their specific employers, role, salary, and field. Be precise about what makes this case strong or weak.",
    "pathways": [
      { "pathway": "EB-2 NIW", "feasibility": "High | Medium | Low", "rationale": "Specific to this person's evidence and gaps" },
      { "pathway": "EB-1A", "feasibility": "High | Medium | Low", "rationale": "Specific to this person's evidence and gaps" }
    ]
  },

  "gap_analysis": [
    {
      "gap": "Specific gap tied to their actual profile",
      "materiality": "High | Medium | Low",
      "action": "Specific actionable step with named resources"
    }
  ],

  "sprint_30_day": [
    {
      "week": "Week 1",
      "actions": ["Specific action 1", "Specific action 2", "Specific action 3"]
    },
    {
      "week": "Week 2",
      "actions": ["Specific action 1", "Specific action 2"]
    },
    {
      "week": "Week 3",
      "actions": ["Specific action 1", "Specific action 2"]
    },
    {
      "week": "Week 4",
      "actions": ["Specific action 1 — submit/send/complete something concrete"]
    }
  ],

  "roadmap": {
    "three_month": ["Specific action tied to their actual situation", "Another specific action", "Third action"],
    "six_month": ["Specific action", "Another action", "Third action"],
    "twelve_month": ["Specific action", "Another action", "Third action"]
  },

  "attorney_briefing": "Write a concise attorney briefing paragraph this person can email to an immigration attorney today. Include: recommended pathway, 3 strongest evidence pieces, 2 key gaps, visa urgency, and ask for a consultation to review readiness for filing.",

  "recommended_next_step": "Single most important thing in next 30 days, hyper-specific to this person",

  "disclaimer": "This report is a career strategy tool and does not constitute legal advice. Consult a licensed immigration attorney before filing any petition."
}`

function buildFullReportPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  const resumeSection = a.resume_text
    ? `\n═══ RESUME (READ EVERY LINE — extract real evidence) ═══\n${a.resume_text.slice(0, 6000)}\n`
    : ''

  return `Generate a complete, attorney-quality career and immigration strategy report for this candidate.

═══ CANDIDATE PROFILE ═══
Education: ${a.education_level} | ${a.university} — ${a.degree} in ${a.field_of_study}
Field: ${a.field_of_work} — ${a.subfield} | Experience: ${a.years_in_field} years
Visa: ${a.visa_status}${a.visa_expiration ? ` (expires: ${a.visa_expiration})` : ''} | Filing target: ${a.filing_timeline} months
Role: ${a.current_role} at ${a.current_employer} | Salary: ${a.us_salary}
Employer support: ${a.employer_support} | Attorney consulted: ${a.attorney_consulted}
Main concern: ${a.biggest_concern || 'Not provided'}
${resumeSection}
═══ CANDIDATE'S OWN DESCRIPTION OF THEIR WORK ═══
${a.work_description || 'Not provided'}

═══ PROPOSED ENDEAVOR (their words) ═══
${a.proposed_endeavor || 'Not provided'}

═══ EB-1A CRITERIA SELF-ASSESSMENT ═══
Pre-computed score: ${eb1a.score}/100 | Criteria met (≥ Moderate): ${eb1a.metCount}/10
${criteriaBlock(a)}
Met: ${eb1a.metCriteria.join(', ') || 'None at threshold yet'}

═══ NIW DHANASAR PRONGS ═══
Pre-computed score: ${niw.score}/100 (${niw.label})
Prong 1 — Substantial Merit & National Importance: ${STRENGTH[a.niw_prong1 ?? 2]} (${a.niw_prong1 ?? 2}/4)
Prong 2 — Well-Positioned to Advance Endeavor:     ${STRENGTH[a.niw_prong2 ?? 2]} (${a.niw_prong2 ?? 2}/4)
Prong 3 — Benefit Justifies Waiving Job Offer:     ${STRENGTH[a.niw_prong3 ?? 2]} (${a.niw_prong3 ?? 2}/4)

${FULL_REPORT_SCHEMA}`
}
