import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteReportButton from '@/components/ui/DeleteReportButton'

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
          {/* Career Strategy */}
          <Link href="/strategy" className="card hover:shadow-card-hover transition-all group border-2 hover:border-teal/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-teal-light rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal/20 transition-colors">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">Career Strategy Report</h3>
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
            <p className="text-sm text-mid mt-1">Generate your first career strategy report to get started.</p>
            <Link href="/strategy" className="btn-teal inline-block mt-5">
              Get my career strategy →
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
                          {report.type === 'strategy' ? 'Career Strategy Report' : 'RFE Analysis'}
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
