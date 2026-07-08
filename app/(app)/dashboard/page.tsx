import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteReportButton from '@/components/ui/DeleteReportButton'
import CountryAlert from '@/components/dashboard/CountryAlert'
import AdminAlertBanner from '@/components/dashboard/AdminAlertBanner'
import StrategyResumeCard from '@/components/dashboard/StrategyResumeCard'
import { greetingFor } from '@/lib/greetings'
import { computeGreenCardScoreFromSubscores } from '@/lib/scoring'
import type { StrategyPreview, StrategyReport, StrategyAnswers } from '@/lib/types'
import type { CareerMove } from '@/lib/ai/career-moves'
import type { EvidenceItem } from '@/lib/data/petition-evidence'
import { computeRunwayDays } from '@/lib/data/petition-evidence'

export const dynamic = 'force-dynamic'

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(yearMonth: string): number | null {
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) return null
  const [y, m] = yearMonth.split('-').map(Number)
  const expiry = new Date(y, m, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
}

function optUrgencyColor(days: number | null): string {
  if (days === null) return 'text-mid'
  if (days <= 60) return 'text-red-500'
  if (days <= 180) return 'text-yellow-600'
  return 'text-teal'
}

type Stage = 1 | 2 | 3 | 4 | 5

function getUserStage({
  hasStrategyReport,
  hasCareerMoves,
  evidenceDone,
  evidenceTotal,
  hasNarrative,
  hasGeneratedPetition,
}: {
  hasStrategyReport: boolean
  hasCareerMoves: boolean
  evidenceDone: number
  evidenceTotal: number
  hasNarrative: boolean
  hasGeneratedPetition: boolean
}): Stage {
  if (!hasStrategyReport) return 1
  if (!hasCareerMoves || evidenceDone === 0) return 2
  if (!hasNarrative || evidenceDone / Math.max(evidenceTotal, 1) < 0.5) return 3
  if (!hasGeneratedPetition) return 4
  return 5
}

