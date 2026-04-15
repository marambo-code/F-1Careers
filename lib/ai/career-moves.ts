/**
 * lib/ai/career-moves.ts
 * ─────────────────────────────────────────────────────────────────
 * Generates 4 hyper-specific, field-aware career moves that will
 * materially strengthen a user's EB-1A / NIW petition.
 *
 * Quality bar: every move must be something a top immigration attorney
 * would actually recommend — grounded in USCIS approval patterns,
 * real publication venues, and community-validated strategies.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyAnswers } from '@/lib/types'
import type { GreenCardScore } from '@/lib/scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-6'

export interface CareerMove {
  id: string
  title: string         // Specific action, ≤10 words
  why: string           // 1 sentence: exactly how this helps the petition
  criterion: string     // e.g. "EB-1A §iv — Judging the Work of Others"
  impact: 'High' | 'Medium'
  effort: 'Low' | 'Medium' | 'High'
  timeframe: string     // e.g. "2–4 weeks"
  first_step: string    // The ONE next action to take today
}

export interface CareerMovesResult {
  moves: CareerMove[]
  generated_at: string
}

// ── Field-specific intelligence ───────────────────────────────────
// Grounded in USCIS approval patterns and community knowledge
// (immigration attorney forums, approved petition databases, Reddit r/USCIS, r/immigration)

const FIELD_INTEL: Record<string, string> = {
  stem_cs: `
FIELD INTEL — Computer Science / Software Engineering:
- Judging (§iv): AAAI, NeurIPS, ICML, ICLR, ACL, CVPR, ECCV, ICCV, KDD, WWW, SIGKDD are the venues USCIS sees most in approved petitions. Even one formal review letter counts. Programme Committee membership is the fastest path — many CS conferences actively recruit reviewers via OpenReview.net.
- Press/Media (§iii): IEEE Spectrum, Communications of the ACM, MIT Technology Review, Wired, TechCrunch, VentureBeat regularly cover AI/ML research. A quote in a trade piece or a cited blog post from a credible outlet strengthens this criterion.
- Original Contributions (§v): GitHub stars >500 on a widely-used library, an open-source tool adopted by a Fortune 500, or a measurable business impact (cost savings, uptime improvement) documented with employer letter are strongly approvable. Patent applications (even pending) help significantly.
- Critical Role (§viii): Being the sole or lead engineer on a high-impact system — with a detailed employer letter specifying the role's uniqueness — is one of the most approved criteria in tech. "Distinguished" titles (Distinguished Engineer, Principal Architect) need specific documentation.
- High Salary (§ix): H-1B LCA wage data (Level III/IV) compared to BLS Occupational Employment Statistics is the standard. Compensation above the 90th percentile for your MSA is the USCIS benchmark.`,

  stem_bio: `
FIELD INTEL — Biology / Biotechnology / Life Sciences:
- Judging (§iv): Nature, Cell, Science, Nature Methods, PNAS, eLife, PLOS Biology — peer review for any of these carries significant weight. Sign up at www.elifesciences.org/reviewers or through editorial managers. Review invitations from lab PIs happen frequently for postdocs.
- Scholarly Articles (§vi): First-author publications in journals with impact factor >5 are most effective. Google Scholar citations >50 total is a common threshold in approved petitions. BioRxiv preprints with high Altmetric scores also cited by attorneys as supporting evidence.
- Original Contributions (§v): A novel method, reagent, or cell line deposited at ATCC or described in a methods paper that others have cited is highly approvable. Licensing agreements or tech transfer documents are strong exhibits.
- Press (§iii): STAT News, Science Daily, GenEngNews, The Scientist, Fierce Biotech actively cover academic discoveries. University press offices can help pitch your research — this is a fast, often overlooked path.
- Awards (§i): NIH K-award, NSF CAREER, HHMI Hanna Gray Fellow are top-tier. But departmental awards, poster prizes at Gordon Conferences, and society travel awards also count when documented correctly.`,

  stem_eng: `
FIELD INTEL — Engineering (Mechanical, Electrical, Civil, Chemical):
- Judging (§iv): IEEE Transactions journals (IEEE Trans. on Power Systems, IEEE Trans. on Industrial Electronics, etc.), ASME, AIChE conference technical committees. Engineering societies actively need reviewers — email the editor of your target journal directly.
- Original Contributions (§v): Patent grants (US or PCT) are the gold standard. Patents pending also count with USCIS. Published standards contributions (IEEE Standards, ASTM) are highly underused and very approvable.
- Critical Role (§viii): Leading a project that delivered measurable outcomes — cost reduction (documented %), safety improvements, new product revenue — supported by a letter from a senior director or VP is commonly approved.
- High Salary (§ix): Use BLS OES data for your specific SOC code. IEEE Salary Survey data is also citable. USCIS regularly accepts comparison to BLS 90th percentile as proof of high salary.
- Press (§iii): IEEE Spectrum, Engineering.com, E&T Magazine, Mechanical Engineering Magazine have covered early-career engineers. Company press releases citing your work also count.`,

  medicine: `
FIELD INTEL — Medicine / Clinical Research:
- Judging (§iv): NEJM, JAMA, The Lancet, BMJ, Annals of Internal Medicine peer reviews are extremely well-regarded by USCIS adjudicators. Ad hoc reviewer status is achievable — contact the editorial office directly citing your publications.
- Original Contributions (§v): A clinical protocol adopted by your hospital system, a diagnostic improvement with documented patient outcomes, or a published case series with novel findings. Clinical trial principal investigator (PI) role is very strong.
- Press (§iii): Medscape, STAT News, HealthDay, Healio routinely cover clinical research findings. Hospital PR departments can pitch your work.
- Awards (§i): Best paper awards at specialty conferences (AHA, ACS, ASCO, IDSA), institutional research awards, and NIH study section recognition all count.
- Critical Role (§viii): Being program director, fellowship director, or division chief — even interim — with a letter from the department chair documenting the role's national significance is highly approved.`,

  business: `
FIELD INTEL — Business / Finance / Management:
- Original Contributions (§v): A proprietary model, framework, or methodology adopted firm-wide or industry-wide. Investment strategies that outperformed benchmarks with documented AUM and returns. A white paper cited by industry bodies.
- Press (§iii): Bloomberg, Wall Street Journal, Financial Times, Forbes, Harvard Business Review, Business Insider are the strongest. Even a byline or quote in an industry trade publication (Private Equity International, Institutional Investor) counts.
- Judging (§iv): Serving on pitch competition panels (Y Combinator Demo Day, Wharton Business Plan Competition), grant review committees, industry award juries. Many business schools invite alumni to judge annually.
- Critical Role (§viii): Managing a fund, portfolio, or P&L with >$10M in documented responsibility, with letters from managing partners or C-suite. The "distinguished" standard here is about scope and documented uniqueness of the role.
- High Salary (§ix): Comparison to BLS OES for Financial Managers (SOC 11-3031) or Management Analysts. Bonus structures and carried interest can be included in compensation documentation.`,

  arts: `
FIELD INTEL — Arts / Design / Architecture:
- Display (§vii): Exhibition in galleries represented in recognized art publications, group shows at museums even if not solo. International exhibitions count heavily. Document with catalog pages, invitation letters, venue reputation evidence.
- Critical Role (§viii): Creative Director, Lead Designer, Art Director with employer letter documenting that the role requires "extraordinary ability" — this is one of the most approved criteria for artists.
- Press (§iii): Architectural Digest, Dezeen, Wallpaper, Artforum, Frieze, designboom, It's Nice That. Even regional publications count when documentation shows the scope of readership.
- Judging (§iv): Serving on award juries (D&AD, Red Dot, AIGA, AIA), teaching at art schools as visiting critic, serving as guest critic at architecture reviews.
- Awards (§i): Design industry awards are very well documented in approved petitions — Red Dot, iF Design Award, AIGA, AIA — even shortlists and nominations count with supporting documentation.`,

  other: `
FIELD INTEL — General:
- Judging (§iv): Look for journals and conferences in your specific discipline on Publons.com (now Web of Science Reviewer Recognition). Any formal peer review with a documented invitation email counts.
- Press (§iii): Trade publications, industry blogs with significant readership, and podcast appearances all count. A quote in a piece written by a journalist (not self-published) is most valuable.
- Original Contributions (§v): Anything others have adopted, cited, or built on — code, methods, frameworks, patents. Document adoption with GitHub metrics, citation counts, or client letters.
- Critical Role (§viii): Lead a team, product, or initiative that produced documented outcomes. Senior leadership letter confirming the role's uniqueness within the organization.
- High Salary (§ix): BLS Occupational Employment Statistics for your occupation code is the standard reference. Being above the 90th percentile for your metro area is the target.`,
}

function getFieldIntel(field: string): string {
  return FIELD_INTEL[field] ?? FIELD_INTEL.other
}

function getWeakCriteria(a: StrategyAnswers): Array<{ name: string; score: number }> {
  const criteria = [
    { name: 'Awards & Prizes (EB-1A §i)', score: a.cr_awards ?? 0 },
    { name: 'Association Membership (EB-1A §ii)', score: a.cr_membership ?? 0 },
    { name: 'Press & Media Coverage (EB-1A §iii)', score: a.cr_press ?? 0 },
    { name: 'Judging the Work of Others (EB-1A §iv)', score: a.cr_judging ?? 0 },
    { name: 'Original Contributions (EB-1A §v)', score: a.cr_contributions ?? 0 },
    { name: 'Scholarly Articles (EB-1A §vi)', score: a.cr_scholarly ?? 0 },
    { name: 'Artistic Display (EB-1A §vii)', score: a.cr_display ?? 0 },
    { name: 'Critical or Leading Role (EB-1A §viii)', score: a.cr_critical_role ?? 0 },
    { name: 'High Salary (EB-1A §ix)', score: a.cr_high_salary ?? 0 },
    { name: 'NIW Prong 1 — Substantial Merit', score: a.niw_prong1 ?? 2 },
    { name: 'NIW Prong 2 — Well Positioned', score: a.niw_prong2 ?? 2 },
    { name: 'NIW Prong 3 — National Interest', score: a.niw_prong3 ?? 2 },
  ]
  return criteria.filter(c => c.score <= 1).sort((a, b) => a.score - b.score)
}

function buildContext(answers: StrategyAnswers, score: GreenCardScore, linkedInUrl?: string): string {
  const weak = getWeakCriteria(answers)
  const fieldIntel = getFieldIntel(answers.field_of_work ?? 'other')

  return `
PETITIONER PROFILE
──────────────────
Name: ${answers.full_name}
Current role: ${answers.current_role} at ${answers.current_employer}
Field: ${answers.field_of_work} — ${answers.subfield ?? 'general'}
Education: ${answers.education_level} from ${answers.university}
Years in field: ${answers.years_in_field}
Visa: ${answers.visa_status}, planning to file in ${answers.filing_timeline} months
${linkedInUrl ? `LinkedIn: ${linkedInUrl}` : ''}

THEIR WORK (in their own words)
${(answers.work_description ?? '').slice(0, 700)}

PROPOSED ENDEAVOR
${(answers.proposed_endeavor ?? '').slice(0, 400)}

GREEN CARD SCORE: ${score.overall}/100 (${score.label})
Best pathway: ${score.bestPathway} | NIW: ${score.niw}/100 | EB-1A: ${score.eb1a}/100

CRITERIA CURRENTLY RATED 0 OR 1 (highest priority targets):
${weak.length > 0 ? weak.map(c => `  • ${c.name}: ${c.score}/4`).join('\n') : '  None — focus on strengthening existing criteria to 4/4'}

CURRENT EVIDENCE NOTES
${[
  answers.notes_awards ? `Awards: ${answers.notes_awards}` : null,
  answers.notes_press ? `Press: ${answers.notes_press}` : null,
  answers.notes_contributions ? `Contributions: ${answers.notes_contributions}` : null,
  answers.notes_scholarly ? `Scholarly: ${answers.notes_scholarly}` : null,
  answers.notes_critical_role ? `Critical role: ${answers.notes_critical_role}` : null,
].filter(Boolean).join('\n') || '  None provided'}

${fieldIntel}
`.trim()
}

// ── Main generator ────────────────────────────────────────────────

export async function generateCareerMoves(
  answers: StrategyAnswers,
  score: GreenCardScore,
  linkedInUrl?: string,
): Promise<CareerMovesResult> {
  const context = buildContext(answers, score, linkedInUrl)

  const systemPrompt = `You are a top-tier US immigration attorney specializing in EB-1A and EB-2 NIW petitions, with 15 years of approved cases. You also have deep knowledge of the specific academic, industry, and professional communities in each field.

Your task: generate 4 highly personalized career moves that will materially strengthen this petitioner's case.

STRICT RULES:
1. Name SPECIFIC venues — not "a peer-reviewed journal" but "Nature Methods" or "NeurIPS 2025". Use the field intel provided.
2. Reference their ACTUAL employer, university, and role when relevant — e.g. "Given your role at [employer], you likely have access to..."
3. Cite the criterion explicitly (e.g. EB-1A §iv) and explain exactly how USCIS adjudicators evaluate this evidence.
4. The first_step must be a single, actionable thing they can do TODAY — an email to send, a URL to visit, a person to contact. Be specific.
5. Prioritize criteria currently rated 0 or 1 — these have the biggest score impact.
6. If they have a LinkedIn URL, reference it — they may already have press coverage, connections to potential venues, or endorsements they haven't documented.
7. Do NOT give generic advice. Every recommendation must be so specific that it could only apply to this person.

Return ONLY valid JSON — no markdown, no commentary, no preamble.`

  const userPrompt = `${context}

Generate exactly 4 career moves. Return this exact JSON structure:

{
  "moves": [
    {
      "id": "move-1",
      "title": "string — specific action in ≤10 words",
      "why": "string — 1 sentence: how this specifically helps their petition",
      "criterion": "string — e.g. 'EB-1A §iv — Judging the Work of Others'",
      "impact": "High" | "Medium",
      "effort": "Low" | "Medium" | "High",
      "timeframe": "string — e.g. '2–4 weeks'",
      "first_step": "string — one specific action they can take today, with actual URLs, email addresses, or names where possible"
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
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

  return {
    moves: parsed.moves.slice(0, 4),
    generated_at: new Date().toISOString(),
  }
}
