import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeGreenCardScoreFromSubscores } from '@/lib/scoring'
import type { StrategyAnswers, StrategyPreview, StrategyReport } from '@/lib/types'
import type { CareerMove } from '@/lib/ai/career-moves'
import type { MoveStatus } from '@/app/api/career-moves/update/route'
import CareerMovesClient from './CareerMovesClient'

export const dynamic = 'force-dynamic'

export type TrackedMove = CareerMove & {
  status?: MoveStatus
  notes?: string
  completed?: boolean
}

export interface MoveSet {
  id: string
  generated_at: string
  moves: TrackedMove[]
  is_current: boolean
}

export default async function CareerMovesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, latestReportResult, subscriptionResult, setsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('reports')
      .select('id, questionnaire_responses, report_data, preview_data, created_at')
      .eq('user_id', user.id)
      .eq('type', 'strategy')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('subscriptions').select('status').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('career_move_sets')
      .select('id, moves, generated_at, is_current')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false }),
  ])

  const profile = profileResult.data
  const report = latestReportResult.data
  const subscription = subscriptionResult.data
  let allSets: MoveSet[] = (setsResult.data ?? []) as MoveSet[]

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'
  const hasStrategyReport = !!report

  // Green Card Score
  const preview = report?.preview_data as StrategyPreview | null
  const fullReport = report?.report_data as StrategyReport | null
  const niwScore = fullReport?.petition_readiness?.niw_score ?? preview?.niw_score ?? null
  const eb1aScore = fullReport?.petition_readiness?.eb1a_score ?? preview?.eb1a_score ?? null
  const greenCardScore = (niwScore !== null && eb1aScore !== null)
    ? computeGreenCardScoreFromSubscores(niwScore, eb1aScore)
    : null

  const answers = report?.questionnaire_responses as StrategyAnswers | null

  // ── Legacy migration ──────────────────────────────────────────────
  // If no career_move_sets rows exist, migrate from profiles.career_moves
  if (allSets.length === 0) {
    const legacy = profile?.career_moves as {
      moves: CareerMove[];
      generated_at?: string;
      report_id?: string;
    } | null

    if (legacy?.moves?.length) {
      const service = createServiceClient()
      const { data: migrated } = await service
        .from('career_move_sets')
        .insert({
          user_id: user.id,
          report_id: legacy.report_id ?? report?.id ?? null,
          moves: legacy.moves,
          generated_at: legacy.generated_at ?? new Date().toISOString(),
          is_current: true,
        })
        .select('id, moves, generated_at, is_current')
        .single()

      if (migrated) allSets = [migrated as MoveSet]
    }
  }

  const currentSet = allSets.find(s => s.is_current) ?? null
  const pastSets = allSets.filter(s => !s.is_current)

  return (
    <CareerMovesClient
      currentSet={currentSet}
      pastSets={pastSets}
      isPro={isPro}
      hasStrategyReport={hasStrategyReport}
      greenCardScore={greenCardScore}
      niwScore={niwScore}
      eb1aScore={eb1aScore}
      reportId={report?.id ?? null}
      fieldOfWork={answers?.field_of_work ?? null}
    />
  )
}
