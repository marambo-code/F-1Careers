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
 * v2: richer output — score_impact, evidence checklist, 30d milestone,
 * priority rank, and report-data-aware context for maximum specificity.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers } from '@/lib/types'
import type { GreenCardScore } from '@/lib/scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

export interface CareerMove {
  id: string
  priority: number          // 1–4, order to execute (1 = do first)
  title: string             // Specific action, ≤10 words
  why: string               // 1–2 sentences: how this specifically helps the petition
  criterion: string         // e.g. "EB-1A §iv — Judging the Work of Others"
  impact: 'High' | 'Medium'
  effort: 'Low' | 'Medium' | 'High'
  timeframe: string         // e.g. "2–4 weeks"
  score_impact: string      // e.g. "+8–12 pts on EB-1A score"
  first_step: string        // Single specific action today — real URL / email / name
  evidence: string[]        // What to keep for the USCIS petition file (3–5 items)
  milestone_30d: string     // Where they should be in 30 days
  tag: 'Quick Win' | 'High Leverage' | 'Long Game' | 'Foundation'
}

export interface CareerMovesResult {
  moves: CareerMove[]
  generated_at: string
}

// ── Field-specific intelligence ───────────────────────────────────
// Grounded in USCIS approval patterns and community knowledge
// (immigration attorney forums, approved petition databases, Reddit r/USCIS)

