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
  if (start === -1) throw new Error('No JSON object found in response')

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
    throw new Error(`JSON is truncated — response ended before closing brace (depth stuck at ${depth})`)
  }

  return cleaned.slice(start, end + 1)
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (attempt === retries) {
        console.error(`[strategy-engine] ${label} failed after ${retries} attempts: ${msg}`)
        throw e
      }
      const delay = attempt * 3000 // 3s, 6s
      console.warn(`[strategy-engine] ${label} attempt ${attempt} failed (${msg}) — retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error(`[strategy-engine] ${label} exhausted retries`) // unreachable but satisfies TS
}

// ─── Shared system prompt ─────────────────────────────────────────────────────

const SYSTEM = `You are a senior immigration attorney and career strategist with 20+ years handling EB-1A, EB-2 NIW, O-1A, and H-1B petitions.

RULES:
1. Every field must reference the candidate's ACTUAL employers, roles, products, salary, and credentials — never generic placeholders
2. Draft petition language must be attorney-quality and ready to file
3. Return ONLY valid JSON — no markdown, no code fences, no text outside the JSON
4. You MUST complete the entire JSON object — never truncate before closing all braces
5. Use the TODAY date provided for ALL deadline and date calculations`

// ─── Candidate context block (shared across all calls) ────────────────────────

function candidateContext(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
  today: string,
  recommendedPathway: string,
): string {
  const resumeSection = a.resume_text
    ? `\n═══ RESUME ═══\n${a.resume_text.slice(0, 5000)}\n`
    : ''
  return `TODAY: ${today}
RECOMMENDED PATHWAY: ${recommendedPathway}

═══ PROFILE ═══
Name: ${a.full_name || 'Not provided'}
Education: ${a.education_level} | ${a.university} — ${a.degree} in ${a.field_of_study}
Field: ${a.field_of_work} — ${a.subfield} | Experience: ${a.years_in_field} years
Visa: ${a.visa_status}${a.visa_expiration ? ` (expires: ${a.visa_expiration})` : ''} | Filing target: ${a.filing_timeline} months from today
Role: ${a.current_role} at ${a.current_employer} | Salary: ${a.us_salary}
Employer support: ${a.employer_support} | Attorney consulted: ${a.attorney_consulted}
Main concern: ${a.biggest_concern || 'Not provided'}
${resumeSection}
═══ WORK DESCRIPTION ═══
${a.work_description || 'Not provided'}

═══ PROPOSED ENDEAVOR ═══
${a.proposed_endeavor || 'Not provided'}

EB-1A pre-score: ${eb1a.score}/100 | Criteria met: ${eb1a.metCount}/10 (${eb1a.metCriteria.join(', ') || 'none'})
NIW pre-score: ${niw.score}/100 (${niw.label})
Dhanasar prongs: P1=${STRENGTH[a.niw_prong1 ?? 2]}, P2=${STRENGTH[a.niw_prong2 ?? 2]}, P3=${STRENGTH[a.niw_prong3 ?? 2]}

EB-1A criteria:
${criteriaBlock(a)}`
}

// ─── Call 1: Petition readiness + career assessment ───────────────────────────

async function callAssessment(ctx: string): Promise<Pick<StrategyReport, 'petition_readiness' | 'career_visa_assessment' | 'recommended_next_step' | 'disclaimer'>> {
  const prompt = `${ctx}

Return ONLY this JSON (no other text):
{
  "petition_readiness": {
    "niw_score": <integer 0-100>,
    "niw_benchmark": "Compare to typical successful NIW filers in their field — cite percentile range and meaning",
    "eb1a_score": <integer 0-100>,
    "eb1a_assessment": "Honest 1-sentence verdict on EB-1A viability and realistic timeline",
    "recommended_pathway": "EB-2 NIW | EB-1A | O-1A | EB-1A + EB-2 NIW concurrent",
    "filing_recommendation": "Specific month/year to file based on TODAY + X months, after completing specific steps",
    "visa_urgency": "Calculate from TODAY and visa expiration. State exact months remaining, premium processing timeline, hard deadline."
  },
  "career_visa_assessment": {
    "summary": "2 paragraphs: honest personalized assessment referencing their specific employers/role/salary. Second paragraph addresses their biggest concern.",
    "pathways": [
      { "pathway": "EB-2 NIW", "feasibility": "High | Medium | Low", "rationale": "Specific rationale from their evidence" },
      { "pathway": "EB-1A", "feasibility": "High | Medium | Low", "rationale": "Specific rationale with timeline" }
    ]
  },
  "recommended_next_step": "The single most important action in the next 7 days — hyper-specific, name the exact thing and why it unblocks everything",
  "disclaimer": "This report is a career strategy tool and does not constitute legal advice. Consult a licensed immigration attorney before filing any petition."
}`

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  if (res.stop_reason === 'max_tokens') {
    throw new Error(`Assessment section hit token limit — response length: ${raw.length}`)
  }
  try {
    return JSON.parse(extractJSON(raw))
  } catch (e) {
    console.error('[call1/assessment] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`Assessment section failed: ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Call 2: Dhanasar analysis + proposed endeavor + attorney briefing ─────────

async function callDhanasar(ctx: string): Promise<Pick<StrategyReport, 'dhanasar_analysis' | 'draft_proposed_endeavor' | 'attorney_briefing'>> {
  const prompt = `${ctx}

Return ONLY this JSON (no other text):
{
  "dhanasar_analysis": [
    {
      "prong_number": 1,
      "prong_name": "Substantial Merit & National Importance",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Specific evidence from their resume/profile satisfying this prong",
      "critical_gap": "The single most important missing piece — be specific",
      "draft_petition_paragraph": "3-5 sentences of actual petition brief an attorney would submit to USCIS. Use their specific work, employer names, national importance framing. Ready to file."
    },
    {
      "prong_number": 2,
      "prong_name": "Well-Positioned to Advance the Endeavor",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Specific evidence — credentials, track record, recognitions",
      "critical_gap": "What would make this prong airtight",
      "draft_petition_paragraph": "3-5 sentences attorney-quality petition language for Prong 2. Reference their specific employers, salary, cross-company track record."
    },
    {
      "prong_number": 3,
      "prong_name": "National Benefit Justifies Waiving Job Offer Requirement",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Evidence that the US uniquely benefits from waiving the job offer requirement",
      "critical_gap": "What USCIS would most likely reject and why",
      "draft_petition_paragraph": "3-5 sentences for Prong 3 — the hardest prong. Explain why no US worker pipeline replicates this person's expertise. Cite economic data or policy if relevant."
    }
  ],
  "draft_proposed_endeavor": "4-6 sentences of petition-ready proposed endeavor language. Their specific job titles, employers, products, national impact. Must pass attorney review.",
  "attorney_briefing": "3-5 sentence paragraph ready to email to an immigration attorney. Include: name/role/employer, recommended pathway, 3 strongest evidence pieces, 2 critical gaps, visa status and expiration, desired filing timeline, call to action."
}`

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  if (res.stop_reason === 'max_tokens') {
    throw new Error(`Dhanasar section hit token limit — response length: ${raw.length}`)
  }
  try {
    return JSON.parse(extractJSON(raw))
  } catch (e) {
    console.error('[call2/dhanasar] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`Dhanasar section failed: ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Call 3: Evidence map + RFE risks + O-1A bridge ───────────────────────────

async function callEvidence(ctx: string, recommendedPathway: string): Promise<Pick<StrategyReport, 'resume_evidence_map' | 'rfe_risks' | 'o1a_bridge'>> {
  const niwPrimary = recommendedPathway !== 'EB1A'
  const prompt = `${ctx}

Return ONLY this JSON (no other text):
{
  "resume_evidence_map": [
    {
      "resume_line": "Exact quote or close paraphrase from their resume",
      "criterion": "${niwPrimary ? 'Primary NIW Prong (e.g. NIW Prong 2 — Well-Positioned)' : 'Primary EB-1A criterion (e.g. EB-1A Critical Role §(viii))'}",
      "eb1a_connection": "${niwPrimary ? 'Optional EB-1A cross-reference if applicable' : 'omit'}",
      "strength": "Strong | Developing | Gap",
      "petition_argument": "How a skilled attorney writes this into the petition brief — 2-4 sentences citing the legal standard"
    }
  ],
  "rfe_risks": [
    {
      "likely_objection": "Specific USCIS objection this petitioner is most likely to face — quote the legal standard USCIS would cite",
      "likelihood": "High | Medium | Low",
      "preemptive_strategy": "Exactly what to include in the initial petition to preempt this objection"
    }
  ],
  "o1a_bridge": {
    "applicable": <true if F-1 OPT/OPT STEM with urgency or needs bridge status, false otherwise>,
    "why_relevant": "Why O-1A matters for this specific person given their visa situation and timeline",
    "criteria_met": ["O-1A criteria this person already meets — specific"],
    "criteria_gaps": ["O-1A criteria they are close to but need to build"],
    "recommended_action": "File O-1A now, in parallel with NIW, or skip — and exactly why"
  }
}`

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  if (res.stop_reason === 'max_tokens') {
    throw new Error(`Evidence section hit token limit — response length: ${raw.length}`)
  }
  try {
    return JSON.parse(extractJSON(raw))
  } catch (e) {
    console.error('[call3/evidence] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`Evidence section failed: ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Call 4: Action plan ───────────────────────────────────────────────────────

async function callActionPlan(ctx: string, today: string): Promise<Pick<StrategyReport, 'expert_letters' | 'evidence_playbook' | 'gap_analysis' | 'sprint_30_day' | 'roadmap'>> {
  const prompt = `${ctx}

Return ONLY this JSON (no other text):
{
  "expert_letters": [
    {
      "letter_number": 1,
      "who": "Specific person type with title and org — e.g. Senior Director at Apple who supervised their BD programs",
      "what_they_should_say": "Exactly what this letter must establish to satisfy which USCIS standard — cite the prong or criterion",
      "how_to_approach": "Step-by-step: how to frame the ask, offer to draft it, what to include in the ask email"
    }
  ],
  "evidence_playbook": [
    {
      "gap": "Specific named gap tied to their actual profile and recommended pathway",
      "priority": "High | Medium | Low",
      "specific_action": "Exactly what to do — specific enough to execute today without clarification",
      "named_targets": "Real publication names, real organizations, real conferences relevant to their exact field",
      "deadline": "Specific timeframe relative to TODAY (${today}) e.g. 'by [Month Year]'"
    }
  ],
  "gap_analysis": [
    {
      "gap": "Specific gap tied to their actual profile and recommended pathway",
      "materiality": "High | Medium | Low",
      "action": "Specific actionable step with named resources — not generic advice"
    }
  ],
  "sprint_30_day": [
    { "week": "Week 1", "actions": ["Specific action for their situation", "Action 2", "Action 3"] },
    { "week": "Week 2", "actions": ["Action 1", "Action 2"] },
    { "week": "Week 3", "actions": ["Action 1", "Action 2"] },
    { "week": "Week 4", "actions": ["Action 1 — deliver or submit something concrete"] }
  ],
  "roadmap": {
    "three_month": ["Specific milestone for this person", "Another milestone", "Third milestone"],
    "six_month": ["Specific milestone", "Another milestone", "Third milestone"],
    "twelve_month": ["Specific milestone", "Another milestone", "Third milestone"]
  }
}`

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = res.content[0].type === 'text' ? res.content[0].text : ''
  if (res.stop_reason === 'max_tokens') {
    throw new Error(`Action plan section hit token limit — response length: ${raw.length}`)
  }
  try {
    return JSON.parse(extractJSON(raw))
  } catch (e) {
    console.error('[call4/action] parse fail. stop_reason:', res.stop_reason, 'len:', raw.length, 'last200:', raw.slice(-200))
    throw new Error(`Action plan section failed: ${e instanceof Error ? e.message : e}`)
  }
}

// ─── Public: generate preview ─────────────────────────────────────────────────

export async function generateStrategyPreview(answers: StrategyAnswers): Promise<StrategyPreview> {
  const prompt = isLegacyAnswers(answers)
    ? buildLegacyPreviewPrompt(answers)
    : buildFullPreviewPrompt(answers)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  return JSON.parse(extractJSON(raw)) as StrategyPreview
}

// ─── Public: generate full report (4 parallel calls) ─────────────────────────

export async function generateStrategyReport(answers: StrategyAnswers): Promise<StrategyReport> {
  const eb1a = computeEB1AScore(answers)
  const niw = computeNIWScore(answers)
  const today = new Date().toISOString().split('T')[0]
  const recommendedPathway: 'NIW' | 'EB1A' | 'O1A' | 'BOTH' =
    niw.score >= eb1a.score ? 'NIW' : eb1a.score > 70 ? 'EB1A' : 'NIW'

  if (isLegacyAnswers(answers)) {
    return generateLegacyReport(answers)
  }

  const ctx = candidateContext(answers, eb1a, niw, today, recommendedPathway)

  console.log(`[strategy-engine] Starting 4 parallel calls. today=${today}, pathway=${recommendedPathway}`)

  // All 4 calls run simultaneously — total time = slowest single call (~45s).
  // Each call has individual retry logic (2 attempts, 3s delay on retry).
  const [part1, part2, part3, part4] = await Promise.all([
    withRetry(() => callAssessment(ctx), 'callAssessment'),
    withRetry(() => callDhanasar(ctx), 'callDhanasar'),
    withRetry(() => callEvidence(ctx, recommendedPathway), 'callEvidence'),
    withRetry(() => callActionPlan(ctx, today), 'callActionPlan'),
  ])

  console.log('[strategy-engine] All 4 calls complete — merging report')

  return {
    ...part1,
    ...part2,
    ...part3,
    ...part4,
  }
}

// ─── Legacy support ───────────────────────────────────────────────────────────

async function generateLegacyReport(answers: StrategyAnswers): Promise<StrategyReport> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildLegacyPrompt(answers) }],
  })
  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    return JSON.parse(extractJSON(raw)) as StrategyReport
  } catch (e) {
    console.error('[legacy] parse fail. stop_reason:', response.stop_reason, 'len:', raw.length)
    throw new Error(`Legacy report failed: ${e instanceof Error ? e.message : e}`)
  }
}

function buildLegacyPreviewPrompt(a: StrategyAnswers): string {
  return `Analyze this candidate and return a JSON preview.
Role: ${a.current_role} at ${a.current_employer}
Goal: ${a.career_goal} | Visa: ${a.visa_status}
Return ONLY this JSON: { "applicable_pathways": [], "top_pathway": "", "overall_strength": "Strong | Developing | Early", "teaser": "" }`
}

function buildFullPreviewPrompt(a: StrategyAnswers): string {
  const niw = computeNIWScore(a)
  const eb1a = computeEB1AScore(a)
  const pathway = niw.score >= eb1a.score ? 'EB-2 NIW' : eb1a.score > 70 ? 'EB-1A' : 'EB-2 NIW'
  return `Candidate: ${a.current_role} at ${a.current_employer}, ${a.education_level} from ${a.university}, ${a.visa_status}.
NIW score: ${niw.score}/100 (${niw.label}). EB-1A score: ${eb1a.score}/100. Recommended: ${pathway}.
Return ONLY this JSON: { "applicable_pathways": ["EB-2 NIW", "EB-1A"], "top_pathway": "${pathway}", "overall_strength": "Strong | Developing | Early", "teaser": "1-2 sentence honest assessment of their strongest angle" }`
}

function buildLegacyPrompt(a: StrategyAnswers): string {
  const today = new Date().toISOString().split('T')[0]
  return `TODAY: ${today}
Generate a career and immigration strategy report for:
Role: ${a.current_role} at ${a.current_employer}
Education: ${a.education_level} | ${a.university} — ${a.degree} in ${a.field_of_study}
Visa: ${a.visa_status}${a.visa_expiration ? ` (expires ${a.visa_expiration})` : ''}
Work: ${a.work_description || 'Not provided'}
Proposed endeavor: ${a.proposed_endeavor || 'Not provided'}

Return a complete StrategyReport JSON with all required fields.`
}
