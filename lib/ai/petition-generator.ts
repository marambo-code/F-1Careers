/**
 * lib/ai/petition-generator.ts
 * ─────────────────────────────────────────────────────────────────
 * Generates a full petition package (personal statement + cover letter)
 * for EB-2 NIW or EB-1A self-petitions.
 *
 * Quality bar: output must read like a $15k attorney wrote it.
 * Legal argumentation, not a CV narrative. Every claim tied to
 * specific evidence. Every prong/criterion explicitly addressed.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { EvidenceItem, Pathway } from '@/lib/data/petition-evidence'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface PetitionProfile {
  full_name?: string | null
  university?: string | null
  degree?: string | null
  field_of_study?: string | null
  current_employer?: string | null
  job_title?: string | null
  visa_status?: string | null
  country_of_birth?: string | null
}

export interface PetitionPackage {
  personal_statement: string
  cover_letter: string
  generated_at: string
  pathway: Pathway
  word_count: number
}

function buildEvidenceSummary(items: EvidenceItem[]): string {
  const done = items.filter(i => i.status === 'done')
  const inProgress = items.filter(i => i.status === 'in_progress')
  const all = [...done, ...inProgress]

  if (all.length === 0) return 'No evidence items logged yet.'

  const byGroup = all.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, EvidenceItem[]>)

  return Object.entries(byGroup)
    .map(([group, groupItems]) => {
      const lines = groupItems.map(i =>
        `  - [${i.status === 'done' ? 'DONE' : 'IN PROGRESS'}] ${i.label}${i.notes ? ` (Notes: ${i.notes})` : ''}`
      )
      return `${group}:\n${lines.join('\n')}`
    })
    .join('\n\n')
}

function buildNIWPrompt(
  profile: PetitionProfile,
  narrative: string,
  evidenceSummary: string,
  strategyContext: string
): string {
  return `You are a top-tier US immigration attorney with 20 years of experience winning EB-2 NIW cases. You write petition letters that get approved, not RFE'd.

Write a complete, attorney-quality I-140 support letter / personal statement for the petitioner below. This is a self-petition under EB-2 National Interest Waiver, adjudicated under Matter of Dhanasar (26 I&N Dec. 884).

LEGAL FRAMEWORK — DHANASAR THREE-PRONG TEST:
Prong 1: The proposed endeavor has substantial merit and national importance
Prong 2: The petitioner is well-positioned to advance the proposed endeavor
Prong 3: On balance, it would be beneficial to the United States to waive the job offer and labor certification requirements

PETITIONER PROFILE:
Name: ${profile.full_name || '[Petitioner Name]'}
Degree: ${profile.degree || 'Advanced Degree'} in ${profile.field_of_study || 'their field'}
University: ${profile.university || '[University]'}
Current Role: ${profile.job_title || 'Researcher/Professional'} at ${profile.current_employer || '[Employer]'}
Visa Status: ${profile.visa_status || 'F-1/H-1B'}
Country of Birth: ${profile.country_of_birth || '[Country]'}

PROPOSED ENDEAVOR (petitioner's own words — use this exact language throughout):
${narrative || '[Petitioner has not yet written their proposed endeavor statement]'}

EVIDENCE COLLECTED:
${evidenceSummary}

${strategyContext ? `ADDITIONAL CONTEXT FROM STRATEGY REPORT:\n${strategyContext}` : ''}

WRITING INSTRUCTIONS:
1. Open with a 2-paragraph introduction establishing the proposed endeavor and why it serves the national interest. Use the EXACT proposed endeavor language from above — do not paraphrase it.
2. Argue Prong 1 for at least 3-4 paragraphs. Connect the work to specific US national priorities (cite relevant federal initiatives, agency priorities, or legislation if applicable to the field).
3. Argue Prong 2 for at least 4-5 paragraphs. Use every piece of evidence listed above. Be specific — if peer review invitations are listed, reference them as demonstrating field recognition. If citations are listed, frame them as evidence of the field adopting the petitioner's contributions.
4. Argue Prong 3 for 2-3 paragraphs. Explain why requiring a job offer would be contrary to national interest — the petitioner is uniquely positioned to advance this endeavor independently.
5. Close with a paragraph requesting approval.

STYLE RULES:
- Write in third person ("the Petitioner" or their name)
- Legal brief tone — assertive, not hedging. Say "demonstrates" not "may demonstrate"
- Every claim must point to specific evidence. Never make an unsupported assertion.
- Do NOT write a CV narrative. This is a legal argument.
- Do NOT use phrases like "Dr. Smith is passionate about..." — this is not a personal essay
- Target 2,500–3,500 words for the personal statement
- Use clear section headers for each Prong

Output the personal statement only. No preamble, no explanation. Start with "PERSONAL STATEMENT" as the title.`
}

function buildEB1APrompt(
  profile: PetitionProfile,
  narrative: string,
  evidenceSummary: string,
  strategyContext: string
): string {
  return `You are a top-tier US immigration attorney with 20 years of experience winning EB-1A cases. You write petition letters that get approved on the first submission.

Write a complete, attorney-quality I-140 support letter / personal statement for the petitioner below. This is a self-petition under EB-1A Extraordinary Ability, adjudicated under 8 CFR §204.5(h).

LEGAL FRAMEWORK — EB-1A:
The petitioner must demonstrate extraordinary ability in their field through sustained national or international acclaim. They must meet at least 3 of 10 regulatory criteria, OR provide evidence of a one-time achievement (major internationally recognized award).

The 10 criteria (8 CFR §204.5(h)(3)):
(i) Receipt of lesser nationally or internationally recognized prizes or awards
(ii) Membership in associations requiring outstanding achievement
(iii) Published material about the alien in professional/major trade publications or major media
(iv) Participation as a judge of the work of others in the field
(v) Original scientific, scholarly, artistic, athletic, or business-related contributions of major significance
(vi) Authorship of scholarly articles in professional/major trade publications
(vii) Display of work at artistic exhibitions or showcases
(viii) Performance in a leading or critical role for distinguished organizations
(ix) High salary or remuneration commanded in relation to others in the field
(x) Commercial successes in the performing arts

PETITIONER PROFILE:
Name: ${profile.full_name || '[Petitioner Name]'}
Degree: ${profile.degree || 'Advanced Degree'} in ${profile.field_of_study || 'their field'}
University: ${profile.university || '[University]'}
Current Role: ${profile.job_title || 'Researcher/Professional'} at ${profile.current_employer || '[Employer]'}
Visa Status: ${profile.visa_status || 'F-1/H-1B'}
Country of Birth: ${profile.country_of_birth || '[Country]'}

SUMMARY OF PETITIONER'S WORK:
${narrative || '[Petitioner has not yet written their summary statement]'}

EVIDENCE COLLECTED:
${evidenceSummary}

${strategyContext ? `ADDITIONAL CONTEXT FROM STRATEGY REPORT:\n${strategyContext}` : ''}

WRITING INSTRUCTIONS:
1. Open with a 2-paragraph introduction establishing the petitioner's extraordinary ability and the specific criteria they satisfy.
2. For each criterion that has corresponding evidence in the list above, write a dedicated section with a bold header (e.g., "Criterion (iv) — Participation as Judge of Others' Work"). Argue why the evidence satisfies the criterion's legal standard. Be specific and assertive.
3. After addressing individual criteria, write a "Final Merits Determination" section arguing that even if individual criteria are borderline, the totality of evidence demonstrates the sustained acclaim required for EB-1A.
4. Close with a paragraph requesting approval.

STYLE RULES:
- Write in third person ("the Petitioner" or their name)
- Legal brief tone — assertive, not hedging
- Every criterion section must tie to SPECIFIC evidence from the list
- Never make unsupported claims
- Do NOT write a personal narrative or CV summary
- Target 2,500–3,500 words
- Bold headers for each criterion section

Output the personal statement only. No preamble, no explanation. Start with "PERSONAL STATEMENT" as the title.`
}

function buildCoverLetterPrompt(
  profile: PetitionProfile,
  pathway: Pathway,
  evidenceSummary: string,
  narrative: string
): string {
  return `You are a US immigration attorney. Write a concise, professional cover letter for an I-140 petition package.

PETITION TYPE: ${pathway === 'NIW' ? 'EB-2 National Interest Waiver (NIW) under Matter of Dhanasar' : 'EB-1A Extraordinary Ability under 8 CFR §204.5(h)'}
PETITIONER: ${profile.full_name || '[Petitioner Name]'}, ${profile.degree || 'Advanced Degree'} in ${profile.field_of_study || 'their field'}
PROPOSED ENDEAVOR / FOCUS: ${narrative?.slice(0, 300) || '[Petitioner field and work]'}

EVIDENCE AVAILABLE:
${evidenceSummary}

Write a cover letter (400–600 words) that:
1. Opens by identifying the petition type and petitioner
2. States which legal standard is being met (Dhanasar prongs for NIW / criteria count for EB-1A)
3. Lists each exhibit with a one-line description of what it is and which prong/criterion it supports — formatted as:
   Exhibit A: [Description] — supports [Prong/Criterion]
   Exhibit B: [Description] — supports [Prong/Criterion]
   (Create exhibit labels based on the evidence items above, in logical order)
4. Closes by requesting approval and listing attachments

Tone: professional, direct, attorney-style. No fluff.

Output the cover letter only. Start with "COVER LETTER" as the title.`
}

export async function generatePetitionPackage(
  profile: PetitionProfile,
  pathway: Pathway,
  narrative: string,
  evidenceItems: EvidenceItem[],
  strategyData?: Record<string, unknown> | null
): Promise<PetitionPackage> {
  const evidenceSummary = buildEvidenceSummary(evidenceItems)

  // Pull useful context from strategy report if available
  const strategyContext = strategyData
    ? `Field: ${strategyData.field || ''}\nKey strengths identified: ${JSON.stringify(strategyData.strengths || strategyData.score_breakdown || '').slice(0, 500)}`
    : ''

  const statementPrompt = pathway === 'NIW'
    ? buildNIWPrompt(profile, narrative, evidenceSummary, strategyContext)
    : buildEB1APrompt(profile, narrative, evidenceSummary, strategyContext)

  const coverPrompt = buildCoverLetterPrompt(profile, pathway, evidenceSummary, narrative)

  // Generate both in parallel
  const [statementResponse, coverResponse] = await Promise.all([
    anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: statementPrompt }],
    }),
    anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: coverPrompt }],
    }),
  ])

  const personal_statement = statementResponse.content[0].type === 'text'
    ? statementResponse.content[0].text
    : ''

  const cover_letter = coverResponse.content[0].type === 'text'
    ? coverResponse.content[0].text
    : ''

  const word_count = (personal_statement + ' ' + cover_letter).split(/\s+/).length

  return {
    personal_statement,
    cover_letter,
    generated_at: new Date().toISOString(),
    pathway,
    word_count,
  }
}
