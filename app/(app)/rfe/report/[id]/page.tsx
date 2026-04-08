import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { RFEReport, RFEIssue, RFEAnswers } from '@/lib/types'
import DownloadButton from '@/components/ui/DownloadButton'
import { generateRFEReport } from '@/lib/ai/rfe-analyzer'
import { sendRFEReportReady } from '@/lib/email'

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

  // Generate synchronously on the server if paid/stuck — page waits, no polling needed
  if (report.status !== 'complete') {
    try {
      // Re-extract PDF text from storage if missing
      let rfeText = report.rfe_document_text
      if (!rfeText) {
        if (!report.rfe_document_path) throw new Error('No document found — please re-upload your RFE.')
        const { data: fileData, error: dlErr } = await service.storage.from('rfe-documents').download(report.rfe_document_path)
        if (dlErr || !fileData) throw new Error('Could not download your RFE document from storage.')
        const pdfParse = require('pdf-parse')
        const parsed = await pdfParse(Buffer.from(await fileData.arrayBuffer()))
        rfeText = parsed.text.slice(0, 50000)
        await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', id)
      }
      // Extract petition context from questionnaire_responses if present
      const qr = report.questionnaire_responses as RFEAnswers | null
      const rfeOpts = {
        petitionType: qr?.petition_type,
        rfeField: qr?.rfe_field,
        additionalContext: qr?.additional_context,
      }
      await service.from('reports').update({ status: 'generating' }).eq('id', id)
      const reportData = await generateRFEReport(rfeText, rfeOpts)
      await service.from('reports').update({ status: 'complete', report_data: reportData }).eq('id', id)
      // Send email notification (fire-and-forget — don't block on failure)
      if (user.email) {
        sendRFEReportReady(user.email, id, reportData.case_type ?? 'RFE Analysis').catch(e => console.error('[email] rfe notify failed:', e))
      }
      const { data: fresh } = await service.from('reports').select('*').eq('id', id).single()
      if (fresh) Object.assign(report, fresh)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('RFE generation failed:', msg)
      await service.from('reports').update({ status: 'error' }).eq('id', id)
      return (
        <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
          <h2 className="text-xl font-bold text-navy">Generation failed</h2>
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{msg}</p>
          <p className="text-mid text-sm">Your payment is safe. Please re-upload your RFE document.</p>
          <a href="/rfe" className="btn-teal inline-block">Re-upload RFE →</a>
        </div>
      )
    }
  }

  const data = report.report_data as RFEReport

  const riskColor = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }

  const strategyColor = {
    Rebut: 'bg-teal-light text-teal',
    Supplement: 'bg-navy-light text-navy',
    Narrow: 'bg-yellow-50 text-yellow-700',
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
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

      {/* Issue Registry */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-navy">Issue Registry</h2>
        <div className="space-y-4">
          {data.issue_registry?.map((issue: RFEIssue) => (
            <div key={issue.number} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {issue.number}
                  </span>
                  <h3 className="font-bold text-navy">{issue.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={riskColor[issue.risk_level]}>{issue.risk_level} risk</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${strategyColor[issue.response_strategy]}`}>
                    {issue.response_strategy}
                  </span>
                </div>
              </div>

              <div className="ml-10 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">Plain English</p>
                  <p className="text-sm text-navy">{issue.plain_english}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">Evidence Gaps</p>
                  <ul className="space-y-1">
                    {issue.evidence_gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-mid flex gap-2">
                        <span className="text-red-400 flex-shrink-0">×</span> {gap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1">Strategy Rationale</p>
                  <p className="text-sm text-mid">{issue.strategy_rationale}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Priority Action List */}
      <section className="card">
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-navy">Priority Action List</h2>
        <p className="text-sm text-mid mb-4">Address these in order. Share this list with your attorney.</p>
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

      {/* Disclaimer */}
      <p className="text-xs text-mid">{data.disclaimer}</p>
    </div>
  )
}
