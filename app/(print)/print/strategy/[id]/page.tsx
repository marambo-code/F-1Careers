import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type {
  StrategyReport, StrategyAnswers, ResumeEvidenceItem, ExpertLetter,
  EvidencePlaybookItem, SprintWeek, GapItem, DhanasarProngAnalysis,
  O1ABridgeAnalysis, RFERiskItem,
} from '@/lib/types'

export default async function StrategyPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = createServiceClient()

  const { data: report } = await service
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('type', 'strategy')
    .single()

  if (!report || report.status !== 'complete' || !report.report_data) notFound()

  const data = report.report_data as StrategyReport
  const answers = report.questionnaire_responses as StrategyAnswers | null
  const generatedDate = new Date(report.updated_at || report.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const feasibilityColor: Record<string, string> = { High: '#00C2A8', Medium: '#B45309', Low: '#6B7280' }
  const strengthColor: Record<string, string> = { Strong: '#00C2A8', Developing: '#B45309', Gap: '#DC2626' }
  const priorityColor: Record<string, string> = { High: '#DC2626', Medium: '#B45309', Low: '#6B7280' }
  const prongColor: Record<string, string> = { Strong: '#00C2A8', Moderate: '#B45309', Weak: '#D97706', Missing: '#DC2626' }
  const pr = data.petition_readiness

  const sectionHeading = (text: string) => ({
    fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B',
    borderBottom: '2px solid #00C2A8', paddingBottom: '6px', marginBottom: '14px',
  } as React.CSSProperties)

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1B2B6B', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#00C2A8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              F-1 Careers AI · Attorney-Quality Strategy Report
            </div>
            <h1 style={{ fontSize: '22pt', fontWeight: 'bold', color: '#1B2B6B', margin: 0 }}>
              Green Card Strategy Report
            </h1>
            {answers?.full_name && (
              <p style={{ fontSize: '12pt', color: '#555566', marginTop: '6px' }}>Prepared for: {answers.full_name}</p>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#888' }}>
            <p>Generated: {generatedDate}</p>
            <p>Report ID: {id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Petition Readiness Dashboard */}
      {pr && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Petition Readiness Dashboard')}>Petition Readiness Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '9pt', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>EB-2 NIW Score</p>
              <p style={{ fontSize: '36pt', fontWeight: 900, color: pr.niw_score >= 75 ? '#00C2A8' : pr.niw_score >= 50 ? '#B45309' : '#DC2626', margin: 0 }}>{pr.niw_score}</p>
              <p style={{ fontSize: '8pt', color: '#888' }}>/100</p>
              <p style={{ fontSize: '9pt', color: '#555', marginTop: '6px', lineHeight: 1.5 }}>{pr.niw_benchmark}</p>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '9pt', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>EB-1A Score</p>
              <p style={{ fontSize: '36pt', fontWeight: 900, color: pr.eb1a_score >= 75 ? '#00C2A8' : pr.eb1a_score >= 50 ? '#B45309' : '#DC2626', margin: 0 }}>{pr.eb1a_score}</p>
              <p style={{ fontSize: '8pt', color: '#888' }}>/100</p>
              <p style={{ fontSize: '9pt', color: '#555', marginTop: '6px', lineHeight: 1.5 }}>{pr.eb1a_assessment}</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#1B2B6B', borderRadius: '10px', padding: '14px 18px', marginBottom: '12px' }}>
            <p style={{ fontSize: '9pt', fontWeight: 'bold', color: '#00C2A8', textTransform: 'uppercase', marginBottom: '4px' }}>Recommended Pathway</p>
            <p style={{ fontSize: '14pt', fontWeight: 'bold', color: 'white', margin: 0 }}>{pr.recommended_pathway}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #00C2A8', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '8pt', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Filing Recommendation</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, color: '#1B2B6B', margin: 0 }}>{pr.filing_recommendation}</p>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #F59E0B', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '8pt', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Visa Urgency</p>
              <p style={{ fontSize: '10pt', fontWeight: 600, color: '#1B2B6B', margin: 0 }}>{pr.visa_urgency}</p>
            </div>
          </div>
        </section>
      )}

      {/* Resume Evidence Map */}
      {data.resume_evidence_map && data.resume_evidence_map.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Resume Evidence Map')}>Resume Evidence Map</h2>
          {data.resume_evidence_map.map((item: ResumeEvidenceItem, i: number) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <p style={{ fontSize: '10pt', fontWeight: 600, color: '#1B2B6B', margin: 0, flex: 1, paddingRight: '12px' }}>&ldquo;{item.resume_line}&rdquo;</p>
                <span style={{ fontSize: '8pt', fontWeight: 'bold', color: strengthColor[item.strength] ?? '#555', flexShrink: 0 }}>{item.strength}</span>
              </div>
              <p style={{ fontSize: '8.5pt', color: '#00C2A8', fontWeight: 600, margin: '4px 0 2px' }}>{item.criterion}</p>
              {item.eb1a_connection && <p style={{ fontSize: '8pt', color: '#888', margin: '0 0 4px' }}>{item.eb1a_connection}</p>}
              <p style={{ fontSize: '9pt', color: '#555', margin: 0, lineHeight: 1.5 }}>{item.petition_argument}</p>
            </div>
          ))}
        </section>
      )}

      {/* Dhanasar Analysis */}
      {data.dhanasar_analysis && data.dhanasar_analysis.length > 0 && (
        <section style={{ marginBottom: '32px', pageBreakBefore: 'auto' }}>
          <h2 style={sectionHeading('NIW Dhanasar Analysis — Prong by Prong')}>NIW Dhanasar Analysis — Prong by Prong</h2>
          {data.dhanasar_analysis.map((prong: DhanasarProngAnalysis) => (
            <div key={prong.prong_number} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1B2B6B', color: 'white', fontSize: '11pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {prong.prong_number}
                  </span>
                  <strong style={{ fontSize: '11pt', color: '#1B2B6B' }}>Prong {prong.prong_number} — {prong.prong_name}</strong>
                </div>
                <span style={{ fontSize: '9pt', fontWeight: 'bold', color: prongColor[prong.score] ?? '#555', padding: '3px 10px', borderRadius: '999px', backgroundColor: prongColor[prong.score] ? `${prongColor[prong.score]}20` : '#f3f4f6' }}>{prong.score}</span>
              </div>
              <div style={{ paddingLeft: '38px' }}>
                <p style={{ fontSize: '8pt', color: '#00C2A8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>✓ What You Have</p>
                <p style={{ fontSize: '9.5pt', color: '#1B2B6B', marginBottom: '10px', lineHeight: 1.5 }}>{prong.what_you_have}</p>
                <p style={{ fontSize: '8pt', color: '#D97706', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>⚡ Critical Gap</p>
                <p style={{ fontSize: '9.5pt', color: '#1B2B6B', marginBottom: '10px', lineHeight: 1.5 }}>{prong.critical_gap}</p>
                <div style={{ backgroundColor: '#EDF0F8', borderRadius: '8px', padding: '12px 14px', borderLeft: '3px solid #1B2B6B' }}>
                  <p style={{ fontSize: '8pt', color: '#1B2B6B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>📄 Draft Petition Brief Language</p>
                  <p style={{ fontSize: '9.5pt', fontStyle: 'italic', color: '#1B2B6B', lineHeight: 1.8, margin: 0 }}>{prong.draft_petition_paragraph}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Draft Proposed Endeavor */}
      {data.draft_proposed_endeavor && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Draft Proposed Endeavor Statement')}>Draft Proposed Endeavor Statement</h2>
          <div style={{ backgroundColor: '#EDF0F8', borderRadius: '10px', padding: '16px 20px', borderLeft: '4px solid #1B2B6B' }}>
            <p style={{ fontSize: '10.5pt', fontStyle: 'italic', color: '#1B2B6B', lineHeight: 1.8, margin: 0 }}>
              &ldquo;{data.draft_proposed_endeavor}&rdquo;
            </p>
          </div>
          <p style={{ fontSize: '8.5pt', color: '#888', marginTop: '8px' }}>⚠️ Attorney review required before filing.</p>
        </section>
      )}

      {/* Expert Letters */}
      {data.expert_letters && data.expert_letters.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Expert Letter Strategy')}>Expert Letter Strategy</h2>
          {data.expert_letters.map((letter: ExpertLetter) => (
            <div key={letter.letter_number} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1B2B6B', color: 'white', fontSize: '9pt', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {letter.letter_number}
                </span>
                <strong style={{ fontSize: '10.5pt', color: '#1B2B6B' }}>{letter.who}</strong>
              </div>
              <p style={{ fontSize: '9pt', color: '#555', marginBottom: '6px' }}><strong>Must establish:</strong> {letter.what_they_should_say}</p>
              <p style={{ fontSize: '9pt', color: '#888', margin: 0 }}><strong>Approach:</strong> {letter.how_to_approach}</p>
            </div>
          ))}
        </section>
      )}

      {/* Evidence Playbook */}
      {data.evidence_playbook && data.evidence_playbook.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Evidence Playbook')}>Evidence Playbook</h2>
          {data.evidence_playbook.map((item: EvidencePlaybookItem, i: number) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderLeft: `4px solid ${priorityColor[item.priority] ?? '#6B7280'}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '10.5pt', color: '#1B2B6B' }}>{item.gap}</strong>
                <span style={{ fontSize: '8.5pt', fontWeight: 'bold', color: priorityColor[item.priority] ?? '#555' }}>{item.priority} Priority</span>
              </div>
              <p style={{ fontSize: '9.5pt', color: '#333', marginBottom: '4px' }}><strong>Action:</strong> {item.specific_action}</p>
              <p style={{ fontSize: '9.5pt', color: '#555', marginBottom: '4px' }}><strong>Targets:</strong> {item.named_targets}</p>
              <p style={{ fontSize: '8.5pt', color: '#888', margin: 0 }}>⏱ {item.deadline}</p>
            </div>
          ))}
        </section>
      )}

      {/* RFE Risks */}
      {data.rfe_risks && data.rfe_risks.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('RFE Risk Pre-Emption')}>RFE Risk Pre-Emption</h2>
          {data.rfe_risks.map((risk: RFERiskItem, i: number) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderLeft: '4px solid #F59E0B', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '10.5pt', color: '#1B2B6B' }}>{risk.likely_objection}</strong>
                <span style={{ fontSize: '8.5pt', fontWeight: 'bold', color: risk.likelihood === 'High' ? '#DC2626' : risk.likelihood === 'Medium' ? '#B45309' : '#6B7280' }}>{risk.likelihood} Risk</span>
              </div>
              <p style={{ fontSize: '8.5pt', color: '#00C2A8', fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 4px' }}>Preemptive Strategy</p>
              <p style={{ fontSize: '9.5pt', color: '#555', margin: 0, lineHeight: 1.5 }}>{risk.preemptive_strategy}</p>
            </div>
          ))}
        </section>
      )}

      {/* O-1A Bridge */}
      {data.o1a_bridge && data.o1a_bridge.applicable && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('O-1A Bridge Visa Analysis')}>O-1A Bridge Visa Analysis</h2>
          <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '9.5pt', color: '#1B2B6B', margin: 0, lineHeight: 1.5 }}>{data.o1a_bridge.why_relevant}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '8pt', color: '#00C2A8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>✓ Criteria You Meet</p>
              {data.o1a_bridge.criteria_met?.map((c: string, i: number) => (
                <p key={i} style={{ fontSize: '9pt', color: '#555', margin: '0 0 4px', paddingLeft: '10px' }}>✓ {c}</p>
              ))}
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '8pt', color: '#D97706', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>⚡ Criteria to Build</p>
              {data.o1a_bridge.criteria_gaps?.map((c: string, i: number) => (
                <p key={i} style={{ fontSize: '9pt', color: '#555', margin: '0 0 4px', paddingLeft: '10px' }}>→ {c}</p>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: '#1B2B6B', borderRadius: '8px', padding: '12px 16px' }}>
            <p style={{ fontSize: '9pt', fontWeight: 'bold', color: '#00C2A8', marginBottom: '4px' }}>Recommended Action</p>
            <p style={{ fontSize: '10pt', fontWeight: 600, color: 'white', margin: 0 }}>{data.o1a_bridge.recommended_action}</p>
          </div>
        </section>
      )}

      {/* Green Card Strategy Assessment */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={sectionHeading('Green Card Strategy Assessment')}>Green Card Strategy Assessment</h2>
        <p style={{ fontSize: '10.5pt', lineHeight: 1.7, color: '#333', marginBottom: '16px' }}>{data.career_visa_assessment?.summary}</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {data.career_visa_assessment?.pathways?.map(p => (
            <div key={p.pathway} style={{ border: `2px solid ${feasibilityColor[p.feasibility] ?? '#ccc'}`, borderRadius: '10px', padding: '12px 16px', minWidth: '180px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '11pt', color: '#1B2B6B' }}>{p.pathway}</strong>
                <span style={{ fontSize: '9pt', fontWeight: 'bold', color: feasibilityColor[p.feasibility] ?? '#555' }}>{p.feasibility}</span>
              </div>
              <p style={{ fontSize: '9.5pt', color: '#555', margin: 0, lineHeight: 1.5 }}>{p.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gap Analysis */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={sectionHeading('Gap Analysis')}>Gap Analysis</h2>
        {data.gap_analysis?.map((g: GapItem, i: number) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px', borderLeft: `4px solid ${g.materiality === 'High' ? '#DC2626' : g.materiality === 'Medium' ? '#B45309' : '#6B7280'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <strong style={{ fontSize: '10.5pt', color: '#1B2B6B' }}>{g.gap}</strong>
              <span style={{ fontSize: '9pt', fontWeight: 'bold', color: g.materiality === 'High' ? '#DC2626' : g.materiality === 'Medium' ? '#B45309' : '#6B7280' }}>{g.materiality} Priority</span>
            </div>
            <p style={{ fontSize: '9.5pt', color: '#00C2A8', fontWeight: 600, margin: 0 }}>→ {g.action}</p>
          </div>
        ))}
      </section>

      {/* 30-Day Sprint */}
      {data.sprint_30_day && data.sprint_30_day.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('30-Day Sprint Plan')}>30-Day Sprint Plan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {data.sprint_30_day.map((week: SprintWeek) => (
              <div key={week.week} style={{ border: '1px solid #e5e7eb', borderTop: '4px solid #00C2A8', borderRadius: '8px', padding: '12px 14px' }}>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1B2B6B', marginBottom: '10px' }}>{week.week}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {week.actions.map((action: string, j: number) => (
                    <li key={j} style={{ fontSize: '9pt', color: '#555', marginBottom: '6px', paddingLeft: '14px', position: 'relative', lineHeight: 1.5 }}>
                      <span style={{ position: 'absolute', left: 0, color: '#00C2A8', fontWeight: 'bold' }}>{j + 1}.</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Roadmap */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={sectionHeading('12-Month Roadmap')}>12-Month Roadmap</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { label: '0–3 Months', items: data.roadmap?.three_month },
            { label: '3–6 Months', items: data.roadmap?.six_month },
            { label: '6–12 Months', items: data.roadmap?.twelve_month },
          ].map(({ label, items }) => (
            <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1B2B6B', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>{label}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {items?.map((item: string, i: number) => (
                  <li key={i} style={{ fontSize: '9pt', color: '#555', marginBottom: '7px', paddingLeft: '12px', position: 'relative', lineHeight: 1.5 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#00C2A8', fontWeight: 'bold' }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Attorney Briefing */}
      {data.attorney_briefing && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionHeading('Attorney Briefing Paragraph')}>Attorney Briefing Paragraph</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '16px 20px' }}>
            <p style={{ fontSize: '10.5pt', color: '#1B2B6B', lineHeight: 1.8, margin: 0 }}>{data.attorney_briefing}</p>
          </div>
        </section>
      )}

      {/* Next Step */}
      <section style={{ marginBottom: '32px', backgroundColor: '#1B2B6B', borderRadius: '12px', padding: '20px 24px', color: 'white' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#00C2A8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your #1 Next Step (Do This Today)
        </h2>
        <p style={{ fontSize: '11pt', color: 'white', margin: 0, lineHeight: 1.6 }}>{data.recommended_next_step}</p>
      </section>

      {/* Disclaimer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '8.5pt', color: '#888', lineHeight: 1.6 }}>
        <p>{data.disclaimer}</p>
        <p style={{ marginTop: '6px' }}>Generated by F-1 Careers AI · f1careers-app.vercel.app · {generatedDate}</p>
      </div>
    </div>
  )
}
