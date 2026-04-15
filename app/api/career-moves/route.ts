/**
 * POST /api/career-moves
 * ─────────────────────────────────────────────────────────────────
 * Generates (or returns cached) career moves for the authenticated user.
 * Career moves are cached in profiles.career_moves; they're only
 * regenerated when the user's latest strategy report changes (score bump).
 *
 * Called:
 *  1. After a strategy report completes (server-side, auto-trigger)
 *  2. On demand from the dashboard "Refresh" button
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateCareerMoves } from '@/lib/ai/career-moves'
import { computeGreenCardScore } from '@/lib/scoring'
import type { StrategyAnswers } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const forceRefresh = body?.force === true

    const service = createServiceClient()

    // Fetch profile (for cached moves) and latest complete strategy report
    const [profileResult, reportResult] = await Promise.all([
      service.from('profiles').select('career_moves, career_moves_updated_at, linkedin_url').eq('id', user.id).single(),
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

    // Use cache if fresh (same report, not forced)
    const cachedMoves = profile?.career_moves as { moves: unknown[]; generated_at: string; report_id?: string } | null
    const cacheIsForReport = cachedMoves?.report_id === report.id
    if (!forceRefresh && cachedMoves && cacheIsForReport) {
      return NextResponse.json({ moves: cachedMoves.moves, cached: true })
    }

    // Compute current score from answers
    const score = computeGreenCardScore(answers)

    // Generate fresh moves (pass LinkedIn URL for personalization)
    const linkedInUrl = profile?.linkedin_url as string | undefined
    const result = await generateCareerMoves(answers, score, linkedInUrl)
    const toCache = { ...result, report_id: report.id }

    // Persist to profile
    await service
      .from('profiles')
      .update({ career_moves: toCache, career_moves_updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ moves: result.moves, cached: false })
  } catch (error) {
    console.error('[career-moves]', error)
    return NextResponse.json({ error: 'Failed to generate career moves' }, { status: 500 })
  }
}
