/**
 * lib/data/petition-evidence.ts
 * ─────────────────────────────────────────────────────────────────
 * Evidence checklist items for EB-2 NIW and EB-1A self-petitions.
 * Based on Dhanasar (26 I&N Dec. 884) for NIW and 8 CFR §204.5(h) for EB-1A.
 *
 * Each item has an estimated_days weight used to compute the Runway counter.
 * Days reflect realistic solo acquisition time — many items run in parallel,
 * so the UI applies a 0.6 parallel-work factor to the raw sum.
 */

export type EvidenceStatus = 'todo' | 'in_progress' | 'done'

export interface EvidenceItem {
  id: string
  group: string          // Prong / Criterion / Section label
  label: string          // Short action label
  description: string    // Why this matters to the adjudicator
  estimated_days: number // Solo acquisition time
  status: EvidenceStatus
  notes: string
}

// ── NIW (Dhanasar) ───────────────────────────────────────────────────────────

export const NIW_EVIDENCE_TEMPLATE: Omit<EvidenceItem, 'status' | 'notes'>[] = [
  // Prong 1 — Substantial Merit & National Importance
  {
    id: 'niw_p1_endeavor',
    group: 'Prong 1 — Substantial Merit & National Importance',
    label: 'Define your proposed endeavor',
    description: 'Write 1–3 sentences describing the specific work you will pursue after approval — not your career, the endeavor. Every document in your petition must use identical language.',
    estimated_days: 7,
  },
  {
    id: 'niw_p1_national_priority',
    group: 'Prong 1 — Substantial Merit & National Importance',
    label: 'Connect endeavor to a national priority area',
    description: 'Map your work to a recognized US priority: STEM innovation, public health, national security, clean energy, education, or economic development. Cite a federal agency or policy document.',
    estimated_days: 10,
  },
  {
    id: 'niw_p1_sources',
    group: 'Prong 1 — Substantial Merit & National Importance',
    label: 'Gather 2+ sources documenting national importance',
    description: 'Congressional reports, NSF/NIH funding announcements, White House priorities, or industry reports showing the field matters nationally — not just at your institution.',
    estimated_days: 14,
  },

  // Prong 2 — Well-Positioned to Advance
  {
    id: 'niw_p2_degree',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: 'Advanced degree documentation ready',
    description: 'Official transcripts, degree certificate, or equivalency evaluation. Required to establish the advanced degree foundation.',
    estimated_days: 7,
  },
  {
    id: 'niw_p2_publications',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: '3+ peer-reviewed publications in your field',
    description: 'Published or accepted papers in peer-reviewed journals or top conference proceedings. Quality matters more than quantity — one Nature paper beats ten minor journals.',
    estimated_days: 90,
  },
  {
    id: 'niw_p2_citations',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: '100+ independent citations (STEM target)',
    description: 'Citations from researchers who are not your co-authors or lab members. Pull your Google Scholar profile and document the count with a screenshot.',
    estimated_days: 90,
  },
  {
    id: 'niw_p2_peer_review',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: '2+ peer review invitations',
    description: 'Invitations to review manuscripts for journals or grant proposals — shows the field recognizes your expertise. Save the invitation emails.',
    estimated_days: 45,
  },
  {
    id: 'niw_p2_speaking',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: '1+ speaking invitation at recognized conference',
    description: 'Invited talk (not submitted abstract) at a professional conference in your field. Keynote or panel invitation carries more weight.',
    estimated_days: 60,
  },
  {
    id: 'niw_p2_momentum',
    group: 'Prong 2 — Well-Positioned to Advance',
    label: 'Evidence of momentum in the US',
    description: 'Job offer, research collaboration with US institution, grant funding, or active US-based project. Adjudicators want proof you can actually execute the endeavor here.',
    estimated_days: 30,
  },

  // Prong 3 — Waiver Serves National Interest
  {
    id: 'niw_p3_rec_letters',
    group: 'Prong 3 — Waiver of Job Offer Serves National Interest',
    label: '3+ independent expert recommendation letters',
    description: 'From experts you have never worked with directly — not your advisor, co-authors, or colleagues. Independence is the single most scrutinized element in 2025 adjudications.',
    estimated_days: 60,
  },
  {
    id: 'niw_p3_letter_quality',
    group: 'Prong 3 — Waiver of Job Offer Serves National Interest',
    label: 'Each letter explicitly references your proposed endeavor',
    description: 'Every recommendation letter must use the exact same endeavor language. Divergent descriptions across letters are a primary RFE trigger identified in 2024 AAO decisions.',
    estimated_days: 14,
  },
  {
    id: 'niw_p3_waiver_argument',
    group: 'Prong 3 — Waiver of Job Offer Serves National Interest',
    label: 'Draft waiver justification argument',
    description: 'Explain why requiring a job offer would be contrary to the national interest — typically: your work is too important to be delayed by the labor market, and you can self-start.',
    estimated_days: 14,
  },

  // Petition Documents
  {
    id: 'niw_doc_endeavor_statement',
    group: 'Petition Documents',
    label: 'Personal statement / petition letter drafted',
    description: 'A legal brief — not a CV narrative. Opens with the proposed endeavor, argues each Dhanasar prong with evidence, and closes with the national interest waiver justification.',
    estimated_days: 21,
  },
  {
    id: 'niw_doc_cover_letter',
    group: 'Petition Documents',
    label: 'Cover letter drafted',
    description: 'Maps each piece of evidence to the specific prong it supports. Adjudicators use this as a roadmap — missing cover letters result in evidence being overlooked.',
    estimated_days: 7,
  },
  {
    id: 'niw_doc_exhibits',
    group: 'Petition Documents',
    label: 'Evidence exhibits organized and labeled',
    description: 'Tab-divided exhibits with a master index. Each exhibit labeled with the criterion it supports. Professional presentation signals a credible, attorney-quality petition.',
    estimated_days: 7,
  },
]

