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
  if (start === -1) throw new Error('No JSON object found in response — response may be empty or entirely non-JSON')

  // Walk from end to find the matching closing brace for the root object
  // This is more robust than lastIndexOf when JSON is truncated
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
    // JSON is truncated — depth never returned to 0
    throw new Error(`JSON is truncated — response ended before closing brace (parsed ${cleaned.length - start} chars, depth stuck at ${depth})`)
  }

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
    max_tokens: 16000,
    system: `You are a senior immigration attorney and career strategist with 20+ years handling EB-1A, EB-2 NIW, O-1A, and H-1B petitions. You have won cases at the AAO and trained dozens of associates.

YOUR JOB: Produce a report so specific, so actionable, and so legally precise that the reader says "this knows my case better than my own attorney does."

CRITICAL RULES:
1. Read the resume line by line — extract real evidence, quote actual lines
2. Never use generic advice — every recommendation must be specific to THIS person's employers, products, salary, and credentials
3. Draft petition language using their ACTUAL job titles, employers, products, and national impact framing — it must pass attorney review
4. The Dhanasar analysis draft_petition_paragraph fields are the most important output — write them as if filing today
5. For dhanasar_analysis, write each draft_petition_paragraph as if it is the actual brief section — 3-5 complete sentences, attorney quality
6. Name real publications, real organizations, real conferences in the playbook — never generic placeholders
7. Use TODAY'S DATE for all calculations — never reference months already past as future targets
8. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON
9. The o1a_bridge section must be thoughtful — analyze whether they actually need O-1A as a bridge given their specific visa situation
10. IMPORTANT: You must produce a COMPLETE JSON object. Do not stop before closing all braces. The JSON must be syntactically valid and complete.`,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(extractJSON(raw)) as StrategyReport
  } catch (parseErr) {
    // Log the raw response so we can diagnose truncation vs malformed JSON
    console.error('[strategy-engine] JSON parse failed. stop_reason:', response.stop_reason)
    console.error('[strategy-engine] Raw response length:', raw.length)
    console.error('[strategy-engine] Last 500 chars:', raw.slice(-500))
    console.error('[strategy-engine] Parse error:', parseErr instanceof Error ? parseErr.message : parseErr)
    throw new Error(`Report generation failed: JSON parse error after ${raw.length} chars (stop_reason: ${response.stop_reason}). ${parseErr instanceof Error ? parseErr.message : ''}`)
  }
}

// ─── Prompts ─────────────────────────────────────────────────────

function buildLegacyPreviewPrompt(a: StrategyAnswers): string {
  return `Analyze this candidate and return a JSON preview.
Role: ${a.current_role} at ${a.current_employer}
Goal: ${a.career_goal} | Visa: ${a.visa_status}
Return ONLY this JSON: { "applicable_pathways": [], "top_pathway": "", "overall_strength": "Strong | Developing | Early", "teaser": "" }`
}

function buildLegacyPrompt(a: StrategyAnswers): string {
  const today = new Date().toISOString().split('T')[0]
  return `Generate a career and immigration strategy report for:
- Role: ${a.current_role} at ${a.current_employer}
- Visa: ${a.visa_status}, Goal: ${a.career_goal}
- Publications: ${a.publications_count}, Citations: ${a.citations_count}
${buildFullReportSchema(today, 'NIW')}`
}

