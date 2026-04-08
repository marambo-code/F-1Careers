import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { StrategyReport, StrategyAnswers } from '@/lib/types'

export default async function StrategyPrintPage({ params }: { params: { id: string } }) {
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

  const feasibilityColor = { High: '#00C2A8', Medium: '#B45309', Low: '#DC2626' }
  const ratingColor = { Strong: '#00C2A8', Developing: '#B45309', Gap: '#DC2626' }

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1B2B6B', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#00C2A8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>
              F-1 Careers AI · Career Strategy Report
            </div>
            <h1 style={{ fontSize: '22pt', fontWeight: 'bold', color: '#1B2B6B', margin: 0 }}>
              Career & Visa Strategy Report
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

      {/* Career & Visa Assessment */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '14px' }}>
          Career & Visa Assessment
        </h2>
        <p style={{ fontSize: '10.5pt', lineHeight: 1.7, color: '#333' }}>{data.career_visa_assessment?.summary}</p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
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

      {/* Criterion Breakdown */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '14px' }}>
          Criterion-by-Criterion Breakdown
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#EDF0F8' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1B2B6B', fontWeight: 'bold' }}>Pathway</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1B2B6B', fontWeight: 'bold' }}>Criterion</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: '#1B2B6B', fontWeight: 'bold' }}>Rating</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#1B2B6B', fontWeight: 'bold' }}>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {data.criterion_breakdown?.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '7px 10px', color: '#555', fontWeight: '500' }}>{c.pathway}</td>
                <td style={{ padding: '7px 10px', color: '#1B2B6B', fontWeight: '600' }}>{c.criterion}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                  <span style={{ color: ratingColor[c.rating] ?? '#555', fontWeight: 'bold' }}>{c.rating}</span>
                </td>
                <td style={{ padding: '7px 10px', color: '#555', lineHeight: 1.5 }}>{c.evidence_summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Gap Analysis */}
      <section style={{ marginBottom: '32px', pageBreakBefore: 'auto' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '14px' }}>
          Gap Analysis
        </h2>
        {data.gap_analysis?.map((g, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px', borderLeft: `4px solid ${g.materiality === 'High' ? '#DC2626' : g.materiality === 'Medium' ? '#B45309' : '#6B7280'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <strong style={{ fontSize: '10.5pt', color: '#1B2B6B' }}>{g.gap}</strong>
              <span style={{ fontSize: '9pt', fontWeight: 'bold', color: g.materiality === 'High' ? '#DC2626' : g.materiality === 'Medium' ? '#B45309' : '#6B7280' }}>
                {g.materiality} Priority
              </span>
            </div>
            <p style={{ fontSize: '9.5pt', color: '#00C2A8', fontWeight: '600', margin: 0 }}>→ {g.action}</p>
          </div>
        ))}
      </section>

      {/* Roadmap */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1B2B6B', borderBottom: '2px solid #1B2B6B', paddingBottom: '6px', marginBottom: '14px' }}>
          12-Month Roadmap
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { label: '0–3 Months', items: data.roadmap?.three_month },
            { label: '3–6 Months', items: data.roadmap?.six_month },
            { label: '6–12 Months', items: data.roadmap?.twelve_month },
          ].map(({ label, items }) => (
            <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#1B2B6B', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>{label}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {items?.map((item, i) => (
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

      {/* Next Step */}
      <section style={{ marginBottom: '32px', backgroundColor: '#1B2B6B', borderRadius: '12px', padding: '20px 24px', color: 'white' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', color: '#00C2A8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Recommended Next Step
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
