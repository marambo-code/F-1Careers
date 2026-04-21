/**
 * POST /api/career-moves
 * ─────────────────────────────────────────────────────────────────
 * Generates (or returns cached) career moves for the authenticated user.
 *
 * Career moves are stored in `career_move_sets` — each generation creates
 * a new row (is_current=true) and archives the previous set (is_current=false).
 * This preserves full history across regenerations.
 *
 * Cache logic:
 *  - Returns the current set if it matches the latest report_id AND force=false
 *  - Archives current set + inserts new row on force=true or report mismatch
 *
 * Returns: { moves, cached, setId }
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateCareerMoves } from '@/lib/ai/career-moves'
import { computeGreenCardScore } from '@/lib/scoring'
import { checkRateLimit } from '@/lib/rate-limit'
import type { StrategyAnswers } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const forceRefresh = body?.force === true

    // Rate limit: 15 generations per 24h per user
    const rateLimit = await checkRateLimit(user.id, 'career-moves')
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return NextResponse.json(
        { error: 'rate_limited', message: `Limit reached. Resets at ${resetTime}.` },
        { status: 429 }
      )
    }

    const service = createServiceClient()

    // Fetch latest complete strategy report + profile (for LinkedIn URL)
    const [profileResult, reportResult] = await Promise.all([
      service.from('profiles').select('linkedin_url, career_moves').eq('id', user.id).single(),
      service
        .from('reports')
        .select('id, questionnaire_responses, report_data, created_at')
        .eq('user_id', user.id)
        .eq('type', 'strategy')
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const profile = profileResult.data
    const report = reportResult.data

    if (!report) {
      return NextResponse.json({ error: 'no_report', message: 'Complete a Green Card Strategy report first.' }, { status: 200 })
    }

    const answers = report.questionnaire_responses as StrategyAnswers | null
    if (!answers) {
      return NextResponse.json({ error: 'no_answers' }, { status: 200 })
    }

    // Check cache — try career_move_sets first, fall back to profiles.career_moves
    let cachedSetId: string | null = null
    try {
      const { data: currentSet } = await service
        .from('career_move_sets')
        .select('id, moves, generated_at')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .eq('report_id', report.id)
        .maybeSingle()

      if (!forceRefresh && currentSet) {
        return NextResponse.json({ moves: currentSet.moves, cached: true, setId: currentSet.id })
      }
      cachedSetId = currentSet?.id ?? null
    } catch {
      // career_move_sets table may not exist yet — fall through to legacy check
    }

    // Legacy cache check: profiles.career_moves
    if (!forceRefresh && !cachedSetId) {
      const cachedMoves = profile?.career_moves as { moves: unknown[]; generated_at: string; report_id?: string } | null
      if (cachedMoves?.report_id === report.id && cachedMoves?.moves?.length) {
        return NextResponse.json({ moves: cachedMoves.moves, cached: true, setId: 'legacy' })
      }
    }

    // Generate fresh moves
    const score = computeGreenCardScore(answers)
    const linkedInUrl = profile?.linkedin_url as string | undefined
    const reportData = report.report_data as Record<string, unknown> | null
    const result = await generateCareerMoves(answers, score, linkedInUrl, reportData)

    // Persist — try career_move_sets, fall back to profiles.career_moves
    let newSetId: string = 'legacy'
    try {
      // Archive old current sets
      await service
        .from('career_move_sets')
        .update({ is_current: false })
        .eq('user_id', user.id)
        .eq('is_current', true)

      // Insert new set
      const { data: newSet } = await service
        .from('career_move_sets')
        .insert({
          user_id: user.id,
          report_id: report.id,
          moves: result.moves,
          generated_at: new Date().toISOString(),
          is_current: true,
        })
        .select('id')
        .single()

      if (newSet?.id) newSetId = newSet.id
    } catch {
      // Table doesn't exist yet — persist to profiles.career_moves instead
    }

    // Always keep profiles.career_moves in sync as fallback storage
    await service
      .from('profiles')
      .update({
        career_moves: { moves: result.moves, generated_at: new Date().toISOString(), report_id: report.id },
        career_moves_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ moves: result.moves, cached: false, setId: newSetId })
  } catch (error) {
    console.error('[career-moves]', error)
    return NextResponse.json({ error: 'Failed to generate career moves' }, { status: 500 })
  }
}
