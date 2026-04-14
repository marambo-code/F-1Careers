/**
 * lib/scoring.ts
 * ─────────────────────────────────────────────────────────────────
 * Green Card Score — single 0-100 composite that reflects a user's
 * current petition readiness across both NIW and EB-1A pathways.
 *
 * Formula design goals
 *  • Higher is always better; 70+ = ready to file, 85+ = strong case
 *  • Weighted toward the BEST pathway (NIW or EB-1A), not the average
 *  • Days-left urgency applies a small pressure factor (not a penalty)
 *  • Output is deterministic — same inputs always produce the same score
 */

import type { StrategyAnswers } from '@/lib/types'
import { computeNIWScore, computeEB1AScore } from '@/lib/ai/strategy-engine'

export interface GreenCardScore {
  overall: number           // 0-100 composite
  niw: number               // raw NIW 0-100
  eb1a: number              // raw EB-1A 0-100
  bestPathway: 'NIW' | 'EB-1A'
  label: 'Exceptional' | 'Strong' | 'Developing' | 'Early'
  labelColor: 'teal' | 'blue' | 'yellow' | 'red'
  readyToFile: boolean
  progressPct: number       // same as overall, convenient alias
}

/**
 * Compute the composite Green Card Score from strategy questionnaire answers.
 *
 * @param answers  StrategyAnswers from the questionnaire
 * @param daysLeft Optional days remaining on current visa status (adds urgency context)
 */
export function computeGreenCardScore(
  answers: StrategyAnswers,
  daysLeft?: number,
): GreenCardScore {
  const { score: niwRaw } = computeNIWScore(answers)
  const { score: eb1aRaw } = computeEB1AScore(answers)

  // The "best pathway" is whichever score is higher
  const bestPathway: 'NIW' | 'EB-1A' = niwRaw >= eb1aRaw ? 'NIW' : 'EB-1A'
  const best = Math.max(niwRaw, eb1aRaw)
  const other = Math.min(niwRaw, eb1aRaw)

  // Weighted composite: 75% best pathway + 25% secondary
  const composite = best * 0.75 + other * 0.25

  // Small urgency bonus (max +4 pts) — rewards taking action sooner
  // Users with < 6 months left get the full bonus
  let urgencyBonus = 0
  if (daysLeft !== undefined && daysLeft <= 180) {
    urgencyBonus = Math.round(4 * (1 - daysLeft / 180))
  }

  const overall = Math.min(98, Math.max(5, Math.round(composite + urgencyBonus)))

  const label =
    overall >= 80 ? 'Exceptional' :
    overall >= 60 ? 'Strong' :
    overall >= 35 ? 'Developing' : 'Early'

  const labelColor =
    overall >= 80 ? 'teal' :
    overall >= 60 ? 'blue' :
    overall >= 35 ? 'yellow' : 'red'

  return {
    overall,
    niw: niwRaw,
    eb1a: eb1aRaw,
    bestPathway,
    label,
    labelColor,
    readyToFile: overall >= 65,
    progressPct: overall,
  }
}

/**
 * Compute score directly from pre-computed NIW/EB-1A subscores.
 * Use this when you don't have the full StrategyAnswers (e.g. from DB records).
 */
export function computeGreenCardScoreFromSubscores(
  niwScore: number,
  eb1aScore: number,
): Omit<GreenCardScore, 'niw' | 'eb1a'> & { niw: number; eb1a: number } {
  const best = Math.max(niwScore, eb1aScore)
  const other = Math.min(niwScore, eb1aScore)
  const composite = best * 0.75 + other * 0.25
  const overall = Math.min(98, Math.max(5, Math.round(composite)))
  const bestPathway: 'NIW' | 'EB-1A' = niwScore >= eb1aScore ? 'NIW' : 'EB-1A'

  const label =
    overall >= 80 ? 'Exceptional' :
    overall >= 60 ? 'Strong' :
    overall >= 35 ? 'Developing' : 'Early'

  const labelColor =
    overall >= 80 ? 'teal' :
    overall >= 60 ? 'blue' :
    overall >= 35 ? 'yellow' : 'red'

  return {
    overall,
    niw: niwScore,
    eb1a: eb1aScore,
    bestPathway,
    label,
    labelColor,
    readyToFile: overall >= 65,
    progressPct: overall,
  }
}
