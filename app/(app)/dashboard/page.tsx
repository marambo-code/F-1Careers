import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteReportButton from '@/components/ui/DeleteReportButton'
import type { StrategyPreview, StrategyReport, StrategyAnswers } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(yearMonth: string): number | null {
  // yearMonth is "YYYY-MM" — count to last day of that month
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) return null
  const [y, m] = yearMonth.split('-').map(Number)
  const expiry = new Date(y, m, 0) // day 0 of next month = last day of this month
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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const completedReports = reports?.filter(r => r.status === 'complete') ?? []
  const allReports = reports ?? []
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const profileComplete = profile?.university && profile?.degree &&
    profile?.visa_status && profile?.career_goal && profile?.graduation_date

  // ── Immigration status data ───────────────────────────────────────
  // Pull NIW/EB-1A scores from most recent strategy report
  const latestStrategyReport = reports?.find(r => r.type === 'strategy' && (r.status === 'complete' || r.status === 'pending'))
  const latestPreview = latestStrategyReport?.preview_data as StrategyPreview | null
  const latestFullReport = latestStrategyReport?.report_data as StrategyReport | null

  // Prefer full report scores (AI-scored), fall back to computed preview scores
  const niwScore = latestFullReport?.petition_readiness?.niw_score ?? latestPreview?.niw_score ?? null
  const eb1aScore = latestFullReport?.petition_readiness?.eb1a_score ?? latestPreview?.eb1a_score ?? null
  const recommendedPathway = latestFullReport?.petition_readiness?.recommended_pathway ?? latestPreview?.top_pathway ?? null

  // OPT expiration — from latest strategy questionnaire answers
  const latestAnswers = latestStrategyReport?.questionnaire_responses as StrategyAnswers | null
  const visaExpiration = latestAnswers?.visa_expiration ?? null
  const daysLeft = visaExpiration ? daysUntil(visaExpiration) : null
  const visaStatus = latestAnswers?.visa_status ?? profile?.visa_status ?? null

  const strength = profileStrength(profile as Record<string, unknown> | null, !!(profile?.linkedin_url))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-mid font-medium">Welcome back</p>
          <h1 className="text-2xl font-bold text-navy mt-0.5">
            {firstName === 'there' ? 'Your Dashboard' : `Hi, ${firstName}`}
          </h1>
        </div>
        {completedReports.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-navy">{completedReports.length}</p>
            <p className="text-xs text-mid">report{completedReports.length !== 1 ? 's' : ''} generated</p>
          </div>
        )}
      </div>

      {/* ── Immigration Status Bar ── */}
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

      {/* ── Evidence Strength Bar ── */}
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
          <span className={profile?.full_name ? 'text-teal font-medium' : ''}>
            {profile?.full_name ? '✓' : '○'} Name
          </span>
          <span className={profile?.visa_status ? 'text-teal font-medium' : ''}>
            {profile?.visa_status ? '✓' : '○'} Visa status
          </span>
          <span className={profile?.resume_path ? 'text-teal font-medium' : ''}>
            {profile?.resume_path ? '✓' : '○'} Resume
          </span>
          <span className={profile?.linkedin_url ? 'text-teal font-medium' : ''}>
            {profile?.linkedin_url ? '✓' : '○'} LinkedIn
          </span>
          <span className={profile?.graduation_date ? 'text-teal font-medium' : ''}>
            {profile?.graduation_date ? '✓' : '○'} Grad date
          </span>
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
          <Link href="/profile" className="flex-shrink-0 btn-teal text-xs py-1.5 px-3">
            Complete →
          </Link>
        </div>
      )}

      {/* Products */}
      <div>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-wide mb-3">AI Tools</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Green Card Strategy */}
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
                  <span className="text-xs font-bold text-teal">$300</span>
                </div>
                <p className="text-sm text-mid mt-1 leading-relaxed">Visa pathway analysis, evidence gaps, criterion breakdown, and your personalized 12-month roadmap.</p>
                <p className="text-xs text-teal font-semibold mt-3 group-hover:underline">Start questionnaire →</p>
              </div>
            </div>
          </Link>

          {/* RFE Analyzer */}
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
                  <span className="text-xs font-bold text-navy">$200</span>
                </div>
                <p className="text-sm text-mid mt-1 leading-relaxed">Upload your USCIS Request for Evidence. Get a risk-ranked, issue-by-issue response strategy.</p>
                <p className="text-xs text-navy font-semibold mt-3 group-hover:underline">Upload RFE document →</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Reports history */}
      <div>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-wide mb-3">Your Reports</h2>

        {allReports.length === 0 ? (
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
            {allReports.map(report => {
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
                        {new Date(report.created_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
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