const FIELD_INTEL: Record<string, string> = {
  stem_cs: `
FIELD INTEL — Computer Science / AI / Software Engineering:
- §iv Judging: AAAI, NeurIPS, ICML, ICLR, ACL, CVPR, ECCV, KDD, WWW are the venues USCIS sees most in approved petitions. Programme Committee membership is the fastest path — recruit via OpenReview.net/group?id=NeurIPS.cc/2025/Conference/Reviewers or email the area chair directly. Even one invitation email + review confirmation = documented evidence.
- §iii Press: IEEE Spectrum, Communications of the ACM, MIT Technology Review, Wired, VentureBeat, TechCrunch cover AI/ML research. University press offices will pitch stories; the researcher just needs to ask. A quote in a trade piece or a cited blog from a credible outlet strengthens §iii.
- §v Contributions: GitHub stars >500 on a widely-used library, open-source tool adopted by a Fortune 500, measurable business impact (cost/latency savings documented in employer letter). Patents (even pending USPTO applications) help significantly — provisional patents cost ~$1,500 and can be filed in weeks.
- §viii Critical Role: Being the sole/lead engineer on a high-impact system with employer letter specifying uniqueness. "Distinguished Engineer" or "Principal Architect" title with documented org-wide impact is very approvable.
- §ix High Salary: Compare to BLS OES SOC 15-1252 (Software QA) / 15-1211 (CS occupations) for your MSA. Above 90th percentile is the USCIS benchmark. H-1B LCA Level III/IV wages are the standard comparison point.`,

  stem_bio: `
FIELD INTEL — Biology / Biotechnology / Life Sciences:
- §iv Judging: Nature, Cell, Science, Nature Methods, PNAS, eLife, PLOS Biology — peer review carries significant weight. Sign up at www.elifesciences.org/reviewers or Web of Science Reviewer Recognition (publons.com). Review invitations from lab PIs happen frequently for postdocs with relevant expertise.
- §vi Scholarly Articles: First-author publications in journals with impact factor >5 are most effective. Google Scholar citations >50 total is a common threshold in approved petitions. BioRxiv preprints with high Altmetric scores also cited as supporting evidence.
- §v Contributions: A novel method, reagent, or cell line deposited at ATCC, described in a methods paper others have cited. Licensing agreements or tech transfer documents are strong exhibits.
- §iii Press: STAT News, Science Daily, GenEngNews, The Scientist, Fierce Biotech actively cover academic discoveries. University press offices can pitch research — often overlooked and fast.
- §i Awards: NIH K-award, NSF CAREER, HHMI Hanna Gray Fellow are top-tier. Departmental awards, poster prizes at Gordon Conferences, and society travel awards also count when documented correctly.`,

  stem_eng: `
FIELD INTEL — Engineering (Mechanical / Electrical / Civil / Chemical):
- §iv Judging: IEEE Transactions journals, ASME, AIChE conference technical committees. Engineering societies actively recruit reviewers — email the editor of your target journal directly (find via IEEE Xplore or ASME Digital Collection).
- §v Contributions: Patent grants (US or PCT) are the gold standard. Patent pending also counts. Published standards contributions (IEEE Standards, ASTM) are highly underused and very approvable — reach out to the relevant IEEE standards working group.
- §viii Critical Role: Leading a project with measurable outcomes — cost reduction (documented %), safety improvements, new product revenue — supported by a letter from a senior director or VP.
- §ix High Salary: BLS OES for your specific SOC code + IEEE Salary Survey data. USCIS regularly accepts BLS 90th percentile as proof of high salary.
- §iii Press: IEEE Spectrum, Engineering.com, E&T Magazine, Mechanical Engineering Magazine, company press releases citing your work.`,

  medicine: `
FIELD INTEL — Medicine / Clinical Research:
- §iv Judging: NEJM, JAMA, The Lancet, BMJ, Annals of Internal Medicine peer reviews are extremely well-regarded. Ad hoc reviewer status is achievable — contact editorial offices directly citing your publications and sub-specialty.
- §v Contributions: A clinical protocol adopted by your hospital system, a diagnostic improvement with documented patient outcomes, or a published case series with novel findings. Clinical trial PI role is very strong.
- §iii Press: Medscape, STAT News, HealthDay, Healio routinely cover clinical research. Hospital PR departments can pitch your work directly.
- §i Awards: Best paper awards at specialty conferences (AHA, ACS, ASCO, IDSA), institutional research awards, NIH study section recognition all count.
- §viii Critical Role: Program director, fellowship director, or division chief — even interim — with a letter from department chair documenting the role's national significance.`,

  business: `
FIELD INTEL — Business / Finance / Management:
- §v Contributions: A proprietary model, framework, or methodology adopted firm-wide. Investment strategies that outperformed benchmarks with documented AUM and returns. A white paper cited by industry bodies.
- §iii Press: Bloomberg, WSJ, Financial Times, Forbes, Harvard Business Review, Business Insider are strongest. Even a byline or quote in a trade publication (Private Equity International, Institutional Investor) counts.
- §iv Judging: Pitch competition panels (Y Combinator Demo Day, Wharton Business Plan Competition, TechStars), grant review committees, industry award juries. Many business schools invite alumni to judge annually.
- §viii Critical Role: Managing a fund, portfolio, or P&L with >$10M documented responsibility, with letters from managing partners or C-suite confirming the role's uniqueness.
- §ix High Salary: BLS OES for Financial Managers (SOC 11-3031) or Management Analysts. Bonus structures and carried interest can be included in compensation documentation.`,

  arts: `
FIELD INTEL — Arts / Design / Architecture:
- §vii Display: Exhibition in galleries covered by recognized art publications, group shows at museums, international exhibitions. Document with catalog pages, invitation letters, venue reputation evidence.
- §viii Critical Role: Creative Director, Lead Designer, Art Director with employer letter documenting the role requires "extraordinary ability" — one of the most approved criteria for artists.
- §iii Press: Architectural Digest, Dezeen, Wallpaper, Artforum, Frieze, designboom, It's Nice That. Regional publications count when documentation shows readership scope.
- §iv Judging: Award juries (D&AD, Red Dot, AIGA, AIA), teaching at art schools as visiting critic, serving as guest critic at architecture reviews.
- §i Awards: Red Dot, iF Design Award, AIGA, AIA — even shortlists and nominations count with supporting documentation.`,

  other: `
FIELD INTEL — General (all disciplines):
- §iv Judging: Find journals and conferences in your discipline on Publons.com (Web of Science Reviewer Recognition). Any formal peer review with a documented invitation email counts as evidence.
- §iii Press: Trade publications, industry blogs with significant readership, and podcast appearances all count. A quote in a piece written by a journalist (not self-published) is most valuable.
- §v Contributions: Anything others have adopted, cited, or built on — code, methods, frameworks, patents. Document adoption with GitHub metrics, citation counts, or client adoption letters.
- §viii Critical Role: Lead a team, product, or initiative with documented outcomes. Senior leadership letter confirming the role's uniqueness within the organization.
- §ix High Salary: BLS Occupational Employment Statistics for your occupation code. Being above the 90th percentile for your metro area is the target.`,
}

function getFieldIntel(field: string): string {
  return FIELD_INTEL[field] ?? FIELD_INTEL.other
}

function getWeakCriteria(a: StrategyAnswers): Array<{ name: string; score: number }> {
  const criteria = [
    { name: 'Awards & Prizes (EB-1A §i)',                  score: a.cr_awards ?? 0 },
    { name: 'Association Membership (EB-1A §ii)',           score: a.cr_membership ?? 0 },
    { name: 'Press & Media Coverage (EB-1A §iii)',          score: a.cr_press ?? 0 },
    { name: 'Judging the Work of Others (EB-1A §iv)',       score: a.cr_judging ?? 0 },
    { name: 'Original Contributions (EB-1A §v)',            score: a.cr_contributions ?? 0 },
    { name: 'Scholarly Articles (EB-1A §vi)',               score: a.cr_scholarly ?? 0 },
    { name: 'Artistic Display (EB-1A §vii)',                score: a.cr_display ?? 0 },
    { name: 'Critical or Leading Role (EB-1A §viii)',       score: a.cr_critical_role ?? 0 },
    { name: 'High Salary (EB-1A §ix)',                      score: a.cr_high_salary ?? 0 },
    { name: 'NIW Prong 1 — Substantial Merit & Importance', score: a.niw_prong1 ?? 2 },
    { name: 'NIW Prong 2 — Well Positioned to Advance',    score: a.niw_prong2 ?? 2 },
    { name: 'NIW Prong 3 — Benefit to Nation',             score: a.niw_prong3 ?? 2 },
  ]
  return criteria.filter(c => c.score <= 1).sort((a, b) => a.score - b.score)
}

