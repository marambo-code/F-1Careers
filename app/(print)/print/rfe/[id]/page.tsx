import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { RFEReport, RFEIssue } from '@/lib/types'

export default async function RFEPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = createServiceClient()

  const { data: report } = await service
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('type', 'rfe')
    .single()

  if (!report || report.status !== 'complete' || !report.report_data) notFound()

  const data = report.report_data as RFEReport
  const generatedDate = new Date(report.updated_at || report.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const riskColor: Record<string, string> = { High: '#DC2626', Medium: '#B45309', Low: '#16A34A' }
  const riskBg: Record<string, string> = { High: '#FEF2F2', Medium: '#FFFBEB', Low: '#F0FDF4' }
  const strategyColor: Record<string, string> = { Rebut: '#00C2A8', Supplement: '#1B2B6B', Narrow: '#B45309' }
  const overallRisk = data.overall_denial_risk ?? 'High'

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a2e', lineHeight: 1.5 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '3px solid #1B2B6B', paddingBottom: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1B2B6B', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              F-1 Careers AI · RFE Response Analyzer
            </div>
            <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#1B2B6B', margin: '0 0 4px 0' }}>
              RFE Response Strategy
            </h1>
            <p style={{ fontSize: '10pt', color: '#555566', margin: 0 }}>{data.case_type}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#888' }}>
            <p style={{ margin: '0 0 2px 0' }}>Generated: {generatedDate}</p>
            <p style={{ margin: '0 0 6px 0' }}>Report ID: {id.slice(0, 8).toUpperCase()}</p>
            <p style={{ margin: 0, fontWeight: 'bold', color: riskColor[overallRisk] }}>
              {data.issue_registry?.length} issues · {overallRisk} Denial Risk
            </p>
          </div>
        </div>
      </div>

      {/* ── Overall Assessment ───────────────────────────────── */}
      {(data.overall_assessment || data.response_deadline_note) && (
        <div style={{ backgroundColor: riskBg[overallRisk], border: `2px solid ${riskColor[overallRisk]}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
          {data.overall_assessment && (
            <p style={{ fontSize: '10.5pt', color: riskColor[overallRisk], fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: 1.6 }}>
              {data.overall_assessment}
            </p>
          )}
          {data.response_deadline_note && (
            <p style={{ fontSize: '9.5pt', color: '#DC2626', margin: 0, lineHeight: 1.6 }}>
              ⏰ {data.response_deadline_note}
            </p>
          )}
        </div>
      )}

      {/* ── Priority Action List ─────────────────────────────── */}
      <section style={{ marginBottom: '28px', backgroundColor: '#FEF2F2', border: '2px solid #FECACA', borderRadius: '10px', padding: '16px 20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#DC2626', marginBottom: '10px', marginTop: 0 }}>
          ⚡ Priority Action List — Address In This Order
        </h2>
        <ol style={{ margin: 0, padding: '0 0 0 18px' }}>
          {data.priority_action_list?.map((action, i) => (
            <li key={i} style={{ fontSize: '9.5pt', color: '#1a1a2e', marginBottom: '7px', lineHeight: 1.6 }}>
              {action}
            </li>
          ))}
        </ol>
      </section>

      {/* ── Issue Registry ───────────────────────────────────── */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '16px', marginTop: 0 }}>
          Issue-by-Issue Analysis
        </h2>
        {data.issue_registry?.map((issue: RFEIssue) => (
          <div key={issue.number} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', marginBottom: '20px', borderLeft: `4px solid ${riskColor[issue.risk_level] ?? '#ccc'}`, pageBreakInside: 'avoid' }}>
            {/* Issue header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#1B2B6B', color: 'white', fontSize: '8pt', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {issue.number}
                </span>
                <strong style={{ fontSize: '11pt', color: '#1B2B6B' }}>{issue.title}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '8.5pt', fontWeight: 'bold', color: riskColor[issue.risk_level] ?? '#555' }}>{issue.risk_level} Risk</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 'bold', color: strategyColor[issue.response_strategy] ?? '#555', backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                  {issue.response_strategy}
                </span>
              </div>
            </div>

            {/* Legal citation */}
            {issue.uscis_citation && (
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>Legal Standard Invoked</p>
                <p style={{ fontSize: '9pt', fontFamily: 'Courier, monospace', color: '#1B2B6B', margin: 0 }}>{issue.uscis_citation}</p>
              </div>
            )}

            {/* Plain English */}
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>What USCIS Is Saying</p>
              <p style={{ fontSize: '9.5pt', color: '#333', lineHeight: 1.6, margin: 0 }}>{issue.plain_english}</p>
            </div>

            {/* Denial risk if unaddressed */}
            {issue.denial_risk_if_unaddressed && (
              <div style={{ backgroundColor: '#FEF2F2', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #FECACA' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>If Left Unaddressed</p>
                <p style={{ fontSize: '9pt', color: '#B91C1C', margin: 0, lineHeight: 1.6 }}>{issue.denial_risk_if_unaddressed}</p>
              </div>
            )}

            {/* Evidence gaps */}
            {issue.evidence_gaps?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Evidence Gaps USCIS Identified</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {issue.evidence_gaps.map((g, i) => (
                    <li key={i} style={{ fontSize: '9pt', color: '#DC2626', marginBottom: '4px', lineHeight: 1.5 }}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specific documents */}
            {issue.specific_documents?.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Documents to Obtain</p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', listStyleType: 'square' }}>
                  {issue.specific_documents.map((doc, i) => (
                    <li key={i} style={{ fontSize: '9pt', color: '#1a1a2e', marginBottom: '4px', lineHeight: 1.5 }}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Draft rebuttal paragraph */}
            {issue.draft_rebuttal_paragraph && (
              <div style={{ backgroundColor: '#F0FFFE', borderRadius: '8px', padding: '12px 14px', border: '1px solid #A7F3D0', marginBottom: '10px' }}>
                <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#00C2A8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>
                  ✏ Draft Rebuttal Language — Ready to Use
                </p>
                <p style={{ fontSize: '9.5pt', color: '#1B2B6B', margin: 0, lineHeight: 1.7, fontStyle: 'italic' }}>
                  {issue.draft_rebuttal_paragraph}
                </p>
              </div>
            )}

            {/* Strategy rationale */}
            <div>
              <p style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Strategy & Execution</p>
              <p style={{ fontSize: '9pt', color: '#555', margin: 0, lineHeight: 1.5 }}>{issue.strategy_rationale}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Response Timeline ────────────────────────────────── */}
      {data.response_timeline?.length > 0 && (
        <section style={{ marginBottom: '28px', pageBreakBefore: 'always' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '16px', marginTop: 0 }}>
            87-Day Response Timeline
          </h2>
          {data.response_timeline.map((week, i) => (
            <div key={i} style={{ marginBottom: '14px', pageBreakInside: 'avoid' }}>
              <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1B2B6B', margin: '0 0 6px 0', backgroundColor: '#F0F4FF', padding: '5px 10px', borderRadius: '6px' }}>
                {week.week}
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                {week.actions.map((action, j) => (
                  <li key={j} style={{ fontSize: '9.5pt', color: '#333', marginBottom: '4px', lineHeight: 1.6 }}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ── Cover Letter Outline ─────────────────────────────── */}
      {data.cover_letter_outline?.length > 0 && (
        <section style={{ marginBottom: '28px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '12px', marginTop: 0 }}>
            Cover Letter Outline
          </h2>
          <p style={{ fontSize: '9.5pt', color: '#666', margin: '0 0 12px 0' }}>Structure your RFE response cover letter using these sections.</p>
          <ol style={{ margin: 0, padding: '0 0 0 18px' }}>
            {data.cover_letter_outline.map((section, i) => (
              <li key={i} style={{ fontSize: '9.5pt', color: '#1a1a2e', marginBottom: '8px', lineHeight: 1.6 }}>{section}</li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Attorney Briefing ────────────────────────────────── */}
      {data.attorney_briefing && (
        <section style={{ marginBottom: '28px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '12px', marginTop: 0 }}>
            Attorney Briefing
          </h2>
          <p style={{ fontSize: '9.5pt', color: '#666', margin: '0 0 10px 0' }}>Copy and send this to an immigration attorney to begin your representation conversation.</p>
          <div style={{ backgroundColor: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '14px 16px' }}>
            <p style={{ fontSize: '10pt', color: '#1B2B6B', margin: 0, lineHeight: 1.7 }}>{data.attorney_briefing}</p>
          </div>
        </section>
      )}

      {/* ── Disclaimer ───────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px', fontSize: '8pt', color: '#888', lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 4px 0' }}>{data.disclaimer}</p>
        <p style={{ margin: 0 }}>Generated by F-1 Careers AI · {generatedDate}</p>
      </div>
    </div>
  )
}
