import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeGreenCardScoreFromSubscores } from '@/lib/scoring'
import type { StrategyAnswers, StrategyPreview, StrategyReport } from '@/lib/types'
import type { CareerMove } from '@/lib/ai/career-moves'
import CareerMovesClient from './CareerMovesClient'

export const dynamic = 'force-dynamic'

export default async function CareerMovesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, latestReportResult, subscriptionResult] = await Promise.all([
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
  ])

  const profile = profileResult.data
  const report = latestReportResult.data
  const subscription = subscriptionResult.data

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

  // Cached moves from profile
  const answers = report?.questionnaire_responses as StrategyAnswers | null
  const cachedMovesRaw = profile?.career_moves as { moves: CareerMove[]; generated_at?: string } | null
  const cachedMoves = cachedMovesRaw?.moves ?? null
  const generatedAt = cachedMovesRaw?.generated_at ?? null

  return (
    <CareerMovesClient
      initialMoves={cachedMoves}
      generatedAt={generatedAt}
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
