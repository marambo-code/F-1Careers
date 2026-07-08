// Human-readable labels and helpers for the Precedent Engine.
// Raw keys live in the database views; labels and mappings live here.

export type Pathway = 'EB1A' | 'NIW'

export const CRITERION_LABELS: Record<string, string> = {
  awards: 'Recognized awards',
  membership: 'Membership in elite associations',
  published_material: 'Published material about you',
  judging: 'Judging the work of others',
  original_contributions: 'Original contributions of major significance',
  scholarly_articles: 'Scholarly articles',
  exhibitions: 'Artistic exhibitions / display',
  leading_critical_role: 'Leading / critical role',
  high_salary: 'High salary / remuneration',
  commercial_success: 'Commercial success in the arts',
}

export const PRONG_LABELS: Record<string, string> = {
  dhanasar_prong_1: 'Prong 1 · Merit & national importance',
  dhanasar_prong_2: 'Prong 2 · Well positioned to advance it',
  dhanasar_prong_3: 'Prong 3 · Beneficial to waive the job offer',
}

export const FAILTAG_LABELS: Record<string, string> = {
  role_not_leading: 'Role not shown to be leading or critical',
  salary_not_comparative: 'Salary not benchmarked to the field',
  media_not_major: 'Press not in major / qualifying media',
  contribution_not_major_significance: 'Contributions not of major significance',
  membership_not_selective: 'Membership not selective enough',
  citations_not_significant: 'Citation record not significant',
  other: 'Other documented reason',

  // Expanded taxonomy (audit REC 3). These keys only appear in the data after
  // the founder runs scripts/precedent-failtag-retag.mjs --apply; adding the
  // labels ahead of time is display-only and harmless. Keep in sync with the
  // TAG SET block in that script (guarded by scripts/precedent.test.mjs).
  award_not_nationally_recognized: 'Award not nationally or internationally recognized',
  judging_not_documented: 'Judging participation not documented',
  exhibition_not_qualifying: 'Exhibition or showcase not qualifying',
  commercial_success_not_shown: 'Commercial success not documented',
  published_material_not_about_person: 'Published material not primarily about the petitioner',
  articles_not_scholarly: 'Articles not scholarly or not in qualifying media',
  evidence_credibility_questioned: 'Evidence credibility or authenticity questioned',
  final_merits_not_shown: 'Final merits: sustained acclaim not shown in totality',

  // NIW-specific tags carry a niw_ prefix so EB-1A surfaces (and the prompt
  // grounding block) can keep them out of EB-1A failure-pattern lists.
  niw_endeavor_too_vague: 'Proposed endeavor too vague or shifting',
  niw_importance_not_national: 'Impact local or employer-specific, not national',
  niw_merit_not_substantial: 'Substantial merit not established',
  niw_not_well_positioned: 'Record does not show petitioner well positioned',
  niw_progress_not_shown: 'No concrete progress, funding, or interest shown',
  niw_balance_not_favorable: 'Balance of factors does not favor waiving the job offer',
}

export const FIELD_LABELS: Record<string, string> = {
  business: 'business / entrepreneurship',
  computer_science: 'AI / software / data',
  engineering: 'engineering',
  medicine: 'medicine / clinical',
  sciences: 'sciences / research',
  arts: 'arts / design',
  athletics: 'athletics',
  other: 'other',
}

// Map UI field selections (Strategy profile, RFE wizard, explorer) onto the
// corpus field taxonomy. Loose by design — keeps the surface forgiving.
export function normalizeField(input?: string | null): string {
  if (!input) return 'business'
  const s = input.toLowerCase()
  if (/(software|comput|\bai\b|machine learning|data|developer|engineer.*soft)/.test(s)) return 'computer_science'
  if (/(medic|clinical|physician|doctor|nurse|health|pharma|dent)/.test(s)) return 'medicine'
  if (/(engineer|mechanical|civil|electrical|aerospace)/.test(s)) return 'engineering'
  if (/(scien|research|biolog|chemist|physic|math)/.test(s)) return 'sciences'
  if (/(art|design|music|film|paint|photo|dancer)/.test(s)) return 'arts'
  if (/(athlet|sport|coach|gymnast)/.test(s)) return 'athletics'
  if (/(business|entrepreneur|finance|market|founder|product|manage|econom)/.test(s)) return 'business'
  if (/(law|policy|education|teach)/.test(s)) return 'other'
  return FIELD_LABELS[s] ? s : 'other'
}

// Build the public uscis.gov URL for a decision from its source filename,
// e.g. "MAY222025_06B5203" -> the published PDF.
export function uscisUrl(sourceFile: string): string {
  const code = sourceFile.slice(-5)
  const folder =
    code === 'B2203'
      ? 'B2%20-%20Aliens%20with%20Extraordinary%20Ability'
      : 'B5%20-%20Members%20of%20the%20Professions%20holding%20Advanced%20Degrees%20or%20Aliens%20of%20Exceptional%20Ability'
  const year = sourceFile.slice(5, 9)
  return `https://www.uscis.gov/sites/default/files/err/${folder}/Decisions_Issued_in_${year}/${sourceFile}.pdf`
}

export const PATHWAY_LABEL: Record<Pathway, string> = { EB1A: 'EB-1A', NIW: 'EB-2 NIW' }
