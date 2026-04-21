import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteReportButton from '@/components/ui/DeleteReportButton'
import CareerMovesSection from '@/components/dashboard/CareerMovesSection'
import CountryAlert from '@/components/dashboard/CountryAlert'
import AdminAlertBanner from '@/components/dashboard/AdminAlertBanner'
import { computeGreenCardScoreFromSubscores } from '@/lib/scoring'
import type { StrategyPreview, StrategyReport, StrategyAnswers } from '@/lib/types'
import type { CareerMove } from '@/lib/ai/career-moves'

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

function profileStrength(profile: Record<string, unknown> | null, hasLinkedIn: boolean): number {
  if (!profile) return 0
  const fields = ['full_name', 'university', 'degree', 'field_of_study', 'graduation_date', 'visa_status', 'career_goal', 'resume_path']
  const filled = fields.filter(f => !!profile[f]).length
  const linkedInBonus = hasLinkedIn ? 1 : 0
  return Math.round(((filled + linkedInBonus) / (fields.length + 1)) * 100)
}

// ── Score ring SVG ────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const filled = (score / 100) * circumference
  const dash = `${filled} ${circumference - filled}`

  const strokeColor =
    color === 'teal' ? '#14B8A6' :
    color === 'blue' ? '#3B82F6' :
    color === 'yellow' ? '#D97706' : '#EF4444'

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="rotate-[-90deg]">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="8"
        strokeDasharray={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

// ── Score history mini-bar ────────────────────────────────────────────────────

interface ScorePoint { green_card_score: number; created_at: string }

function ScoreHistory({ history }: { history: ScorePoint[] }) {
  if (history.length < 2) return null
  const max = Math.max(...history.map(h => h.green_card_score), 100)
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-mid uppercase tracking-widest">Score History</p>
      <div className="flex items-end gap-1.5 h-10">
        {history.map((h, i) => {
          const pct = (h.green_card_score / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className="w-full bg-teal rounded-sm transition-all"
                style={{ height: `${Math.max(pct, 8)}%` }}
              />
              <span className="text-[9px] text-mid">{new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
              {/* tooltip */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {h.green_card_score}/100
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel
  const [profileResult, reportsResult, subscriptionResult, scoreHistoryResult] = await Promise.all([
    supabase.from('profiles').select('*, country_of_birth').eq('id', user.id).single(),
    supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('status, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('score_history').select('green_card_score, niw_score, eb1a_score, created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(12),
  ])

  const profile = profileResult.data
  const reports = reportsResult.data ?? []
  const subscription = subscriptionResult.data
  const scoreHistory = (scoreHistoryResult.data ?? []) as ScorePoint[]

  const isPro = subscription?.status === 'active' || subscription?.status === 'trialing'
  const completedReports = reports.filter(r => r.status === 'complete')
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const profileComplete = profile?.university && profile?.degree && profile?.visa_status && profile?.career_goal && profile?.graduation_date

  // ── Strategy data ──────────────────────────────────────────────────────────
  const latestStrategyReport = reports.find(r => r.type === 'strategy' && (r.status === 'complete' || r.status === 'pending'))
  const latestPreview = latestStrategyReport?.preview_data as StrategyPreview | null
  const latestFullReport = latestStrategyReport?.report_data as StrategyReport | null
  const latestAnswers = latestStrategyReport?.questionnaire_responses as StrategyAnswers | null

  const niwScore = latestFullReport?.petition_readiness?.niw_score ?? latestPreview?.niw_score ?? null
  const eb1aScore = latestFullReport?.petition_readiness?.eb1a_score ?? latestPreview?.eb1a_score ?? null
  const recommendedPathway = latestFullReport?.petition_readiness?.recommended_pathway ?? latestPreview?.top_pathway ?? null
  const hasStrategyReport = !!latestStrategyReport

  // Green Card Score
  const greenCardScore = (niwScore !== null && eb1aScore !== null)
    ? computeGreenCardScoreFromSubscores(niwScore, eb1aScore)
    : null

  // OPT countdown
  const visaExpiration = latestAnswers?.visa_expiration ?? null
  const daysLeft = visaExpiration ? daysUntil(visaExpiration) : null
  const visaStatus = latestAnswers?.visa_status ?? profile?.visa_status ?? null

  // Profile strength
  const strength = profileStrength(profile as Record<string, unknown> | null, !!(profile?.linkedin_url))

  // Career moves
  const cachedMoves = profile?.career_moves as { moves: CareerMove[] } | null
  const careerMoves = cachedMoves?.moves ?? null

  // Country of birth for backlog alerts
  const countryOfBirth = (profile as Record<string, unknown> | null)?.country_of_birth as string | undefined

  return (
    <div className="space-y-8">

      {/* ══ GREETING ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy">Hello, {firstName} 👋</h1>
          <p className="text-sm text-mid mt-0.5">Here's your green card progress</p>
        </div>
        {isPro && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-teal/15 to-teal/5 border border-teal/25 rounded-xl px-4 py-2.5">
            <span className="text-teal text-base">✦</span>
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

      {/* ══ ADMIN ALERTS + COUNTRY WARNINGS ════════════════════════════════════ */}
      <AdminAlertBanner />
      {countryOfBirth && <CountryAlert countryCode={countryOfBirth} recommendedPathway={recommendedPathway} />}

      {/* ══ HERO: Green Card Score ══════════════════════════════════════════════ */}
      <div className="card bg-navy text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

        {greenCardScore ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            {/* Score ring — left */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={greenCardScore.overall} color="teal" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white leading-none">{greenCardScore.overall}</span>
                <span className="text-[11px] text-blue-300 font-medium mt-0.5">/100</span>
              </div>
            </div>

            {/* Text — right */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-1">Green Card Score</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                  greenCardScore.label === 'Exceptional' ? 'bg-teal/25 text-teal' :
                  greenCardScore.label === 'Strong'      ? 'bg-teal/20 text-teal' :
                  greenCardScore.label === 'Developing'  ? 'bg-yellow-400/20 text-yellow-300' :
                                                           'bg-red-400/20 text-red-300'
                }`}>{greenCardScore.label}</span>
                {greenCardScore.readyToFile && (
                  <span className="text-xs text-teal font-semibold">✓ Ready to file</span>
                )}
              </div>
              <p className="text-blue-200 text-sm mt-2">
                Best pathway: <span className="text-white font-semibold">{greenCardScore.bestPathway}</span>
                <span className="text-blue-400 mx-2">·</span>
                NIW <span className="text-white font-semibold">{niwScore}</span>
                <span className="text-blue-400 mx-1.5">·</span>
                EB-1A <span className="text-white font-semibold">{eb1aScore}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-[110px] h-[110px] rounded-full border-8 border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-black text-white/20">—</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-1">Green Card Score</p>
              <p className="text-white font-semibold">Not yet calculated</p>
              <p className="text-blue-300 text-sm mt-1">Run a Green Card Strategy report to see your score.</p>
              <Link href="/strategy" className="inline-block mt-3 bg-teal text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal/90 transition-colors">
                Run strategy report →
              </Link>
            </div>
          </div>
        )}

        {/* Score history (Pro only) */}
        {isPro && scoreHistory.length >= 2 && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <ScoreHistory history={scoreHistory} />
          </div>
        )}

        {/* Footer strip */}
        {isPro ? (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
            <span className="text-[11px] bg-teal/20 text-teal border border-teal/30 font-bold px-2 py-0.5 rounded-full">Pro</span>
            <p className="text-xs text-blue-300">Score updates automatically with each new strategy report</p>
          </div>
        ) : greenCardScore ? (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <p className="text-xs text-blue-300">Go Pro to track your score over time and unlock all 4 career moves</p>
            <Link href="/subscribe" className="flex-shrink-0 text-xs bg-teal text-white font-bold px-3 py-1.5 rounded-lg hover:bg-teal/90 transition-colors whitespace-nowrap">
              Go Pro — $49/mo
            </Link>
          </div>
        ) : null}
      </div>

      {/* ══ CAREER MOVES ═══════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Completion ring mini */}
            {careerMoves && careerMoves.length > 0 && (() => {
              const done = careerMoves.filter((m: CareerMove & { completed?: boolean }) => m.completed).length
              const total = careerMoves.length
              const r = 10, c = 2 * Math.PI * r
              return (
                <div className="relative flex items-center justify-center w-7 h-7 flex-shrink-0">
                  <svg width="28" height="28" viewBox="0 0 28 28" className="rotate-[-90deg]">
                    <circle cx="14" cy="14" r={r} fill="none" stroke="#E5E7EB" strokeWidth="3"/>
                    <circle cx="14" cy="14" r={r} fill="none" stroke="#14B8A6" strokeWidth="3"
                      strokeDasharray={`${(done/total)*c} ${c}`} strokeLinecap="round"/>
                  </svg>
                  <span className="absolute text-[8px] font-black text-navy">{done}/{total}</span>
                </div>
              )
            })()}
            <div>
              <h2 className="text-sm font-bold text-navy">Career Moves</h2>
              <p className="text-xs text-mid mt-0.5">What to do next to move your score</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPro && careerMoves && (
              <Link href="/career-moves" className="text-xs text-teal font-semibold hover:underline">
                Full view →
              </Link>
            )}
            {!isPro && careerMoves && (
              <Link href="/subscribe" className="text-xs text-teal font-semibold hover:underline">
                Unlock all →
              </Link>
            )}
          </div>
        </div>
        <CareerMovesSection
          initialMoves={careerMoves}
          isPro={isPro}
          hasStrategyReport={hasStrategyReport}
        />
      </div>

      {/* ══ STATUS ROW ═════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* OPT Countdown */}
        <div className="card py-4 text-center space-y-1 col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-mid uppercase tracking-widest">
            {visaStatus ? visaStatus.replace('F-1 ', '') : 'Visa'} Expires
          </p>
          {daysLeft !== null ? (
            <>
              <p className={`text-4xl font-black ${optUrgencyColor(daysLeft)}`}>{daysLeft}</p>
              <p className="text-xs text-mid">days remaining</p>
              {daysLeft <= 180 && (
                <p className={`text-xs font-semibold ${daysLeft <= 60 ? 'text-red-500' : 'text-yellow-600'}`}>
                  {daysLeft <= 60 ? '⚠ File immediately' : '⏱ File soon'}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-mid">—</p>
              <Link href="/strategy/questionnaire" className="text-xs text-teal font-semibold hover:underline">Add expiry date</Link>
            </>
          )}
        </div>

        {/* NIW Score */}
        <div className="card py-4 text-center space-y-1">
          <p className="text-xs font-bold text-mid uppercase tracking-widest">NIW Score</p>
          {niwScore !== null ? (
            <>
              <p className={`text-4xl font-black ${niwScore >= 65 ? 'text-teal' : niwScore >= 45 ? 'text-yellow-600' : 'text-orange-500'}`}>{niwScore}</p>
              <p className="text-xs text-mid">/100</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-mid">—</p>
              <Link href="/strategy" className="text-xs text-teal font-semibold hover:underline">Run analysis</Link>
            </>
          )}
        </div>

        {/* EB-1A Score */}
        <div className="card py-4 text-center space-y-1">
          <p className="text-xs font-bold text-mid uppercase tracking-widest">EB-1A Score</p>
          {eb1aScore !== null ? (
            <>
              <p className={`text-4xl font-black ${eb1aScore >= 70 ? 'text-teal' : eb1aScore >= 50 ? 'text-yellow-600' : 'text-orange-500'}`}>{eb1aScore}</p>
              <p className="text-xs text-mid">/100</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-mid">—</p>
              <Link href="/strategy" className="text-xs text-teal font-semibold hover:underline">Run analysis</Link>
            </>
          )}
        </div>

        {/* Recommended pathway */}
        <div className="card py-4 text-center space-y-1">
          <p className="text-xs font-bold text-mid uppercase tracking-widest">Best Pathway</p>
          {recommendedPathway ? (
            <>
              <p className="text-sm font-black text-navy leading-tight mt-1">{recommendedPathway}</p>
              <Link href={latestStrategyReport ? `/strategy/report/${latestStrategyReport.id}` : '/strategy'} className="text-xs text-teal font-semibold hover:underline">
                View report →
              </Link>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-mid">—</p>
              <Link href="/strategy" className="text-xs text-teal font-semibold hover:underline">Get analysis</Link>
            </>
          )}
        </div>
      </div>

      {/* ══ PROFILE STRENGTH ═══════════════════════════════════════════════════ */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-navy">Profile & Evidence Strength</p>
            <p className="text-xs text-mid mt-0.5">
              {strength < 50 ? 'Add more information to improve your AI report accuracy.' :
               strength < 80 ? 'Good foundation — upload resume and LinkedIn to maximize report quality.' :
               'Strong profile — your reports will be highly personalized.'}
            </p>
          </div>
          <span className={`text-2xl font-black ${strength >= 80 ? 'text-teal' : strength >= 50 ? 'text-yellow-600' : 'text-orange-500'}`}>{strength}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${strength >= 80 ? 'bg-teal' : strength >= 50 ? 'bg-yellow-400' : 'bg-orange-400'}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs text-mid flex-wrap">
          <span className={profile?.full_name ? 'text-teal font-medium' : ''}>{profile?.full_name ? '✓' : '○'} Name</span>
          <span className={profile?.visa_status ? 'text-teal font-medium' : ''}>{profile?.visa_status ? '✓' : '○'} Visa status</span>
          <span className={profile?.resume_path ? 'text-teal font-medium' : ''}>{profile?.resume_path ? '✓' : '○'} Resume</span>
          <span className={profile?.linkedin_url ? 'text-teal font-medium' : ''}>{profile?.linkedin_url ? '✓' : '○'} LinkedIn</span>
          <span className={profile?.graduation_date ? 'text-teal font-medium' : ''}>{profile?.graduation_date ? '✓' : '○'} Grad date</span>
          {strength < 100 && (
            <Link href="/profile" className="text-teal font-semibold hover:underline ml-auto">Complete profile →</Link>
          )}
        </div>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <div className="bg-teal-light border border-teal/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-teal/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy">Complete your profile for better AI accuracy</p>
            <p className="text-sm text-mid mt-0.5">Your visa status, graduation date, and degree improve your strategy report.</p>
          </div>
          <Link href="/profile" className="flex-shrink-0 btn-teal text-xs py-1.5 px-3">Complete →</Link>
        </div>
      )}

      {/* ══ AI TOOLS ═══════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-wide mb-3">AI Tools</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/strategy" className="card hover:shadow-card-hover transition-all group border-2 hover:border-teal/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-teal-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal/20 transition-colors">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">Green Card Strategy Report</h3>
                  <span className="text-xs font-bold text-teal">$397</span>
                </div>
                <p className="text-sm text-mid mt-1 leading-relaxed">Visa pathway analysis, evidence gaps, criterion breakdown, and your personalized 12-month roadmap.</p>
                <p className="text-xs text-teal font-semibold mt-3 group-hover:underline">Start questionnaire →</p>
              </div>
            </div>
          </Link>

          <Link href="/rfe" className="card hover:shadow-card-hover transition-all group border-2 hover:border-navy/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-navy-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-navy/10 transition-colors">
                <svg className="w-5 h-5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">RFE Analyzer</h3>
                  <span className="text-xs font-bold text-navy">$297</span>
                </div>
                <p className="text-sm text-mid mt-1 leading-relaxed">Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy.</p>
                <p className="text-xs text-navy font-semibold mt-3 group-hover:underline">Upload RFE document →</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ══ REPORTS HISTORY ════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-wide mb-3">Your Reports</h2>

        {reports.length === 0 ? (
          <div className="card text-center py-12 bg-gray-50 border-dashed">
            <div className="w-12 h-12 bg-navy-light rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-navy/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-navy font-semibold">No reports yet</p>
            <p className="text-sm text-mid mt-1">Generate your first green card strategy report to get started.</p>
            <Link href="/strategy" className="btn-teal inline-block mt-5">
              Get my green card strategy →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map(report => {
              const isComplete = report.status === 'complete'
              const isGenerating = report.status === 'generating' || report.status === 'paid'
              const isError = report.status === 'error'
              const href = isComplete || isGenerating || isError
                ? `/${report.type}/report/${report.id}`
                : `/${report.type}/preview?reportId=${report.id}`

              return (
                <Link
                  key={report.id}
                  href={href}
                  className="card hover:shadow-card-hover transition-all py-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${report.type === 'strategy' ? 'bg-teal-light' : 'bg-navy-light'}`}>
                      {report.type === 'strategy' ? (
                        <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-navy text-sm">
                          {report.type === 'strategy' ? 'Green Card Strategy Report' : 'RFE Analysis'}
                        </p>
                        {isGenerating && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">Generating…</span>
                        )}
                        {isError && (
                          <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">Error</span>
                        )}
                        {report.status === 'pending' && (
                          <span className="text-xs bg-gray-100 text-mid border border-border rounded-full px-2 py-0.5">Preview</span>
                        )}
                      </div>
                      <p className="text-xs text-mid mt-0.5">
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
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
        )}
      </div>
    </div>
  )
}