const STAGES = [
  { n: 1, label: 'Know Your Chances', short: 'Chances', icon: '📊' },
  { n: 2, label: 'Build Your Evidence', short: 'Evidence', icon: '📋' },
  { n: 3, label: 'Write Your Case', short: 'Case', icon: '✍️' },
  { n: 4, label: 'Assemble Package', short: 'Package', icon: '📄' },
  { n: 5, label: 'Ready to File', short: 'File', icon: '🚀' },
]

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const strokeColor =
    color === 'teal' ? '#14B8A6' :
    color === 'yellow' ? '#D97706' : '#F97316'
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
      <circle cx="44" cy="44" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="7" />
      <circle cx="44" cy="44" r={radius} fill="none" stroke={strokeColor} strokeWidth="7"
        strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round" />
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, reportsResult, subscriptionResult, scoreHistoryResult, currentMoveSetResult, petitionResult] = await Promise.all([
    supabase.from('profiles').select('*, country_of_birth').eq('id', user.id).single(),
    // Bounded: each row can carry a multi-hundred-KB report_data blob, and the
    // dashboard only needs the latest few reports per type.
    supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('subscriptions').select('status, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('score_history').select('green_card_score, niw_score, eb1a_score, created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(12),
    supabase.from('career_move_sets').select('moves').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
    supabase.from('petition_progress').select('evidence_items, narrative_text, generated_petition').eq('user_id', user.id).maybeSingle(),
  ])

  const profile = profileResult.data
  const reports = reportsResult.data ?? []
  const subscription = subscriptionResult.data
  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // Strategy data, distinguish between paid/complete and pending (preview only, unpaid)
  const latestCompleteStrategyReport = reports.find(r => r.type === 'strategy' && r.status === 'complete')
  const latestPendingPreviewReport = reports.find(r => r.type === 'strategy' && r.status === 'pending' && r.preview_data)
  // For score display, use whatever is available (complete > pending)
  const latestStrategyReport = latestCompleteStrategyReport ?? latestPendingPreviewReport ?? reports.find(r => r.type === 'strategy')
  const latestPreview = latestStrategyReport?.preview_data as StrategyPreview | null
  const latestFullReport = latestStrategyReport?.report_data as StrategyReport | null
  const latestAnswers = latestStrategyReport?.questionnaire_responses as StrategyAnswers | null
  const niwScore = latestFullReport?.petition_readiness?.niw_score ?? latestPreview?.niw_score ?? null
  const eb1aScore = latestFullReport?.petition_readiness?.eb1a_score ?? latestPreview?.eb1a_score ?? null
  const recommendedPathway = latestFullReport?.petition_readiness?.recommended_pathway ?? latestPreview?.top_pathway ?? null
  const greenCardScore = (niwScore !== null && eb1aScore !== null)
    ? computeGreenCardScoreFromSubscores(niwScore, eb1aScore)
    : null

  // Visa countdown
  const visaExpiration = latestAnswers?.visa_expiration ?? null
  const daysLeft = visaExpiration ? daysUntil(visaExpiration) : null
  const visaStatus = latestAnswers?.visa_status ?? profile?.visa_status ?? null

  // Career moves
  const setMoves = (currentMoveSetResult.data?.moves ?? null) as CareerMove[] | null
  const cachedMoves = profile?.career_moves as { moves: CareerMove[] } | null
  const careerMoves = (setMoves && setMoves.length > 0) ? setMoves : (cachedMoves?.moves ?? null)

  // Petition progress
  const petitionData = petitionResult.data
  const evidenceItems = (petitionData?.evidence_items ?? []) as EvidenceItem[]
  const evidenceDone = evidenceItems.filter(i => i.status === 'done').length
  const evidenceTotal = evidenceItems.length
  const hasNarrative = (petitionData?.narrative_text ?? '').trim().length > 100
  const hasGeneratedPetition = !!petitionData?.generated_petition
  const runwayDays = evidenceItems.length > 0 ? computeRunwayDays(evidenceItems) : null

  // Country alerts
  const countryOfBirth = (profile as Record<string, unknown> | null)?.country_of_birth as string | undefined

  // Journey stage, only a complete (paid + generated) report advances beyond Stage 1
  const stage = getUserStage({
    hasStrategyReport: !!latestCompleteStrategyReport,
    hasCareerMoves: !!careerMoves,
    evidenceDone,
    evidenceTotal,
    hasNarrative,
    hasGeneratedPetition,
  })

  // Stage 1 CTA adapts based on whether there's a pending (unpaid) preview
  const stage1Config = latestPendingPreviewReport
    ? {
        title: `Your score is ready${latestPreview?.niw_score !== undefined ? `: NIW ${latestPreview.niw_score}/100` : ''}`,
        description: `${latestPreview?.top_pathway ?? 'EB-2 NIW'} is your strongest pathway. Unlock the full report to get your criterion-by-criterion breakdown, evidence map, and 12-month roadmap.`,
        href: `/strategy/preview?reportId=${latestPendingPreviewReport.id}`,
        cta: 'View preview & unlock full report →',
        color: 'border-teal bg-teal/4',
      }
    : {
        title: 'See your green card score, free',
        description: "Answer questions about your background and we'll calculate your NIW and EB-1A scores, show you your strongest pathway, and identify exactly what you need to build. Preview is free, pay only if you want the full report.",
        href: '/strategy/questionnaire',
        cta: 'Start free preview →',
        color: 'border-teal bg-teal/4',
      }

  const nextStepConfig: Record<Stage, { title: string; description: string; href: string; cta: string; color: string }> = {
    1: stage1Config,
    2: {
      title: 'Start building your evidence',
      description: 'Your strategy report is ready. Now open the Petition Builder and start checking off the evidence items for your pathway. This is where your case gets built.',
      href: '/petition-builder',
      cta: 'Open Petition Builder →',
      color: 'border-teal bg-teal/4',
    },
    3: {
      title: 'Write your proposed endeavor',
      description: "You have evidence started. Now write your proposed endeavor statement, the single most important sentence in any petition. The AI will review it like a USCIS adjudicator.",
      href: '/petition-builder',
      cta: 'Write narrative →',
      color: 'border-blue-200 bg-blue-50/50',
    },
    4: {
      title: 'Generate your petition package',
      description: "Your evidence is solid and your narrative is reviewed. Generate your full petition package, personal statement, cover letter, and recommendation letter briefings.",
      href: '/petition-builder',
      cta: 'Generate petition →',
      color: 'border-purple-200 bg-purple-50/50',
    },
    5: {
      title: 'Your petition package is ready',
      description: 'Your documents are generated. Next: review the filing checklist, assemble your exhibit package, and verify the current USCIS mailing address before you submit.',
      href: '/filing-guide',
      cta: 'Open filing guide →',
      color: 'border-teal bg-teal/4',
    },
  }

  const nextStep = nextStepConfig[stage]

  // Resume card: show when the user has an in-progress questionnaire draft and
  // hasn't yet generated a preview/report (stage 1, no pending preview).
  const strategyDraft = profile?.strategy_draft as { step?: number; savedAt?: string; answers?: unknown } | null | undefined
  const showResume = stage === 1 && !latestPendingPreviewReport && !!strategyDraft && !!strategyDraft.answers
  const draftStep = typeof strategyDraft?.step === 'number' ? strategyDraft.step : 0
  const draftSavedAt = typeof strategyDraft?.savedAt === 'string' ? strategyDraft.savedAt : undefined

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ══ GREETING ════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy">{greetingFor(countryOfBirth)}, {firstName} 👋</h1>
          <p className="text-sm text-mid mt-0.5">Your path to an approved petition</p>
        </div>
        {isPro && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-teal/15 to-teal/5 border border-teal/25 rounded-xl px-4 py-2.5">
            <span className="text-teal">✦</span>
            <div>
              <p className="text-xs font-black text-teal leading-none">Pro Member</p>
              {subscription?.current_period_end && (
                <p className="text-[10px] text-teal/70 mt-0.5 leading-none">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ ALERTS ══════════════════════════════════════════════════════════════ */}
      <AdminAlertBanner />
      {countryOfBirth && <CountryAlert countryCode={countryOfBirth} recommendedPathway={recommendedPathway} />}

      {/* ══ JOURNEY PROGRESS ════════════════════════════════════════════════════ */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-mid uppercase tracking-wide">Your petition journey</p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-0">
            {STAGES.map((s, i) => {
              const done = s.n < stage
              const current = s.n === stage
              return (
                <div key={s.n} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors ${
                      done    ? 'bg-teal border-teal text-white' :
                      current ? 'bg-white border-teal text-teal' :
                                'bg-gray-50 border-gray-200 text-mid'
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{s.n}</span>
                      )}
                    </div>
                    <span className={`text-[9px] font-semibold text-center leading-tight hidden sm:block ${current ? 'text-teal' : done ? 'text-mid' : 'text-gray-300'}`}>
                      {s.short}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-teal' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ NEXT STEP ═══════════════════════════════════════════════════════════ */}
      {showResume ? (
        <StrategyResumeCard step={draftStep} totalSteps={4} savedAt={draftSavedAt} />
      ) : (
        <div className={`rounded-2xl border-2 p-5 ${nextStep.color}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-mid uppercase tracking-widest mb-1">
                Stage {stage} of 5, {STAGES[stage - 1].label}
              </p>
              <h2 className="text-lg font-bold text-navy">{nextStep.title}</h2>
              <p className="text-sm text-mid mt-1.5 leading-relaxed max-w-xl">{nextStep.description}</p>
              <Link href={nextStep.href} className="inline-flex items-center gap-2 mt-4 btn-primary text-sm">
                {nextStep.cta}
              </Link>
            </div>
            <div className="text-4xl hidden sm:block flex-shrink-0">{STAGES[stage - 1].icon}</div>
          </div>
        </div>
      )}

      {/* ══ METRICS ROW ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* Green Card Score */}
        <div className="card py-4 text-center space-y-0.5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold text-mid uppercase tracking-widest">GC Score</p>
          {greenCardScore ? (
            <>
              <p className={`text-4xl font-black ${greenCardScore.overall >= 70 ? 'text-teal' : greenCardScore.overall >= 50 ? 'text-yellow-600' : 'text-orange-500'}`}>
                {greenCardScore.overall}
              </p>
              <p className="text-[10px] text-mid">{greenCardScore.label}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-mid">-</p>
              <Link href="/strategy" className="text-[10px] text-teal font-semibold hover:underline">Run report</Link>
            </>
          )}
        </div>

        {/* NIW Score */}
        <div className="card py-4 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-mid uppercase tracking-widest">NIW</p>
          {niwScore !== null ? (
            <>
              <p className={`text-4xl font-black ${niwScore >= 65 ? 'text-teal' : niwScore >= 45 ? 'text-yellow-600' : 'text-orange-500'}`}>{niwScore}</p>
              <p className="text-[10px] text-mid">/100</p>
            </>
          ) : (
            <p className="text-3xl font-black text-mid">-</p>
          )}
        </div>

        {/* EB-1A Score */}
        <div className="card py-4 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-mid uppercase tracking-widest">EB-1A</p>
          {eb1aScore !== null ? (
            <>
              <p className={`text-4xl font-black ${eb1aScore >= 70 ? 'text-teal' : eb1aScore >= 50 ? 'text-yellow-600' : 'text-orange-500'}`}>{eb1aScore}</p>
              <p className="text-[10px] text-mid">/100</p>
            </>
          ) : (
            <p className="text-3xl font-black text-mid">-</p>
          )}
        </div>

        {/* Visa countdown */}
        <div className="card py-4 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-mid uppercase tracking-widest">
            {visaStatus ? visaStatus.replace('F-1 ', '') : 'Visa'} Expires
          </p>
          {daysLeft !== null ? (
            <>
              <p className={`text-4xl font-black ${optUrgencyColor(daysLeft)}`}>{daysLeft}</p>
              <p className={`text-[10px] font-semibold ${daysLeft <= 60 ? 'text-red-500' : daysLeft <= 180 ? 'text-yellow-600' : 'text-mid'}`}>
                {daysLeft <= 60 ? '⚠ Act now' : daysLeft <= 180 ? 'File soon' : 'days left'}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-mid">-</p>
              <Link href="/strategy/questionnaire" className="text-[10px] text-teal font-semibold hover:underline">Add date</Link>
            </>
          )}
        </div>
      </div>

      {/* ══ PETITION PROGRESS (if started) ══════════════════════════════════════ */}
      {isPro && petitionData && evidenceTotal > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy">Petition Builder Progress</p>
              <p className="text-xs text-mid mt-0.5">
                {runwayDays !== null && runwayDays > 0
                  ? `~${runwayDays} days of evidence work left (your estimate)`
                  : runwayDays === 0 ? 'All evidence items marked done' : 'Track your evidence'}
              </p>
            </div>
            <Link href="/petition-builder" className="text-xs text-teal font-semibold hover:underline flex-shrink-0">
              Continue →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className={`text-2xl font-black ${evidenceDone > 0 ? 'text-teal' : 'text-mid'}`}>
                {evidenceDone}/{evidenceTotal}
              </p>
              <p className="text-[10px] text-mid font-medium mt-0.5">Evidence done</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black ${hasNarrative ? 'text-teal' : 'text-mid'}`}>
                {hasNarrative ? '✓' : '○'}
              </p>
              <p className="text-[10px] text-mid font-medium mt-0.5">Narrative written</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black ${hasGeneratedPetition ? 'text-teal' : 'text-mid'}`}>
                {hasGeneratedPetition ? '✓' : '○'}
              </p>
              <p className="text-[10px] text-mid font-medium mt-0.5">Docs generated</p>
            </div>
          </div>

          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${evidenceTotal > 0 ? Math.round((evidenceDone / evidenceTotal) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ══ PRO UPGRADE (free users) ════════════════════════════════════════════ */}
      {!isPro && (
        <div className="card !p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-navy via-teal to-teal/50" />
          <div className="p-5 flex items-start justify-between gap-4">
            {latestStrategyReport ? (
              <>
                <div>
                  <p className="text-sm font-bold text-navy">Unlock the full petition journey</p>
                  <p className="text-xs text-mid mt-1 max-w-sm leading-relaxed">
                    Career moves, Petition Builder with evidence tracking benchmarked against real AAO decisions, narrative review, and draft petition documents.
                  </p>
                  <Link href="/subscribe" className="inline-flex items-center gap-2 mt-3 btn-primary text-sm">
                    Upgrade to Pro →
                  </Link>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-2xl font-black text-navy">$49</p>
                  <p className="text-xs text-mid">/month</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-bold text-navy">New here? Start with the strategy report</p>
                  <p className="text-xs text-mid mt-1 max-w-sm leading-relaxed">
                    Your Green Card Score and career moves are anchored to your strategy report. See what it includes, the preview is free, pay only if you want the full report.
                  </p>
                  <Link href="/strategy" className="inline-flex items-center gap-2 mt-3 btn-primary text-sm">
                    See how the report works →
                  </Link>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-2xl font-black text-navy">$297</p>
                  <p className="text-xs text-mid">one-time</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ REPORTS ═════════════════════════════════════════════════════════════ */}
      {reports.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-mid uppercase tracking-wide">Reports</p>
            <Link href="/strategy" className="text-xs text-teal font-semibold hover:underline">New report →</Link>
          </div>
          <div className="space-y-2">
            {reports.slice(0, 5).map(report => {
              const isComplete = report.status === 'complete'
              const isGenerating = report.status === 'generating' || report.status === 'paid'
              const href = isComplete || isGenerating || report.status === 'error'
                ? `/${report.type}/report/${report.id}`
                : `/${report.type}/preview?reportId=${report.id}`
              return (
                <Link key={report.id} href={href}
                  className="card hover:shadow-card-hover transition-all py-3.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${report.type === 'strategy' ? 'bg-teal/10' : 'bg-navy-light'}`}>
                      <span className="text-sm">{report.type === 'strategy' ? '📊' : '📋'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {report.type === 'strategy' ? 'Green Card Strategy Report' : 'RFE Analysis'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-mid">
                          {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {isGenerating && <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">Generating…</span>}
                        {report.status === 'pending' && <span className="text-[10px] bg-gray-100 text-mid border border-border rounded-full px-2 py-0.5">Preview</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-mid group-hover:text-navy transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <DeleteReportButton reportId={report.id} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ CAREER MOVES TEASER ════════════════════════════════════════════════ */}
      {careerMoves && careerMoves.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-mid uppercase tracking-wide">Career Moves</p>
            <Link href="/career-moves" className="text-xs text-teal font-semibold hover:underline">See all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {careerMoves.slice(0, 2).map((move, i) => (
              <Link key={i} href="/career-moves" className="card hover:shadow-card-hover transition-all group py-4">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                    move.impact === 'High' ? 'bg-teal/15 text-teal' : 'bg-navy-light text-navy'
                  }`}>{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-navy leading-snug">{move.title}</p>
                    <p className="text-xs text-mid mt-1 leading-relaxed line-clamp-2">{move.why}</p>
                    <p className="text-[10px] text-teal font-semibold mt-2">{move.criterion}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
