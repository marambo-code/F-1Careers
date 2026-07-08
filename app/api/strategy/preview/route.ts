// One short Anthropic call (per-request timeout 45s, no retries). Explicit
// maxDuration so the platform default can never kill it mid-generation.
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyPreview, computeNIWScore, computeEB1AScore } from '@/lib/ai/strategy-engine'
import { stripDashesDeep } from '@/lib/sanitize'
import {
  consumeMonthlyQuota,
  isProMember,
  STRATEGY_REGEN_MONTHLY_LIMIT,
  STRATEGY_REGEN_ROUTE,
} from '@/lib/usage-limits'

// NIW benchmark text based on score
function niwBenchmark(score: number, field: string): string {
  const fieldLabel = field?.includes('stem') ? 'STEM / tech' :
    field === 'medicine' ? 'medicine / healthcare' :
    field === 'business' ? 'business / finance' :
    'your field'

  if (score >= 80) return `Top 10% of NIW filers in ${fieldLabel}. Exceptionally strong case.`
  if (score >= 65) return `Above average for ${fieldLabel}. Typical successful NIW filers score 65-75.`
  if (score >= 50) return `Typical successful NIW filers in ${fieldLabel} score 65-75. You're close, targeted gap-filling will get you there.`
  if (score >= 35) return `Typical successful NIW filers in ${fieldLabel} score 65-75. You're at the 35th percentile, gaps need addressing before filing.`
  return `Typical successful NIW filers in ${fieldLabel} score 65-75. Significant development needed before a viable petition.`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, answers } = await req.json()

    // Verify ownership
    const { data: report } = await supabase
      .from('reports')
      .select('id, user_id, regen_count, preview_data')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // ── Regeneration gate (server-side, authoritative) ─────────────
    // A first-ever preview has regen_count 0 and no prior preview_data.
    // Anything else is a regeneration: free members get 1 total per report,
    // Pro members get STRATEGY_REGEN_MONTHLY_LIMIT per calendar month
    // (counted in rate_limits, route 'strategy-regen-monthly').
    const isRegen = (report.regen_count ?? 0) > 0 || report.preview_data != null
    let regenerations: { limit: number; remaining: number; resetsOn?: string } | null = null

    if (isRegen) {
      const pro = await isProMember(user.id)
      if (!pro) {
        // Free policy: one regeneration per report. regen_count was already
        // incremented to 1 by the questionnaire on that single allowed edit.
        if ((report.regen_count ?? 0) > 1) {
          return NextResponse.json({
            error: 'regen_limit_free',
            message: 'Free members can regenerate their preview once. Upgrade to Pro for 3 regenerations per month.',
          }, { status: 403 })
        }
      } else {
        const quota = await consumeMonthlyQuota(user.id, STRATEGY_REGEN_ROUTE, STRATEGY_REGEN_MONTHLY_LIMIT)
        if (!quota.allowed) {
          return NextResponse.json({
            error: 'regen_limit_pro',
            message: `You have used all ${STRATEGY_REGEN_MONTHLY_LIMIT} regenerations for this month. Your allowance resets on the 1st.`,
            resetsOn: quota.resetsOn,
          }, { status: 403 })
        }
        regenerations = { limit: quota.limit, remaining: quota.remaining, resetsOn: quota.resetsOn }
      }
    }

    // Generate AI preview (pathways, strength, teaser)
    const aiPreview = stripDashesDeep(await generateStrategyPreview(answers))

    // Inject algorithmically computed scores, same functions used by the full report
    const niw = computeNIWScore(answers)
    const eb1a = computeEB1AScore(answers)

    const preview = {
      ...aiPreview,
      niw_score: niw.score,
      niw_benchmark: niwBenchmark(niw.score, answers.field_of_work),
      eb1a_score: eb1a.score,
    }

    // Save preview to report
    const service = createServiceClient()
    await service
      .from('reports')
      .update({ preview_data: preview, status: 'pending' })
      .eq('id', reportId)

    return NextResponse.json({ success: true, preview, regenerations })
  } catch (error) {
    console.error('Strategy preview error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