// ── EB-1A (8 CFR §204.5(h)) ──────────────────────────────────────────────────

export const EB1A_EVIDENCE_TEMPLATE: Omit<EvidenceItem, 'status' | 'notes'>[] = [
  // Must meet 3 of 10 criteria
  {
    id: 'eb1a_awards',
    group: 'Criterion 1 — Awards',
    label: 'Nationally/internationally recognized prizes or awards',
    description: 'Document awards in your field that carry national or international recognition — not local or institutional awards. Include the selection criteria and number of recipients.',
    estimated_days: 30,
  },
  {
    id: 'eb1a_membership',
    group: 'Criterion 2 — Membership',
    label: 'Membership in associations requiring outstanding achievement',
    description: 'Professional associations where membership requires evaluation by peers and outstanding achievement — not general membership organizations.',
    estimated_days: 30,
  },
  {
    id: 'eb1a_press',
    group: 'Criterion 3 — Published Material About You',
    label: 'Published material about you in major media',
    description: 'Articles in newspapers, industry publications, or online outlets writing about YOU — not articles you wrote. University press releases do not qualify as "major media."',
    estimated_days: 60,
  },
  {
    id: 'eb1a_judging',
    group: 'Criterion 4 — Judging',
    label: 'Participation as judge of others\' work',
    description: 'Peer review, grant committee, competition judging, dissertation committee, editorial board. Save invitation emails and any confirmation of service.',
    estimated_days: 30,
  },
  {
    id: 'eb1a_contributions',
    group: 'Criterion 5 — Original Contributions of Major Significance',
    label: 'Original contributions of major significance to the field',
    description: 'The hardest criterion to prove. Requires demonstrating that your specific work changed how others in the field operate — not just that you published. Citation impact, adoption by others, or commercial application.',
    estimated_days: 90,
  },
  {
    id: 'eb1a_scholarly',
    group: 'Criterion 6 — Scholarly Articles',
    label: 'Scholarly articles in professional publications',
    description: 'Peer-reviewed publications in your field. Compile full citations with journal impact factors. AAO has found that authoring 3+ articles in reputable journals satisfies this criterion.',
    estimated_days: 60,
  },
  {
    id: 'eb1a_critical_role',
    group: 'Criterion 7 — Critical Role',
    label: 'Critical or essential role in distinguished organizations',
    description: 'Evidence you played a key role — not just employment — at a distinguished company, institution, or organization. Performance reviews, org charts, or letters from leadership explaining your specific contribution.',
    estimated_days: 30,
  },
  {
    id: 'eb1a_high_salary',
    group: 'Criterion 8 — High Salary',
    label: 'High salary relative to peers in the field',
    description: 'Pay stubs + Bureau of Labor Statistics or industry survey data showing your compensation is in the top tier for your field and geography.',
    estimated_days: 14,
  },

  // Recommendation letters
  {
    id: 'eb1a_rec_letters',
    group: 'Recommendation Letters',
    label: '6+ expert recommendation letters',
    description: 'Mix of independent experts (3+) and close collaborators (2–3). Independent letters carry more weight. Each must speak to specific criteria with concrete examples.',
    estimated_days: 60,
  },
  {
    id: 'eb1a_letter_independence',
    group: 'Recommendation Letters',
    label: 'Majority of letters from non-collaborators',
    description: 'At least 3 letters from experts who have not co-authored with you or supervised you. They must explain how they know your work and why it is extraordinary.',
    estimated_days: 45,
  },

  // Petition Documents
  {
    id: 'eb1a_doc_petition',
    group: 'Petition Documents',
    label: 'Petition letter: legal brief format',
    description: 'Argues each criterion methodically with specific evidence. Not a resume. Opens with a summary of extraordinary ability, then maps every piece of evidence to a specific criterion.',
    estimated_days: 21,
  },
  {
    id: 'eb1a_doc_cover',
    group: 'Petition Documents',
    label: 'Cover letter with evidence index',
    description: 'Maps each exhibit to the criterion it supports. The adjudicator uses this to navigate your package — disorganized submissions are a primary avoidable RFE trigger.',
    estimated_days: 7,
  },
  {
    id: 'eb1a_doc_exhibits',
    group: 'Petition Documents',
    label: 'Exhibits tabbed and labeled',
    description: 'Organized exhibit package with tab dividers, consistent labeling (Ex. A, Ex. B…), and a master exhibit list at the front.',
    estimated_days: 7,
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export type Pathway = 'NIW' | 'EB-1A'

export function getTemplateForPathway(pathway: Pathway): EvidenceItem[] {
  const template = pathway === 'NIW' ? NIW_EVIDENCE_TEMPLATE : EB1A_EVIDENCE_TEMPLATE
  return template.map(item => ({ ...item, status: 'todo' as EvidenceStatus, notes: '' }))
}

export function computeRunwayDays(items: EvidenceItem[]): number {
  const undone = items.filter(i => i.status !== 'done')
  if (undone.length === 0) return 0
  const rawDays = undone.reduce((sum, i) => sum + i.estimated_days, 0)
  // 0.6 parallel-work factor — most items can run concurrently
  return Math.round(rawDays * 0.6)
}

export function getGroupedItems(items: EvidenceItem[]): Record<string, EvidenceItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, EvidenceItem[]>)
}