function buildContext(
  answers: StrategyAnswers,
  score: GreenCardScore,
  reportData?: Record<string, unknown> | null,
  linkedInUrl?: string,
): string {
  const weak = getWeakCriteria(answers)
  const fieldIntel = getFieldIntel(answers.field_of_work ?? 'other')

  // Pull any detailed criterion notes from the actual AI-generated report
  const reportSummary = reportData
    ? `
AI REPORT FINDINGS (from the full strategy analysis):
${
    // Try to pull criterion_analysis or evidence_gaps from the report
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
Best pathway: ${score.bestPathway} | NIW: ${score.niw}/100 | EB-1A: ${score.eb1a}/100
Ready to file: ${score.readyToFile ? 'YES' : 'Not yet'}

CRITERIA CURRENTLY RATED 0 OR 1 — HIGHEST PRIORITY:
${weak.length > 0
  ? weak.map(c => `  • ${c.name}: ${c.score}/4`).join('\n')
  : '  All criteria rated 2+ — focus on pushing weakest to 4/4'}

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
): Promise<CareerMovesResult> {
  const context = buildContext(answers, score, reportData, linkedInUrl)

  const systemPrompt = `You are a top-tier US immigration attorney with 15 years of approved EB-1A and EB-2 NIW cases. You have deep knowledge of the petitioner's specific academic and professional community.

Your task: generate exactly 4 career moves that form a coherent 90-day campaign to materially strengthen this petitioner's case.

═══ MANDATORY RULES ═══

1. SPECIFICITY: Name real venues, journals, conferences, and people — not "a peer-reviewed journal" but "Nature Methods" or "NeurIPS 2025 Programme Committee". Use the field intel provided.

2. PERSONALIZATION: Reference their ACTUAL employer, university, and role. "Given your role at [employer] on [their described work], you likely have access to..."

3. CRITERION LINKAGE: State the exact USCIS criterion (§i–§ix for EB-1A, Prong 1–3 for NIW) and explain precisely how USCIS adjudicators evaluate this type of evidence.

4. ACTIONABLE FIRST STEP: The first_step must be ONE thing they can do today — an exact email to send (with recipient), a URL to visit, a document to draft. No "start by" or "consider" — a direct instruction.

5. SCORE IMPACT: Be realistic. If they currently score 0 on a criterion and this move addresses it, estimate "+10–15 pts on EB-1A". If it's a supporting move on a criterion they're already strong in, "+2–4 pts".

6. EVIDENCE PACKAGING: List 3–5 specific documents to keep for the USCIS petition file for this move. Be precise: "Official invitation email from conference chair" not just "email".

7. 30-DAY MILESTONE: State a concrete, measurable checkpoint for 30 days from now.

8. PRIORITY: Moves should be ordered: #1 = fastest path to a new criterion, #4 = longest-horizon investment. Prioritize moves that address criteria currently rated 0.

9. TAG: Quick Win = completable in <2 weeks, High Leverage = addresses a 0-rated criterion, Long Game = >3 months, Foundation = enables other moves.

Return ONLY valid JSON. No markdown. No commentary.`

  const userPrompt = `${context}

Generate exactly 4 career moves as a coherent 90-day campaign. Return this exact JSON:

{
  "moves": [
    {
      "id": "move-1",
      "priority": 1,
      "title": "≤10 words — specific action",
      "why": "1–2 sentences: exactly how this strengthens their specific case",
      "criterion": "EB-1A §iv — Judging the Work of Others",
      "impact": "High",
      "effort": "Low",
      "timeframe": "2–4 weeks",
      "score_impact": "+10–15 pts on EB-1A score",
      "first_step": "Specific action to take today — include real URL, email address, or name. Be direct.",
      "evidence": [
        "Official invitation email from the PC chair",
        "Review assignments page screenshot from submission system",
        "Written acknowledgment of reviews submitted"
      ],
      "milestone_30d": "Concrete, measurable thing that should be true in 30 days",
      "tag": "High Leverage"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
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

  // Sort by priority just in case the model misordered
  const sorted = parsed.moves
    .slice(0, 4)
    .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))

  return {
    moves: sorted,
    generated_at: new Date().toISOString(),
  }
}
