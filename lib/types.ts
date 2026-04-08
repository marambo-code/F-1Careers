// ─── User & Profile ───────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string | null
  university: string | null
  degree: string | null
  field_of_study: string | null
  graduation_date: string | null
  visa_status: VisaStatus | null
  career_goal: CareerGoal | null
  linkedin_url: string | null
  resume_path: string | null
  resume_filename: string | null
  created_at: string
  updated_at: string
}

export type VisaStatus =
  | 'F-1 CPT'
  | 'F-1 OPT'
  | 'F-1 OPT STEM'
  | 'H-1B'
  | 'H-1B1'
  | 'O-1'
  | 'EB-2 NIW Pending'
  | 'Green Card'
  | 'Other'

export type CareerGoal =
  | 'First job / internship'
  | 'H-1B sponsorship'
  | 'Green card (EB pathway)'
  | 'Switching employers'
  | 'Other'

// ─── Reports ─────────────────────────────────────────────────────
export interface Report {
  id: string
  user_id: string
  type: 'strategy' | 'rfe'
  status: 'pending' | 'paid' | 'generating' | 'complete' | 'error'
  questionnaire_responses: StrategyAnswers | RFEAnswers | null
  rfe_document_path: string | null
  rfe_document_text: string | null
  report_data: StrategyReport | RFEReport | null
  preview_data: StrategyPreview | RFEPreview | null
  stripe_session_id: string | null
  amount_paid: number | null
  created_at: string
  updated_at: string
}

// ─── Strategy Engine Types ────────────────────────────────────────

/**
 * Criteria rating scale (matches HTML reference tool):
 *   0 = None  |  1 = Weak  |  2 = Moderate  |  3 = Strong  |  4 = Exceptional
 */
export const STRENGTH_LABELS = ['None', 'Weak', 'Moderate', 'Strong', 'Exceptional'] as const
export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export interface StrategyAnswers {
  // ── Profile (pre-filled) ─────────────────────────────────────────
  full_name: string
  university: string
  degree: string
  field_of_study: string
  graduation_date: string
  visa_status: string
  career_goal: string

  // ── Step 1: Background ───────────────────────────────────────────
  /** stem_cs | stem_bio | stem_phys | stem_eng | business | medicine | arts | sports | education | law | other */
  field_of_work: string
  /** e.g. "NLP research", "oncology drug discovery" */
  subfield: string
  /** bachelors | masters | phd | md | other */
  education_level: string
  /** '1' = <1yr  '3' = 1-3yr  '6' = 3-6yr  '11' = 6-11yr  '16' = 11+yr */
  years_in_field: string
  current_role: string
  current_employer: string
  us_salary: string
  /** '3' | '6' | '12' | '18' months */
  filing_timeline: string
  /** Narrative: key contributions, why work is significant, national benefit */
  work_description: string

  // ── Step 2: EB-1A Criteria (0–4) ────────────────────────────────
  /** §204.5(h)(3)(i)  — Awards & prizes in the field */
  cr_awards: number
  /** §204.5(h)(3)(ii) — Membership in associations requiring outstanding achievement */
  cr_membership: number
  /** §204.5(h)(3)(iii)— Published material about the alien in professional media */
  cr_press: number
  /** §204.5(h)(3)(iv) — Judging the work of others */
  cr_judging: number
  /** §204.5(h)(3)(v)  — Original contributions of major significance */
  cr_contributions: number
  /** §204.5(h)(3)(vi) — Scholarly articles in professional journals */
  cr_scholarly: number
  /** §204.5(h)(3)(vii)— Artistic display/exhibition in prestigious venues */
  cr_display: number
  /** §204.5(h)(3)(viii)— Critical or leading role in distinguished orgs */
  cr_critical_role: number
  /** §204.5(h)(3)(ix) — High salary relative to peers */
  cr_high_salary: number
  /** §204.5(h)(3)(x)  — Commercial success in performing arts */
  cr_commercial: number

  // ── Step 2: Evidence notes (optional free text per key criterion) ─
  notes_awards: string
  notes_scholarly: string
  notes_contributions: string
  notes_press: string
  notes_critical_role: string

  // ── Step 3: EB-2 NIW — Dhanasar Three-Prong Analysis (0–4) ─────
  /** Prong 1: Substantial merit & national importance */
  niw_prong1: number
  /** Prong 2: Well-positioned to advance the endeavor */
  niw_prong2: number
  /** Prong 3: On balance, national interest justifies waiving job offer */
  niw_prong3: number
  /** What the petitioner will do in the US and why it matters nationally */
  proposed_endeavor: string

  // ── Step 4: Context & Goals ──────────────────────────────────────
  employer_support: string
  attorney_consulted: string
  biggest_concern: string

  // ── Legacy fields (kept for backward compat with existing reports) ─
  publications_count?: string
  publications_detail?: string
  citations_count?: string
  awards?: string
  media_coverage?: string
  speaking_engagements?: string
  patents?: string
  professional_memberships?: string
  critical_role_evidence?: string
}

export interface StrategyPreview {
  applicable_pathways: string[]
  top_pathway: string
  overall_strength: 'Strong' | 'Developing' | 'Early'
  teaser: string
}

export interface StrategyReport {
  career_visa_assessment: {
    summary: string
    pathways: PathwayAssessment[]
  }
  criterion_breakdown: CriterionBreakdown[]
  evidence_mapping: EvidenceItem[]
  gap_analysis: GapItem[]
  roadmap: {
    three_month: string[]
    six_month: string[]
    twelve_month: string[]
  }
  recommended_next_step: string
  disclaimer: string
}

export interface PathwayAssessment {
  pathway: string
  feasibility: 'High' | 'Medium' | 'Low'
  rationale: string
}

export interface CriterionBreakdown {
  pathway: string
  criterion: string
  rating: 'Strong' | 'Developing' | 'Gap'
  evidence_summary: string
}

export interface EvidenceItem {
  criterion: string
  evidence: string[]
}

export interface GapItem {
  gap: string
  materiality: 'High' | 'Medium' | 'Low'
  action: string
}

// ─── RFE Analyzer Types ───────────────────────────────────────────

export interface RFEAnswers {
  /** eb1a | eb2niw | eb1b | o1 | eb2perm */
  petition_type: string
  /** stem | medicine | business | arts | sports | law | education */
  rfe_field: string
  /** Any extra context the user provides */
  additional_context: string
}

export interface RFEPreview {
  case_type: string
  issue_count: number
  high_risk_count: number
  teaser: string
}

export interface RFEReport {
  case_type: string
  issue_registry: RFEIssue[]
  priority_action_list: string[]
  disclaimer: string
}

export interface RFEIssue {
  number: number
  title: string
  plain_english: string
  evidence_gaps: string[]
  risk_level: 'High' | 'Medium' | 'Low'
  response_strategy: 'Rebut' | 'Supplement' | 'Narrow'
  strategy_rationale: string
}
