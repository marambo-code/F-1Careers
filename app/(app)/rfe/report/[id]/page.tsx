import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { RFEReport, RFEIssue } from '@/lib/types'
import DownloadButton from '@/components/ui/DownloadButton'
import GeneratingView from '../../GeneratingView'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export default async function RFEReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: report } = await service
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!report) notFound()
  if (report.status === 'pending') redirect(`/rfe/preview?reportId=${id}`)

  if (report.status === 'complete' && !report.report_data) {
    await service.from('reports').update({ status: 'error' }).eq('id', id)
    report.status = 'error'
  }

  if (report.status !== 'complete') {
    return <GeneratingView reportId={id} reportType="rfe" />
  }

  const data = report.report_data as RFEReport

  const riskColor: Record<string, string> = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }

  const riskBg: Record<string, string> = {
    High: 'bg-red-50 border-red-200',
    Medium: 'bg-yellow-50 border-yellow-200',
    Low: 'bg-green-50 border-green-200',
  }

  const riskText: Record<string, string> = {
    High: 'text-red-700',
    Medium: 'text-yellow-700',
    Low: 'text-green-700',
  }

  const strategyColor: Record<string, string> = {
    Rebut: 'bg-teal-light text-teal',
    Supplement: 'bg-navy-light text-navy',
    Narrow: 'bg-yellow-50 text-yellow-700',
  }

  const overallRisk = data.overall_denial_risk ?? 'High'

  return (
    <div className="max-w-3xl space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-navy uppercase tracking-widest">RFE Analysis</span>
          <h1 className="text-2xl font-bold text-navy mt-1">RFE Response Strategy</h1>
          <p className="text-sm text-mid mt-1">
            {data.case_type} · {data.issue_registry?.length} issues · Generated{' '}
            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <DownloadButton reportId={id} reportType="rfe" className="print:hidden" />
      </div>

      {/* ── Overall Risk Banner ─────────────────────────────── */}
      <div className={`rounded-xl border-2 p-5 ${riskBg[overallRisk]}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
            overallRisk === 'High' ? 'bg-red-100 border-red-300 text-red-700' :
            overallRisk === 'Medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
            'bg-green-100 border-green-300 text-green-700'
          }`}>
            {overallRisk === 'High' ? '⚠ High Denial Risk' : overallRisk === 'Medium' ? '⚡ Medium Denial Risk' : '✓ Lower Denial Risk'}
          </span>
          <span className="text-xs font-semibold text-mid uppercase tracking-wide">{data.issue_registry?.length} issues identified</span>
        </div>
        {data.overall_assessment && (
          <p className={`text-sm leading-relaxed font-medium ${riskText[overallRisk]}`}>{data.overall_assessment}</p>
        )}
      </div>

      {/* ── Response Deadline ────────────────────────────────── */}
      {data.response_deadline_note && (
        <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4 flex gap-3">
          <span className="text-red-500 text-lg flex-shrink-0">⏰</span>
          <div>
            <p className="text-sm font-bold text-red-700 mb-0.5">Response Deadline</p>
            <p className="text-sm text-red-700 leading-relaxed">{data.response_deadline_note}</p>
          </div>
        </div>
      )}

      {/* ── Priority Action List ─────────────────────────────── */}
      <section className="card">
        <h2 className="text-lg font-bold text-navy mb-1 pb-2 border-b-2 border-navy">Priority Action List</h2>
        <p className="text-sm text-mid mb-4">Address these in order. Share this list with your attorney immediately.</p>
        <ol className="space-y-3">
          {data.priority_action_list?.map((action, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-navy">{action}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Issue Registry ───────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-navy">Issue-by-Issue Analysis</h2>
        <div className="space-y-6">
          {data.issue_registry?.map((issue: RFEIssue) => (
            <div key={issue.number} className="card border-l-4" style={{
              borderLeftColor: issue.risk_level === 'High' ? '#DC2626' : issue.risk_level === 'Medium' ? '#B45309' : '#16A34A'
            }}>
              {/* Issue header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {issue.number}
                  </span>
                  <h3 className="font-bold text-navy text-base">{issue.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={riskColor[issue.risk_level]}>{issue.risk_level} risk</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${strategyColor[issue.response_strategy]}`}>
                    {issue.response_strategy}
                  </span>
                </div>
              </div>

              <div className="ml-10 space-y-4">
                {/* Legal citation */}
                {issue.uscis_citation && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-0.5">Legal Standard Invoked</p>
                    <p className="text-xs font-mono text-navy">{issue.uscis_citation}</p>
                  </div>
                )}

                {/* Plain English */}
                <div>
                  <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">What USCIS Is Saying</p>
                  <p className="text-sm text-navy leading-relaxed">{issue.plain_english}</p>
                </div>

                {/* Denial risk if unaddressed */}
                {issue.denial_risk_if_unaddressed && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-0.5">If Left Unaddressed</p>
                    <p className="text-sm text-red-700 leading-relaxed">{issue.denial_risk_if_unaddressed}</p>
                  </div>
                )}

                {/* Evidence gaps */}
                {issue.evidence_gaps?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-2">Evidence Gaps USCIS Identified</p>
                    <ul className="space-y-1.5">
                      {issue.evidence_gaps.map((gap, i) => (
                        <li key={i} className="text-sm text-mid flex gap-2 items-start">
                          <span className="text-red-400 flex-shrink-0 font-bold">×</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specific documents */}
                {issue.specific_documents?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-2">Documents to Obtain</p>
                    <ul className="space-y-1.5">
                      {issue.specific_documents.map((doc, i) => (
                        <li key={i} className="text-sm text-navy flex gap-2 items-start">
                          <span className="text-teal flex-shrink-0 font-bold mt-0.5">□</span>
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Draft rebuttal paragraph */}
                {issue.draft_rebuttal_paragraph && (
                  <div className="bg-teal-light border border-teal/20 rounded-lg p-4">
                    <p className="text-xs font-bold text-teal uppercase tracking-wide mb-2">
                      ✏ Draft Rebuttal Language — Ready to Use
                    </p>
                    <p className="text-sm text-navy leading-relaxed italic">{issue.draft_rebuttal_paragraph}</p>
                  </div>
                )}

                {/* Strategy rationale */}
                <div>
                  <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">Strategy & Execution</p>
                  <p className="text-sm text-mid leading-relaxed">{issue.strategy_rationale}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Response Timeline ────────────────────────────────── */}
      {data.response_timeline?.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold text-navy mb-1 pb-2 border-b-2 border-navy">87-Day Response Timeline</h2>
          <p className="text-sm text-mid mb-5">Week-by-week plan to file a complete, compelling response before the deadline.</p>
          <div className="space-y-4">
            {data.response_timeline.map((week, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {i < data.response_timeline.length - 1 && (
                    <div className="w-0.5 bg-teal/20 flex-1 mt-1" style={{ minHeight: '24px' }} />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold text-navy mb-2">{week.week}</p>
                  <ul className="space-y-1.5">
                    {week.actions.map((action, j) => (
                      <li key={j} className="text-sm text-mid flex gap-2 items-start">
                        <span className="text-teal flex-shrink-0 font-bold">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Cover Letter Outline ─────────────────────────────── */}
      {data.cover_letter_outline?.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold text-navy mb-1 pb-2 border-b-2 border-navy">Cover Letter Outline</h2>
          <p className="text-sm text-mid mb-4">Structure your RFE response cover letter using these sections. Each section maps directly to a USCIS issue.</p>
          <ol className="space-y-3">
            {data.cover_letter_outline.map((section, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded bg-navy-light text-navy text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-navy leading-relaxed">{section}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Attorney Briefing ────────────────────────────────── */}
      {data.attorney_briefing && (
        <section className="card bg-navy-light border border-navy/10">
          <h2 className="text-lg font-bold text-navy mb-1 pb-2 border-b-2 border-navy">Attorney Briefing</h2>
          <p className="text-sm text-mid mb-4">Copy and send this to an immigration attorney to begin your representation conversation.</p>
          <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
            <p className="text-sm text-navy leading-relaxed">{data.attorney_briefing}</p>
          </div>
        </section>
      )}

      {/* ── Disclaimer ───────────────────────────────────────── */}
      <p className="text-xs text-mid border-t border-gray-200 pt-4">{data.disclaimer}</p>
    </div>
  )
}
