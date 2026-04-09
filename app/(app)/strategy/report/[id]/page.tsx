import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { StrategyReport, ResumeEvidenceItem, ExpertLetter, EvidencePlaybookItem, SprintWeek, GapItem, PathwayAssessment } from '@/lib/types'
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
      if (user.email) {
        sendStrategyReportReady(user.email, id).catch(e => console.error('[email] strategy notify failed:', e))
      }
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

  // ── Color helpers ──────────────────────────────────────────────────
  const feasibilityBadge: Record<string, string> = {
    High: 'bg-teal-light text-teal border-teal/20',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low: 'bg-gray-100 text-mid border-border',
  }
  const strengthBadge: Record<string, string> = {
    Strong: 'bg-teal-light text-teal',
    Developing: 'bg-yellow-50 text-yellow-700',
    Gap: 'bg-red-50 text-red-600',
  }
  const priorityBadge: Record<string, string> = {
    High: 'bg-red-50 text-red-600 border-red-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low: 'bg-gray-100 text-mid border-border',
  }
  const materialityBadge: Record<string, string> = {
    High: 'bg-red-50 text-red-600',
    Medium: 'bg-yellow-50 text-yellow-700',
    Low: 'bg-gray-100 text-mid',
  }
  const scoreBg = (score: number) =>
    score >= 75 ? 'text-teal' : score >= 50 ? 'text-yellow-700' : 'text-orange-600'

  const pr = data.petition_readiness

  return (
    <div className="max-w-3xl space-y-12">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-teal uppercase tracking-widest">Attorney-Quality Strategy Report</span>
          <h1 className="text-2xl font-bold text-navy mt-1">Your Career & Immigration Strategy</h1>
          <p className="text-sm text-mid mt-1">
            Generated {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <DownloadButton reportId={id} reportType="strategy" className="print:hidden" />
      </div>

      {/* ── 1. Petition Readiness Dashboard ── */}
      <section>
        <h2 className="section-heading">Petition Readiness Dashboard</h2>

        {/* Score cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">EB-2 NIW Score</p>
            <p className={`text-5xl font-black mb-1 ${scoreBg(pr?.niw_score ?? 0)}`}>{pr?.niw_score ?? '—'}</p>
            <p className="text-xs text-mid">/100</p>
            <p className="text-xs text-mid mt-2 leading-relaxed">{pr?.niw_benchmark}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">EB-1A Score</p>
            <p className={`text-5xl font-black mb-1 ${scoreBg(pr?.eb1a_score ?? 0)}`}>{pr?.eb1a_score ?? '—'}</p>
            <p className="text-xs text-mid">/100</p>
            <p className="text-xs text-mid mt-2 leading-relaxed">{pr?.eb1a_assessment}</p>
          </div>
        </div>

        {/* Recommended pathway + filing + urgency */}
        <div className="space-y-3">
          <div className="card bg-navy text-white flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-teal uppercase tracking-widest mb-0.5">Recommended Pathway</p>
              <p className="text-xl font-bold">{pr?.recommended_pathway}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card border-l-4 border-teal">
              <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">Filing Recommendation</p>
              <p className="text-sm font-semibold text-navy">{pr?.filing_recommendation}</p>
            </div>
            <div className="card border-l-4 border-orange-400">
              <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">Visa Urgency</p>
              <p className="text-sm font-semibold text-navy">{pr?.visa_urgency}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Resume Evidence Map ── */}
      {data.resume_evidence_map && data.resume_evidence_map.length > 0 && (
        <section>
          <h2 className="section-heading">Resume Evidence Map</h2>
          <p className="text-sm text-mid mb-4">Every line of your resume analyzed through the lens of USCIS petition criteria.</p>
          <div className="space-y-3">
            {data.resume_evidence_map.map((item: ResumeEvidenceItem, i: number) => (
              <div key={i} className="card py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-navy flex-1">&ldquo;{item.resume_line}&rdquo;</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${strengthBadge[item.strength] ?? 'bg-gray-100 text-mid'}`}>
                    {item.strength}
                  </span>
                </div>
                <p className="text-xs font-mono text-teal">{item.criterion}</p>
                <p className="text-sm text-mid">{item.petition_argument}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Draft Proposed Endeavor ── */}
      {data.draft_proposed_endeavor && (
        <section>
          <h2 className="section-heading">Draft Proposed Endeavor Statement</h2>
          <p className="text-sm text-mid mb-3">Petition-ready language you can submit to an attorney as a first draft. Based on your actual role, employer, and accomplishments.</p>
          <div className="card bg-navy-light border-navy/10">
            <p className="text-sm text-navy leading-relaxed font-medium italic">&ldquo;{data.draft_proposed_endeavor}&rdquo;</p>
          </div>
          <p className="text-xs text-mid mt-2">⚠️ Have your attorney review and finalize before filing.</p>
        </section>
      )}

      {/* ── 4. Expert Letters ── */}
      {data.expert_letters && data.expert_letters.length > 0 && (
        <section>
          <h2 className="section-heading">Expert Letter Strategy</h2>
          <p className="text-sm text-mid mb-4">Exactly who to ask, what each letter must establish, and how to approach them.</p>
          <div className="space-y-4">
            {data.expert_letters.map((letter: ExpertLetter) => (
              <div key={letter.letter_number} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {letter.letter_number}
                  </span>
                  <p className="font-bold text-navy text-sm">{letter.who}</p>
                </div>
                <div className="pl-10 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">What They Must Establish</p>
                    <p className="text-sm text-navy">{letter.what_they_should_say}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">How to Approach</p>
                    <p className="text-sm text-mid">{letter.how_to_approach}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Evidence Playbook ── */}
      {data.evidence_playbook && data.evidence_playbook.length > 0 && (
        <section>
          <h2 className="section-heading">Evidence Playbook</h2>
          <p className="text-sm text-mid mb-4">Specific gaps, exactly what to do, and real targets — no generic advice.</p>
          <div className="space-y-3">
            {data.evidence_playbook.map((item: EvidencePlaybookItem, i: number) => (
              <div key={i} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-navy text-sm">{item.gap}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${priorityBadge[item.priority] ?? 'bg-gray-100 text-mid border-border'}`}>
                    {item.priority} priority
                  </span>
                </div>
                <p className="text-sm text-navy"><strong>Action:</strong> {item.specific_action}</p>
                <p className="text-sm text-mid"><strong>Targets:</strong> {item.named_targets}</p>
                <p className="text-xs text-mid font-semibold">⏱ {item.deadline}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Career + Visa Assessment ── */}
      <section>
        <h2 className="section-heading">Career + Visa Pathway Assessment</h2>
        <p className="text-mid text-sm mb-4 leading-relaxed">{data.career_visa_assessment?.summary}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.career_visa_assessment?.pathways?.map((p: PathwayAssessment) => (
            <div key={p.pathway} className={`rounded-xl border p-4 ${feasibilityBadge[p.feasibility] ?? 'bg-gray-100 text-mid border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{p.pathway}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/60">{p.feasibility}</span>
              </div>
              <p className="text-sm">{p.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Gap Analysis ── */}
      {data.gap_analysis && data.gap_analysis.length > 0 && (
        <section>
          <h2 className="section-heading">Gap Analysis</h2>
          <div className="space-y-3">
            {data.gap_analysis.map((g: GapItem, i: number) => (
              <div key={i} className="card py-3 flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${materialityBadge[g.materiality] ?? 'bg-gray-100 text-mid'}`}>
                  {g.materiality}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-navy text-sm">{g.gap}</p>
                  <p className="text-sm text-mid mt-1">{g.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. 30-Day Sprint Plan ── */}
      {data.sprint_30_day && data.sprint_30_day.length > 0 && (
        <section>
          <h2 className="section-heading">30-Day Sprint Plan</h2>
          <p className="text-sm text-mid mb-4">Week-by-week actions specific to your case. Start today.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.sprint_30_day.map((week: SprintWeek) => (
              <div key={week.week} className="card border-t-4 border-teal">
                <p className="font-bold text-navy text-sm mb-3">{week.week}</p>
                <ul className="space-y-2">
                  {week.actions.map((action: string, j: number) => (
                    <li key={j} className="text-sm text-mid flex gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded bg-teal-light text-teal text-xs font-bold flex items-center justify-center mt-0.5">
                        {j + 1}
                      </span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 9. Roadmap ── */}
      <section>
        <h2 className="section-heading">3 / 6 / 12-Month Roadmap</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: '3 Months', items: data.roadmap?.three_month, color: 'border-teal' },
            { label: '6 Months', items: data.roadmap?.six_month, color: 'border-navy' },
            { label: '12 Months', items: data.roadmap?.twelve_month, color: 'border-mid' },
          ].map(({ label, items, color }) => (
            <div key={label} className={`card border-t-4 ${color}`}>
              <p className="font-bold text-navy text-sm mb-3">{label}</p>
              <ul className="space-y-2">
                {items?.map((item: string, i: number) => (
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

      {/* ── 10. Attorney Briefing ── */}
      {data.attorney_briefing && (
        <section>
          <h2 className="section-heading">Attorney Briefing Paragraph</h2>
          <p className="text-sm text-mid mb-3">Copy and paste this into an email to an immigration attorney today.</p>
          <div className="card bg-gray-50 border-2 border-dashed border-border">
            <p className="text-sm text-navy leading-relaxed">{data.attorney_briefing}</p>
          </div>
          <p className="mt-2 text-xs text-mid print:hidden">Select all text above and copy to paste into an email.</p>
        </section>
      )}

      {/* ── Recommended Next Step ── */}
      <section className="card bg-navy text-white">
        <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">Your #1 Next Step (Do This Today)</p>
        <p className="text-lg font-semibold">{data.recommended_next_step}</p>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-mid">{data.disclaimer}</p>
    </div>
  )
}