function buildFullReportSchema(today: string, recommendedPathway: 'NIW' | 'EB1A' | 'O1A' | 'BOTH'): string {
  const niwPrimary = recommendedPathway !== 'EB1A'
  return `
TODAY'S DATE: ${today} — use this for ALL deadline calculations. Never reference past dates as future.

EVIDENCE MAP LABELING RULE: Since the recommended pathway is ${recommendedPathway}, ALWAYS lead criterion with the ${niwPrimary ? 'NIW Prong' : 'EB-1A criterion'}. If the same evidence also supports the other pathway, note it in eb1a_connection (if NIW primary) or omit (if EB-1A primary). Never mix them as equals in the criterion field.

Return ONLY this JSON object. No markdown. No code fences.
Long text fields (draft_petition_paragraph, draft_proposed_endeavor, attorney_briefing, petition_argument, what_they_should_say) should be thorough and complete — do NOT truncate.

{
  "petition_readiness": {
    "niw_score": <0-100 integer>,
    "niw_benchmark": "Compare this score to typical successful NIW filers in their specific field/role — cite a percentile range and what it means",
    "eb1a_score": <0-100 integer>,
    "eb1a_assessment": "Honest 1-sentence verdict on EB-1A viability and realistic timeline given their current evidence",
    "recommended_pathway": "EB-2 NIW | EB-1A | O-1A | EB-1A + EB-2 NIW concurrent",
    "filing_recommendation": "Specific recommendation e.g. 'File NIW I-140 in [MONTH YEAR based on TODAY + X months] after completing Y and Z' — use real future months",
    "visa_urgency": "Calculate precisely from TODAY (${today}) and their visa expiration. State exact months remaining, premium processing timeline, and hard deadline. Never reference months already passed."
  },

  "resume_evidence_map": [
    {
      "resume_line": "Exact quote or close paraphrase from their resume",
      "criterion": "${niwPrimary ? 'Primary NIW Prong (e.g. NIW Prong 2 — Well-Positioned)' : 'Primary EB-1A criterion (e.g. EB-1A Critical Role §(viii))'}",
      "eb1a_connection": "${niwPrimary ? 'Optional: EB-1A cross-reference if applicable, e.g. Also supports EB-1A Critical Role §(viii)' : 'omit this field'}",
      "strength": "Strong | Developing | Gap",
      "petition_argument": "How a skilled attorney writes this into the actual petition brief — 2-4 sentences citing the legal standard and why this evidence satisfies it"
    }
  ],

  "dhanasar_analysis": [
    {
      "prong_number": 1,
      "prong_name": "Substantial Merit & National Importance",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Specific evidence from their resume/profile that satisfies this prong — cite actual roles, employers, work",
      "critical_gap": "The single most important missing piece for this prong — be specific",
      "draft_petition_paragraph": "Write 3-5 sentences of actual petition brief language an attorney would submit to USCIS arguing this prong. Use their specific work, employer names, and cite national importance framing. This should be ready to use."
    },
    {
      "prong_number": 2,
      "prong_name": "Well-Positioned to Advance the Endeavor",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Specific evidence — credentials, track record, recognitions that show they are uniquely positioned",
      "critical_gap": "What would make this prong airtight",
      "draft_petition_paragraph": "3-5 sentences of attorney-quality petition language for Prong 2. Reference their HBS, specific employers, salary, cross-company track record specifically."
    },
    {
      "prong_number": 3,
      "prong_name": "National Benefit Justifies Waiving Job Offer Requirement",
      "score": "Strong | Moderate | Weak | Missing",
      "what_you_have": "Evidence that the US uniquely benefits from waiving the job offer requirement for this person",
      "critical_gap": "What USCIS would most likely reject and why",
      "draft_petition_paragraph": "3-5 sentences for Prong 3 — the hardest prong to argue. Explain why no US worker pipeline replicates this person's exact expertise. Cite economic data or policy if relevant."
    }
  ],

  "draft_proposed_endeavor": "Write 4-6 sentences of petition-ready proposed endeavor language. Use their specific job titles, employers, products worked on, and national impact. This must pass attorney review. Include: what they will do, how it advances national interest, why their specific background makes them uniquely positioned, and the broader impact on US competitiveness.",

  "expert_letters": [
    {
      "letter_number": 1,
      "who": "Specific person type with title and org — e.g. Senior Director of Partnerships at Apple Inc who supervised Ian's BD programs",
      "what_they_should_say": "Exactly what this letter must establish to satisfy which USCIS standard — cite the prong or criterion. Be specific about what facts and claims the letter needs.",
      "how_to_approach": "Step-by-step guidance: how to frame the ask, offer to draft it, what to include in the ask email"
    }
  ],

  "evidence_playbook": [
    {
      "gap": "Specific named gap tied to their actual profile and recommended pathway",
      "priority": "High | Medium | Low",
      "specific_action": "Exactly what to do — specific enough to execute today without clarification",
      "named_targets": "Real publication names, real organizations, real conferences relevant to their exact field",
      "deadline": "Specific timeframe relative to TODAY (${today}) e.g. 'by [Month Year]' or 'within 30 days'"
    }
  ],

  "rfe_risks": [
    {
      "likely_objection": "Specific USCIS objection this petitioner is most likely to face — quote the legal standard USCIS would cite",
      "likelihood": "High | Medium | Low",
      "preemptive_strategy": "Exactly what to include in the initial petition filing to preempt this objection before USCIS asks"
    }
  ],

  "o1a_bridge": {
    "applicable": <true if F-1 OPT/OPT STEM with urgency OR if they need bridge status, false otherwise>,
    "why_relevant": "Why O-1A matters for this specific person given their visa situation and timeline",
    "criteria_met": ["List O-1A criteria this person already meets based on their profile — be specific"],
    "criteria_gaps": ["List O-1A criteria they are close to but need to build"],
    "recommended_action": "Should they file O-1A now, in parallel with NIW, or skip it — and exactly why"
  },

  "career_visa_assessment": {
    "summary": "2-paragraph honest, deeply personalized assessment. Reference their specific employers, role, salary, and field. Be precise about strengths and weaknesses. Second paragraph should address their biggest concern if they stated one.",
    "pathways": [
      { "pathway": "EB-2 NIW", "feasibility": "High | Medium | Low", "rationale": "Specific rationale referencing their actual evidence" },
      { "pathway": "EB-1A", "feasibility": "High | Medium | Low", "rationale": "Specific rationale with timeline" }
    ]
  },

  "gap_analysis": [
    {
      "gap": "Specific gap tied to their actual profile and the recommended pathway",
      "materiality": "High | Medium | Low",
      "action": "Specific actionable step with named resources — not generic advice"
    }
  ],

  "sprint_30_day": [
    { "week": "Week 1", "actions": ["Action 1 — specific to their situation", "Action 2", "Action 3"] },
    { "week": "Week 2", "actions": ["Action 1", "Action 2"] },
    { "week": "Week 3", "actions": ["Action 1", "Action 2"] },
    { "week": "Week 4", "actions": ["Action 1 — deliver or submit something concrete"] }
  ],

  "roadmap": {
    "three_month": ["Specific milestone for this person", "Another milestone", "Third milestone"],
    "six_month": ["Specific milestone", "Another milestone", "Third milestone"],
    "twelve_month": ["Specific milestone", "Another milestone", "Third milestone"]
  },

  "attorney_briefing": "Write a ready-to-send paragraph (3-5 sentences) for emailing an immigration attorney. Include: their name/role/employer, recommended pathway, 3 strongest evidence pieces, 2 critical gaps, visa status and exact expiration date, desired filing timeline, and a clear call to action. This should be professional enough to send immediately.",

  "recommended_next_step": "The single most important action this person must take in the next 7 days — hyper-specific, not generic. Name the exact thing, the exact target, and why it unblocks everything else.",

  "disclaimer": "This report is a career strategy tool and does not constitute legal advice. Consult a licensed immigration attorney before filing any petition."
}`
}

