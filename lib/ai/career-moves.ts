/**
 * lib/ai/career-moves.ts
 * ─────────────────────────────────────────────────────────────────
 * Generates 4 hyper-specific, field-aware career moves that will
 * materially strengthen a user's EB-1A / NIW petition.
 *
 * Quality bar: every move must be something a top immigration attorney
 * would actually recommend — grounded in USCIS approval patterns,
 * real publication venues, and community-validated strategies.
 *
 * v3: pathway-aware generation — moves now strictly target the chosen
 * pathway (NIW, EB-1A, or Both) so criteria are never mixed up.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers } from '@/lib/types'
import type { GreenCardScore } from '@/lib/scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

export type TargetPathway = 'NIW' | 'EB-1A' | 'Both'

export interface CareerMove {
  id: string
  priority: number          // 1–4, order to execute (1 = do first)
  title: string             // Specific action, ≤10 words
  why: string               // 1–2 sentences: how this specifically helps the petition
  criterion: string         // e.g. "NIW Prong 2 — Well Positioned to Advance"
  impact: 'High' | 'Medium'
  effort: 'Low' | 'Medium' | 'High'
  timeframe: string         // e.g. "2–4 weeks"
  score_impact: string      // e.g. "+8–12 pts on NIW score"
  first_step: string        // Single specific action today — real URL / email / name
  evidence: string[]        // What to keep for the USCIS petition file (3–5 items)
  milestone_30d: string     // Where they should be in 30 days
  tag: 'Quick Win' | 'High Leverage' | 'Long Game' | 'Foundation'
}

export interface CareerMovesResult {
  moves: CareerMove[]
  generated_at: string
  target_pathway: TargetPathway
}

// ── Field-specific intelligence ───────────────────────────────────

const FIELD_INTEL: Record<string, string> = {
  stem_cs: `
FIELD INTEL — Computer Science / AI / Software Engineering:
- Judging / Review: AAAI, NeurIPS, ICML, ICLR, ACL, CVPR, ECCV, KDD, WWW are the venues USCIS sees most in approved petitions. Programme Committee membership is the fastest path — recruit via OpenReview.net or email the area chair directly. Even one invitation email + review confirmation = documented evidence.
- Press: IEEE Spectrum, Communications of the ACM, MIT Technology Review, Wired, VentureBeat, TechCrunch cover AI/ML research. University press offices will pitch stories. A quote in a trade piece or a cited blog from a credible outlet strengthens press coverage.
- Contributions: GitHub stars >500 on a widely-used library, open-source tool adopted by a Fortune 500, measurable business impact (cost/latency savings documented in employer letter). Patents (even pending USPTO applications) help significantly.
- Critical Role: Being the sole/lead engineer on a high-impact system with employer letter specifying uniqueness. "Distinguished Engineer" or "Principal Architect" title with documented org-wide impact.
- High Salary: Compare to BLS OES SOC 15-1252 / 15-1211 for your MSA. Above 90th percentile is the USCIS benchmark.
- NIW Prong 1 (Merit & Importance): AI safety, healthcare AI, climate tech, national security applications score extremely well. Frame the work's societal importance explicitly.
- NIW Prong 2 (Well Positioned): Publication record, deployed systems at scale, patents, industry leadership letters.
- NIW Prong 3 (National Benefit): US-based employment at a company serving national interests, documented shortage of workers with your specific expertise.`,

  stem_bio: `
FIELD INTEL — Biology / Biotechnology / Life Sciences:
- Judging / Review: Nature, Cell, Science, Nature Methods, PNAS, eLife, PLOS Biology — peer review carries significant weight. Sign up at www.elifesciences.org/reviewers or Publons. Review invitations from lab PIs happen frequently for postdocs.
- Scholarly Articles: First-author publications in journals with impact factor >5. Google Scholar citations >50 total is a common threshold. BioRxiv preprints with high Altmetric scores also cited as supporting evidence.
- Contributions: A novel method, reagent, or cell line deposited at ATCC, described in a methods paper others cited. Licensing agreements or tech transfer documents are strong exhibits.
- Press: STAT News, Science Daily, GenEngNews, The Scientist, Fierce Biotech actively cover academic discoveries.
- NIW Prong 1: Disease treatment, public health applications, FDA-regulated work — strong national importance framing.
- NIW Prong 2: PI-level grant history, publications, industry collaborations proving ability to advance the work.
- NIW Prong 3: NIH/NSF-funded research, work filling documented gaps in US biomedical capacity.`,

  stem_eng: `
FIELD INTEL — Engineering (Mechanical / Electrical / Civil / Chemical):
- Judging / Review: IEEE Transactions journals, ASME, AIChE conference technical committees. Engineering societies actively recruit reviewers.
- Contributions: Patent grants (US or PCT) are the gold standard. Patent pending also counts. Published standards contributions (IEEE Standards, ASTM) are highly underused and very approvable.
- Critical Role: Leading a project with measurable outcomes — cost reduction (documented %), safety improvements, new product revenue — supported by a senior director letter.
- NIW Prong 1: Infrastructure, energy, defense, semiconductor work — frame national-scale importance.
- NIW Prong 2: Patent portfolio, published standards, documented technical leadership.
- NIW Prong 3: US defense contracts, critical infrastructure projects, documented workforce shortage in specialty.`,

  medicine: `
FIELD INTEL — Medicine / Clinical Research:
- Judging / Review: NEJM, JAMA, The Lancet, BMJ, Annals of Internal Medicine peer reviews are extremely well-regarded. Ad hoc reviewer status is achievable — contact editorial offices directly.
- Contributions: A clinical protocol adopted by your hospital system, a diagnostic improvement with documented patient outcomes, or a published case series with novel findings. Clinical trial PI role is very strong.
- Press: Medscape, STAT News, HealthDay, Healio routinely cover clinical research.
- NIW Prong 1: Patient care improvements, novel treatments, public health applications — among the strongest NIW cases USCIS approves.
- NIW Prong 2: Clinical trial history, specialty certifications, hospital privileging letters, publications.
- NIW Prong 3: Physician shortage documentation (HRSA shortage area designation), hospital-level need letters.`,

  business: `
FIELD INTEL — Business / Finance / Management:
- Contributions: A proprietary model, framework, or methodology adopted firm-wide. Investment strategies that outperformed benchmarks with documented AUM and returns.
- Press: Bloomberg, WSJ, Financial Times, Forbes, Harvard Business Review, Business Insider are strongest.
- Judging / Review: Pitch competition panels (Y Combinator Demo Day, TechStars), grant review committees, industry award juries.
- Critical Role: Managing a fund, portfolio, or P&L with >$10M documented responsibility.
- NIW Prong 1: Economic impact framing — job creation, capital formation, market efficiency improvements.
- NIW Prong 2: Track record of returns, AUM growth, documented deal history.
- NIW Prong 3: Economic development, US job creation, documented scarcity of equivalent expertise.`,

  arts: `
FIELD INTEL — Arts / Design / Architecture:
- Display: Exhibition in galleries covered by recognized art publications, group shows at museums, international exhibitions.
- Critical Role: Creative Director, Lead Designer, Art Director with employer letter documenting the role requires "extraordinary ability."
- Press: Architectural Digest, Dezeen, Wallpaper, Artforum, Frieze, designboom, It's Nice That.
- Judging / Review: Award juries (D&AD, Red Dot, AIGA, AIA), visiting critic roles at art schools.
- NIW Prong 1: Cultural significance, historic preservation, public art — national importance framing.
- NIW Prong 2: Exhibition record, commissions, awards, published critical reviews.
- NIW Prong 3: US cultural institutions, public commissions, documented impact on American cultural life.`,

  other: `
FIELD INTEL — General (all disciplines):
- Judging / Review: Find journals and conferences in your discipline on Publons.com. Any formal peer review with a documented invitation email counts.
- Press: Trade publications, industry blogs with significant readership, and podcast appearances all count.
- Contributions: Anything others have adopted, cited, or built on — code, methods, frameworks, patents.
- Critical Role: Lead a team, product, or initiative with documented outcomes. Senior leadership letter confirming the role's uniqueness.
- NIW Prong 1: Connect your work to a documented national need or policy priority.
- NIW Prong 2: Publication, patent, or adoption record showing capability to advance the work.
- NIW Prong 3: US employer need, industry shortage documentation, economic or social benefit arguments.`,
}

function getFieldIntel(field: string): string {
  return FIELD_INTEL[field] ?? FIELD_INTEL.other
}

// ── Pathway-aware weak criteria ───────────────────────────────────

function getWeakCriteria(
  a: StrategyAnswers,
  pathway: TargetPathway,
): Array<{ name: string; score: number }> {
  const eb1a = [
    { name: 'Awards & Prizes (EB-1A §i)',                  score: a.cr_awards ?? 0 },
    { name: 'Association Membership (EB-1A §ii)',           score: a.cr_membership ?? 0 },
    { name: 'Press & Media Coverage (EB-1A §iii)',          score: a.cr_press ?? 0 },
    { name: 'Judging the Work of Others (EB-1A §iv)',       score: a.cr_judging ?? 0 },
    { name: 'Original Contributions (EB-1A §v)',            score: a.cr_contributions ?? 0 },
    { name: 'Scholarly Articles (EB-1A §vi)',               score: a.cr_scholarly ?? 0 },
    { name: 'Artistic Display (EB-1A §vii)',                score: a.cr_display ?? 0 },
    { name: 'Critical or Leading Role (EB-1A §viii)',       score: a.cr_critical_role ?? 0 },
    { name: 'High Salary (EB-1A §ix)',                      score: a.cr_high_salary ?? 0 },
  ]

  const niw = [
    { name: 'NIW Prong 1 — Substantial Merit & National Importance', score: a.niw_prong1 ?? 1 },
    { name: 'NIW Prong 2 — Well Positioned to Advance',              score: a.niw_prong2 ?? 1 },
    { name: 'NIW Prong 3 — National Benefit (Waiver Justified)',     score: a.niw_prong3 ?? 1 },
  ]

  const pool = pathway === 'NIW' ? niw
    : pathway === 'EB-1A' ? eb1a
    : [...niw, ...eb1a]

  return pool.filter(c => c.score <= 2).sort((a, b) => a.score - b.score).slice(0, 6)
}

// ── Pathway focus block ───────────────────────────────────────────

function buildPathwayFocus(
  pathway: TargetPathway,
  a: StrategyAnswers,
  score: GreenCardScore,
): string {
  if (pathway === 'NIW') {
    return `
PATHWAY FOCUS — EB-2 NIW (National Interest Waiver)
═══════════════════════════════════════════════════════
The petitioner's best pathway is NIW (current NIW score: ${score.niw}/100).

ALL 4 moves MUST target NIW criteria only:
  • Prong 1 — Substantial Merit & National Importance: ${a.niw_prong1 ?? 1}/4
  • Prong 2 — Well Positioned to Advance the Proposed Endeavor: ${a.niw_prong2 ?? 1}/4
  • Prong 3 — National Benefit / Waiver Justified: ${a.niw_prong3 ?? 1}/4

For each move, the "criterion" field MUST read "NIW Prong X — [full name]".
The "score_impact" field MUST say "+X pts on NIW score".
DO NOT generate EB-1A §i–§ix moves. Every move must directly advance
one of the three NIW prongs as USCIS adjudicators evaluate them.

NIW ADJUDICATION STANDARD (Matter of Dhanasar, 26 I&N Dec. 884):
- Prong 1: The proposed endeavor has both substantial merit (scientific, cultural,
  economic, educational) and national importance (broad benefit beyond local interest).
- Prong 2: The alien is well positioned to advance — credentials, knowledge, record
  of success, a plan with concrete steps, capital if needed.
- Prong 3: On balance, it would be beneficial to the US to waive the job offer/LCA
  requirement — urgency, lack of a US worker with the same expertise, national interest.
`.trim()
  }

  if (pathway === 'EB-1A') {
    return `
PATHWAY FOCUS — EB-1A (Extraordinary Ability)
═══════════════════════════════════════════════════════
The petitioner's best pathway is EB-1A (current EB-1A score: ${score.eb1a}/100).

ALL 4 moves MUST target EB-1A criteria (§i through §ix).
For each move, the "criterion" field MUST read "EB-1A §X — [criterion name]".
The "score_impact" field MUST say "+X pts on EB-1A score".
DO NOT generate NIW-specific moves.

USCIS requires evidence of at least 3 of the 10 criteria for EB-1A.
Focus on criteria rated 0 or 1 first — these are the biggest score gaps.
`.trim()
  }

  // Both
  return `
PATHWAY FOCUS — BOTH NIW + EB-1A
═══════════════════════════════════════════════════════
This petitioner is competitive for both pathways (NIW: ${score.niw}/100, EB-1A: ${score.eb1a}/100).

Generate EXACTLY:
  • 2 moves targeting NIW Prongs 1–3 (label criterion as "NIW Prong X — ...")
  • 2 moves targeting EB-1A criteria §i–§ix (label criterion as "EB-1A §X — ...")

Clearly separate them so the petitioner can pursue both cases simultaneously.
`.trim()
}

// ── Context builder ───────────────────────────────────────────────

function buildContext(
  answers: StrategyAnswers,
  score: GreenCardScore,
  pathway: TargetPathway,
  reportData?: Record<string, unknown> | null,
  linkedInUrl?: string,
): string {
  const weak = getWeakCriteria(answers, pathway)
  const fieldIntel = getFieldIntel(answers.field_of_work ?? 'other')
  const pathwayFocus = buildPathwayFocus(pathway, answers, score)

  const reportSummary = reportData
    ? `
AI REPORT FINDINGS (from the full strategy analysis):
${
    (reportData.criterion_analysis as string) ??
    (reportData.evidence_gaps as string) ??
    (reportData.executive_summary as string) ??
    'Report data available but no structured summary found.'
  }
`.trim()
    : ''

  return `
PETITIONER PROFILE
══════════════════
Name:           ${answers.full_name ?? 'Unknown'}
Current role:   ${answers.current_role ?? 'Unknown'} at ${answers.current_employer ?? 'Unknown employer'}
Field:          ${answers.field_of_work ?? 'Unknown'} — ${answers.subfield ?? 'general'}
Education:      ${answers.education_level ?? 'Unknown'} from ${answers.university ?? 'Unknown university'}
Years in field: ${answers.years_in_field ?? 'Unknown'}
Visa status:    ${answers.visa_status ?? 'Unknown'}, filing in ${answers.filing_timeline ?? '?'} months
${linkedInUrl ? `LinkedIn:       ${linkedInUrl}` : ''}

THEIR WORK (verbatim)
─────────────────────
${(answers.work_description ?? '').slice(0, 700)}

PROPOSED ENDEAVOR
─────────────────────
${(answers.proposed_endeavor ?? '').slice(0, 400)}

CURRENT GREEN CARD SCORE: ${score.overall}/100 (${score.label})
NIW: ${score.niw}/100 | EB-1A: ${score.eb1a}/100 | Best pathway: ${score.bestPathway}
Ready to file: ${score.readyToFile ? 'YES' : 'Not yet'}

${pathwayFocus}

WEAKEST CRITERIA FOR THIS PATHWAY (highest priority to address):
${weak.length > 0
  ? weak.map(c => `  • ${c.name}: ${c.score}/4`).join('\n')
  : '  All criteria rated 3+/4 — focus on pushing to 4/4 with stronger evidence'}

EXISTING EVIDENCE
─────────────────────
${[
    answers.notes_awards        ? `Awards:        ${answers.notes_awards}` : null,
    answers.notes_press         ? `Press:         ${answers.notes_press}` : null,
    answers.notes_contributions ? `Contributions: ${answers.notes_contributions}` : null,
    answers.notes_scholarly     ? `Scholarly:     ${answers.notes_scholarly}` : null,
    answers.notes_critical_role ? `Critical role: ${answers.notes_critical_role}` : null,
  ].filter(Boolean).join('\n') || '  None provided yet'}

${reportSummary}

${fieldIntel}
`.trim()
}

// ── Main generator ────────────────────────────────────────────────

export async function generateCareerMoves(
  answers: StrategyAnswers,
  score: GreenCardScore,
  linkedInUrl?: string,
  reportData?: Record<string, unknown> | null,
  targetPathway?: TargetPathway,
): Promise<CareerMovesResult> {
  // Default to best pathway from score
  const pathway: TargetPathway = targetPathway
    ?? (score.bestPathway?.includes('NIW') ? 'NIW' : 'EB-1A')

  const context = buildContext(answers, score, pathway, reportData, linkedInUrl)

  // Build pathway-specific criterion example for JSON template
  const exampleCriterion = pathway === 'NIW'
    ? 'NIW Prong 2 — Well Positioned to Advance the Proposed Endeavor'
    : 'EB-1A §iv — Judging the Work of Others'
  const exampleScoreImpact = pathway === 'NIW'
    ? '+10–15 pts on NIW score'
    : '+10–15 pts on EB-1A score'

  const systemPrompt = `You are a top-tier US immigration attorney with 15 years of approved EB-1A and EB-2 NIW cases. You have deep knowledge of the petitioner's specific academic and professional community.

Your task: generate exactly 4 career moves that form a coherent 90-day campaign to materially strengthen this petitioner's case for their target pathway.

═══ MANDATORY RULES ═══

1. PATHWAY STRICT: You MUST follow the PATHWAY FOCUS instruction exactly. If the target is NIW, every criterion field must say "NIW Prong X — ...". If the target is EB-1A, every criterion field must say "EB-1A §X — ...". Mixing pathway criteria is a critical error.

2. SPECIFICITY: Name real venues, journals, conferences, and people — not "a peer-reviewed journal" but "Nature Methods" or "NeurIPS 2025 Programme Committee". Use the field intel provided.

3. PERSONALIZATION: Reference their ACTUAL employer, university, and role. "Given your role at [employer] on [their described work], you likely have access to..."

4. ACTIONABLE FIRST STEP: The first_step must be ONE thing they can do today — an exact email to send (with recipient), a URL to visit, a document to draft. No "start by" or "consider" — a direct instruction.

5. SCORE IMPACT: Be realistic. If they currently score 0 on a criterion and this move addresses it, estimate "+10–15 pts". If it's a supporting move on a criterion they're already strong in, "+2–4 pts".

6. EVIDENCE PACKAGING: List 3–5 specific documents to keep for the USCIS petition file for this move. Be precise: "Official invitation email from conference chair" not just "email".

7. 30-DAY MILESTONE: State a concrete, measurable checkpoint for 30 days from now.

8. PRIORITY: Move #1 = fastest path to a new criterion, Move #4 = longest-horizon investment. Prioritize moves that address criteria currently rated 0 or 1.

9. TAG: Quick Win = completable in <2 weeks, High Leverage = addresses a 0-rated criterion, Long Game = >3 months, Foundation = enables other moves.

Return ONLY valid JSON. No markdown. No commentary.`

  const userPrompt = `${context}

Generate exactly 4 career moves as a coherent 90-day campaign for the ${pathway} pathway. Return this exact JSON:

{
  "moves": [
    {
      "id": "move-1",
      "priority": 1,
      "title": "≤10 words — specific action",
      "why": "1–2 sentences: exactly how this strengthens their specific ${pathway} case",
      "criterion": "${exampleCriterion}",
      "impact": "High",
      "effort": "Low",
      "timeframe": "2–4 weeks",
      "score_impact": "${exampleScoreImpact}",
      "first_step": "Specific action to take today — include real URL, email address, or name. Be direct.",
      "evidence": [
        "Specific document 1 to keep for USCIS petition file",
        "Specific document 2",
        "Specific document 3"
      ],
      "milestone_30d": "Concrete, measurable thing that should be true in 30 days",
      "tag": "High Leverage"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3500,
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
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON found in career moves response')
    parsed = JSON.parse(cleaned.slice(start, end + 1))
  }

  if (!Array.isArray(parsed.moves)) throw new Error('Invalid career moves response shape')

  const sorted = parsed.moves
    .slice(0, 4)
    .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))

  return {
    moves: sorted,
    generated_at: new Date().toISOString(),
    target_pathway: pathway,
  }
}