// Current approval rate data — update periodically from USCIS/Lawfully
export const APPROVAL_SIGNALS = {
  NIW: {
    overall: { rate: 44, trend: 'down', label: 'Overall NIW' },
    stem: { rate: 90, trend: 'stable', label: 'STEM professionals' },
    entrepreneur: { rate: 45, trend: 'down', label: 'Entrepreneurs / consultants' },
    lastUpdated: 'March 2026',
    source: 'Lawfully / USCIS data',
  },
  'EB-1A': {
    overall: { rate: 62, trend: 'stable', label: 'Overall EB-1A' },
    stem: { rate: 71, trend: 'stable', label: 'STEM / researchers' },
    entrepreneur: { rate: 55, trend: 'down', label: 'Artists / athletes / entrepreneurs' },
    lastUpdated: 'March 2026',
    source: 'USCIS Q2 FY2025 data',
  },
}

export const SERVICE_CENTERS = [
  { code: 'NSC', name: 'Nebraska Service Center', note: 'Moderate RFE rate' },
  { code: 'TSC', name: 'Texas Service Center', note: 'Highest RFE rate in 2025' },
  { code: 'VSC', name: 'Vermont Service Center', note: 'Lower volume, faster processing' },
  { code: 'CSC', name: 'California Service Center', note: 'Moderate RFE rate' },
]
