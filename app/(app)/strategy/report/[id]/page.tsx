import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { StrategyReport, PathwayAssessment, CriterionBreakdown, GapItem } from '@/lib/types'
import DownloadButton from '@/components/ui/DownloadButton'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'
import { sendStrategyReportReady } from '@/lib/email'

export default async function StrategyReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
  if (report.status === 'pending') redirect(`/strategy/preview?reportId=${id}`)

  // If status is complete but report_data is missing/corrupt, force regeneration
  if (report.status === 'complete' && !report.report_data) {
    await service.from('reports').update({ status: 'error' }).eq('id', id)
    report.status = 'error'
  }

  // Generate synchronously on the server if paid/stuck — page waits, no polling needed
  if (report.status !== 'complete') {
    try {
      await service.from('reports').update({ status: 'generating' }).eq('id', id)
      const reportData = await generateStrategyReport(report.questionnaire_responses)
      await service.from('reports').update({ status: 'complete', report_data: reportData }).eq('id', id)
      // Send email notification (fire-and-forget — don't block on failure)
      if (user.email) {
        sendStrategyReportReady(user.email, id).catch(e => console.error('[email] strategy notify failed:', e))
      }
      // Reload report with fresh data
      const { data: fresh } = await service.from('reports').select('*').eq('id', id).single()
      if (fresh) Object.assign(report, fresh)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Strategy generation failed:', msg)
      await service.from('reports').update({ status: 'error' }).eq('id', id)
      return (
        <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
          <h2 className="text-xl font-bold text-navy">Generation failed</h2>
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{msg}</p>
          <p className="text-mid text-sm">Please refresh this page to try again. Your payment is safe.</p>
          <a href={`/strategy/report/${id}`} className="btn-teal inline-block">Retry →</a>
          <br />
          <a href="/dashboard" className="text-sm text-mid underline">← Back to Dashboard</a>
        </div>
      )
    }
  }

  const data = report.report_data as StrategyReport

  const feasibilityColor = {
    High: 'bg-teal-light text-teal border-teal/20',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low: 'bg-gray-100 text-mid border-border',
  }

  const ratingColor = {
    Strong: 'badge-strong',
    Developing: 'badge-developing',
    Gap: 'badge-gap',
  }

  const materialityColor = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-teal uppercase tracking-widest">Career Strategy Report</span>
          <h1 className="text-2xl font-bold text-navy mt-1">Your Career & Visa Strategy</h1>
          <p className="text-sm text-mid mt-1">
            Generated {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <DownloadButton reportId={id} reportType="strategy" className="print:hidden" />
      </div>

      {/* 1. Career + Visa Assessment */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-1 pb-2 border-b-2 border-teal">Career + Visa Pathway Assessment</h2>
        <p className="text-mid text-sm mb-4">{data.career_visa_assessment?.summary}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.career_visa_assessment?.pathways?.map((p: PathwayAssessment) => (
            <div key={p.pathway} className={`rounded-xl border p-4 ${feasibilityColor[p.feasibility]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{p.pathway}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/60">{p.feasibility}</span>
              </div>
              <p className="text-sm">{p.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Criterion Breakdown */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-teal">Criterion-Level Breakdown</h2>
        <div className="space-y-2">
          {data.criterion_breakdown?.map((c: CriterionBreakdown, i: number) => (
            <div key={i} className="card py-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-mid">{c.pathway}</span>
                  <span className="text-xs text-mid">→</span>
                  <span className="font-semibold text-navy text-sm">{c.criterion}</span>
                </div>
                <p className="text-sm text-mid mt-1">{c.evidence_summary}</p>
              </div>
              <span className={ratingColor[c.rating]}>{c.rating}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Evidence Mapping */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-teal">Evidence Mapping</h2>
        <div className="space-y-3">
          {data.evidence_mapping?.map((e, i) => (
            <div key={i} className="card py-3">
              <p className="font-semibold text-navy text-sm mb-2">{e.criterion}</p>
              <ul className="space-y-1">
                {e.evidence.map((ev, j) => (
                  <li key={j} className="text-sm text-mid flex gap-2">
                    <span className="text-teal flex-shrink-0">✓</span> {ev}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Gap Analysis */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-teal">Gap Analysis</h2>
        <div className="space-y-3">
          {data.gap_analysis?.map((g: GapItem, i: number) => (
            <div key={i} className="card py-3 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-navy text-sm">{g.gap}</p>
                <p className="text-sm text-mid mt-1"><strong>Action:</strong> {g.action}</p>
              </div>
              <span className={materialityColor[g.materiality]}>{g.materiality} risk</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Roadmap */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4 pb-2 border-b-2 border-teal">3 / 6 / 12-Month Career Roadmap</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: '3 Months', items: data.roadmap?.three_month, color: 'border-teal' },
            { label: '6 Months', items: data.roadmap?.six_month, color: 'border-navy' },
            { label: '12 Months', items: data.roadmap?.twelve_month, color: 'border-mid' },
          ].map(({ label, items, color }) => (
            <div key={label} className={`card border-t-4 ${color}`}>
              <p className="font-bold text-navy text-sm mb-3">{label}</p>
              <ul className="space-y-2">
                {items?.map((item, i) => (
                  <li key={i} className="text-sm text-mid flex gap-2">
                    <span className="flex-shrink-0 text-xs font-bold text-mid mt-0.5">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Recommended Next Step */}
      <section className="card bg-navy text-white">
        <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">Recommended Next Step</p>
        <p className="text-lg font-semibold">{data.recommended_next_step}</p>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-mid">{data.disclaimer}</p>
    </div>
  )
}
