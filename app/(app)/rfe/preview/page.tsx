import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PayButton from '@/components/strategy/PayButton'
import type { RFEPreview } from '@/lib/types'

export default async function RFEPreviewPage({
  searchParams,
}: {
  searchParams: { reportId?: string }
}) {
  const { reportId } = await searchParams
  if (!reportId) redirect('/rfe')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (!report) redirect('/rfe')
  if (report.status === 'complete') redirect(`/rfe/report/${reportId}`)
  if (report.status === 'generating' || report.status === 'paid') redirect(`/rfe/report/${reportId}`)

  const service = createServiceClient()

  // Check 1: payment record in our DB
  const { data: payment } = await service
    .from('payments')
    .select('id')
    .eq('report_id', reportId)
    .eq('status', 'complete')
    .maybeSingle()

  if (payment) {
    await service.from('reports').update({ status: 'paid' }).eq('id', reportId)
    redirect(`/rfe/report/${reportId}`)
  }

  // Check 2: verify directly with Stripe if we have a session ID
  if (report.stripe_session_id) {
    let stripeVerified = false
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })
      const session = await stripe.checkout.sessions.retrieve(report.stripe_session_id)

      if (session.payment_status === 'paid') {
        stripeVerified = true

        await service.from('payments').insert({
          user_id: user.id,
          report_id: reportId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total ?? 0,
          status: 'complete',
          product_type: 'rfe',
        })

        await service.from('reports').update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: session.amount_total ?? 0,
        }).eq('id', reportId)
      }
    } catch {
      // Stripe error — fall through to pay button
    }

    if (stripeVerified) redirect(`/rfe/report/${reportId}`)
  }

  const preview = report.preview_data as RFEPreview | null

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <span className="text-xs font-bold text-navy uppercase tracking-widest">Preview</span>
        <h1 className="text-2xl font-bold text-navy mt-1">RFE Analysis Preview</h1>
        <p className="text-mid mt-2">Here's what we found in your document. Unlock the full analysis to see the complete response strategy.</p>
      </div>

      {preview ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-navy">{preview.issue_count}</p>
              <p className="text-sm text-mid mt-1">Issues Found</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-600">{preview.high_risk_count}</p>
              <p className="text-sm text-mid mt-1">High Risk</p>
            </div>
            <div className="card text-center">
              <p className="text-sm font-bold text-navy">{preview.case_type}</p>
              <p className="text-sm text-mid mt-1">Case Type</p>
            </div>
          </div>

          <div className="card border-l-4 border-l-navy">
            <p className="text-sm font-semibold text-mid uppercase tracking-wide mb-2">From the full analysis</p>
            <p className="text-navy">{preview.teaser}</p>
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="blur-sm select-none pointer-events-none border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-navy">Issue {i}: ■■■■■■■■■■■■■■</span>
                    <span className="badge-high">High</span>
                  </div>
                  <p className="text-sm text-mid">■■■■■ ■■■■■■■■■■■ ■■■■■ ■■■■■■■■ ■■■■■■■■■■■■■■■■■</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-8">
          <p className="text-mid">Analyzing your document...</p>
        </div>
      )}

      <div className="card bg-navy text-white">
        <h2 className="font-bold text-xl">Unlock Your Full RFE Analysis</h2>
        <p className="text-blue-200 text-sm mt-2">
          Every issue explained in plain English. Risk rankings. Response strategies. Priority action list ready for your attorney.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-blue-100">
          {[
            `All ${preview?.issue_count ?? ''} issues numbered and named individually`,
            'Plain-English translation of each USCIS challenge',
            'Risk ranking: High / Medium / Low per issue',
            'Response strategy: Rebut / Supplement / Narrow',
            'Priority action list formatted for your attorney',
            'Downloadable PDF',
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-teal">✓</span> {item}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-3xl font-bold">$200</p>
          <p className="text-blue-200 text-sm">One-time · No subscription</p>
        </div>
        <PayButton
          reportId={reportId}
          productType="rfe"
          className="mt-4 w-full bg-teal text-white font-bold py-3 rounded-xl hover:bg-teal/90 transition-colors"
        />
      </div>
    </div>
  )
}