function buildFullReportPrompt(
  a: StrategyAnswers,
  eb1a: ReturnType<typeof computeEB1AScore>,
  niw: ReturnType<typeof computeNIWScore>,
): string {
  const today = new Date().toISOString().split('T')[0] // e.g. 2026-04-09
  const recommendedPathway: 'NIW' | 'EB1A' | 'O1A' | 'BOTH' =
    niw.score >= eb1a.score ? 'NIW' : eb1a.score > 70 ? 'EB1A' : 'NIW'

  const resumeSection = a.resume_text
    ? `\n═══ RESUME (READ EVERY LINE — extract real evidence, quote lines exactly) ═══\n${a.resume_text.slice(0, 6000)}\n`
    : ''

  return `Generate a complete, attorney-quality career and immigration strategy report for this candidate.
TODAY IS ${today}. Use this date for ALL deadline and urgency calculations.

═══ CANDIDATE PROFILE ═══
Name: ${a.full_name || 'Not provided'}
Education: ${a.education_level} | ${a.university} — ${a.degree} in ${a.field_of_study}
Field: ${a.field_of_work} — ${a.subfield} | Experience: ${a.years_in_field} years
Visa: ${a.visa_status}${a.visa_expiration ? ` (expires: ${a.visa_expiration})` : ''} | Filing target: ${a.filing_timeline} months from today
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
Met criteria: ${eb1a.metCriteria.join(', ') || 'None at threshold yet'}

═══ NIW DHANASAR PRONGS ═══
Pre-computed score: ${niw.score}/100 (${niw.label})
Prong 1 — Substantial Merit & National Importance: ${STRENGTH[a.niw_prong1 ?? 2]} (${a.niw_prong1 ?? 2}/4)
Prong 2 — Well-Positioned to Advance Endeavor:     ${STRENGTH[a.niw_prong2 ?? 2]} (${a.niw_prong2 ?? 2}/4)
Prong 3 — Benefit Justifies Waiving Job Offer:     ${STRENGTH[a.niw_prong3 ?? 2]} (${a.niw_prong3 ?? 2}/4)

${buildFullReportSchema(today, recommendedPathway)}`
}
