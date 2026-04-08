import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { RFEReport, RFEIssue } from '@/lib/types'

export default async function RFEPrintPage({ params }: { params: { id: string } }) {
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

  const riskColor = { High: '#DC2626', Medium: '#B45309', Low: '#16A34A' }
  const strategyColor = { Rebut: '#00C2A8', Supplement: '#1B2B6B', Narrow: '#B45309' }

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1B2B6B', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1B2B6B', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              F-1 Careers AI · RFE Response Analyzer
            </div>
            <h1 style={{ fontSize: '22pt', fontWeight: 'bold', color: '#1B2B6B', margin: 0 }}>
              RFE Response Strategy
            </h1>
            <p style={{ fontSize: '11pt', color: '#555566', marginTop: '6px' }}>{data.case_type}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#888' }}>
            <p>Generated: {generatedDate}</p>
            <p>Report ID: {id.slice(0, 8).toUpperCase()}</p>
            <p style={{ marginTop: '6px', fontWeight: 'bold', color: '#DC2626' }}>{data.issue_registry?.length} issues identified</p>
          </div>
        </div>
      </div>

      {/* Priority Action List */}
      <section style={{ marginBottom: '32px', backgroundColor: '#FEF2F2', border: '2px solid #FECACA', borderRadius: '10px', padding: '18px 22px' }}>
        <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: '#DC2626', marginBottom: '12px' }}>
          ⚡ Priority Action List — Address In This Order
        </h2>
        <ol style={{ margin: 0, padding: '0 0 0 18px' }}>
          {data.priority_action_list?.map((action, i) => (
            <li key={i} style={{ fontSize: '10pt', color: '#1a1a2e', marginBottom: '8px', lineHeight: 1.6 }}>
              {action}
            </li>
          ))}
        </ol>
      </section>

      {/* Issue Registry */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '18px' }}>
          Issue-by-Issue Analysis
        </h2>
        {data.issue_registry?.map((issue: RFEIssue) => (
          <div key={issue.number} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px', marginBottom: '16px', borderLeft: `4px solid ${riskColor[issue.risk_level] ?? '#ccc'}`, pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1B2B6B', color: 'white', fontSize: '9pt', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {issue.number}
                </span>
                <strong style={{ fontSize: '11pt', color: '#1B2B6B' }}>{issue.title}</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '9pt', fontWeight: 'bold', color: riskColor[issue.risk_level] ?? '#555' }}>{issue.risk_level} Risk</span>
                <span style={{ fontSize: '9pt', fontWeight: 'bold', color: strategyColor[issue.response_strategy] ?? '#555', backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                  {issue.response_strategy}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>What USCIS is saying</p>
              <p style={{ fontSize: '10pt', color: '#333', lineHeight: 1.6, margin: 0 }}>{issue.plain_english}</p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Evidence needed</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                {issue.evidence_gaps.map((g, i) => (
                  <li key={i} style={{ fontSize: '9.5pt', color: '#DC2626', marginBottom: '4px', lineHeight: 1.5 }}>{g}</li>
                ))}
              </ul>
            </div>

            <div>
              <p style={{ fontSize: '8.5pt', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Strategy</p>
              <p style={{ fontSize: '9.5pt', color: '#555', margin: 0, lineHeight: 1.5 }}>{issue.strategy_rationale}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Disclaimer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '8.5pt', color: '#888', lineHeight: 1.6 }}>
        <p>{data.disclaimer}</p>
        <p style={{ marginTop: '6px' }}>Generated by F-1 Careers AI · f1careers-app.vercel.app · {generatedDate}</p>
      </div>
    </div>
  )
}
