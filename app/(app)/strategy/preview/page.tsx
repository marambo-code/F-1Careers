import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PayButton from '@/components/strategy/PayButton'
import type { StrategyPreview } from '@/lib/types'

export default async function StrategyPreviewPage({
  searchParams,
}: {
  searchParams: { reportId?: string }
}) {
  const { reportId } = await searchParams
  if (!reportId) redirect('/strategy')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (!report) redirect('/strategy')

  // Already complete — go straight to report
  if (report.status === 'complete') redirect(`/strategy/report/${reportId}`)

  // Already generating or paid — go to report page (shows poller)
  if (report.status === 'generating' || report.status === 'paid') {
    redirect(`/strategy/report/${reportId}`)
  }

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
    redirect(`/strategy/report/${reportId}`)
  }

  // Check 2: report has a stripe_session_id — verify directly with Stripe
  // This recovers the case where the webhook failed (e.g. wrong secret at payment time)
  if (report.stripe_session_id) {
    let stripeVerified = false
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })
      const session = await stripe.checkout.sessions.retrieve(report.stripe_session_id)

      if (session.payment_status === 'paid') {
        stripeVerified = true

        // Backfill the payment record (ignore duplicate errors)
        await service.from('payments').insert({
          user_id: user.id,
          report_id: reportId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: session.amount_total ?? 0,
          status: 'complete',
          product_type: 'strategy',
        })

        await service.from('reports').update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: session.amount_total ?? 0,
        }).eq('id', reportId)
      }
    } catch {
      // Stripe API error — fall through to show pay button
    }

    // Redirect OUTSIDE the try/catch so Next.js NEXT_REDIRECT isn't swallowed
    if (stripeVerified) redirect(`/strategy/report/${reportId}`)
  }

  const preview = report.preview_data as StrategyPreview | null

  const strengthColors = {
    Strong: 'text-teal bg-teal-light',
    Developing: 'text-yellow-700 bg-yellow-50',
    Early: 'text-mid bg-gray-100',
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <span className="text-xs font-bold text-teal uppercase tracking-widest">Preview</span>
        <h1 className="text-2xl font-bold text-navy mt-1">Your Career Strategy Preview</h1>
        <p className="text-mid mt-2">Here's what the AI found. Unlock the full report to see the complete analysis.</p>
      </div>

      {preview ? (
        <>
          {/* Strength indicator */}
          <div className="card flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl font-bold text-lg ${strengthColors[preview.overall_strength]}`}>
              {preview.overall_strength}
            </div>
            <div>
              <p className="font-semibold text-navy">Overall Profile Strength</p>
              <p className="text-sm text-mid">Based on your evidence and career trajectory</p>
            </div>
          </div>

          {/* Applicable pathways */}
          <div className="card">
            <h2 className="font-bold text-navy mb-3">Applicable Visa Pathways ({preview.applicable_pathways.length})</h2>
            <div className="flex flex-wrap gap-2">
              {preview.applicable_pathways.map(p => (
                <span key={p} className={`px-3 py-1 rounded-lg text-sm font-semibold ${p === preview.top_pathway ? 'bg-navy text-white' : 'bg-navy-light text-navy'}`}>
                  {p === preview.top_pathway && '★ '}{p}
                </span>
              ))}
            </div>
            <p className="text-sm text-mid mt-3">
              Top recommended pathway: <strong className="text-navy">{preview.top_pathway}</strong>
            </p>
          </div>

          {/* Teaser */}
          <div className="card border-l-4 border-l-teal">
            <p className="text-sm font-semibold text-mid uppercase tracking-wide mb-2">From the full report</p>
            <p className="text-navy">{preview.teaser}</p>
            <div className="mt-4 blur-sm select-none pointer-events-none space-y-2">
              <p className="text-sm text-mid">■■■■■■■■ ■■■ ■■■■ ■■■■■■■■■■ ■■■■■■ ■■■■■■■ ■■■■■■■■■■■</p>
              <p className="text-sm text-mid">■■■■ ■■■■■■ ■■■ ■■■■■■■■ ■■■■■ ■■■■■■ ■■■■■■■■■■■■</p>
              <p className="text-sm text-mid">■■■■■■■■■■■■ ■■■■ ■■■■■■ ■■■ ■■■■■■■■ ■■■■■</p>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-8">
          <p className="text-mid">Generating your preview...</p>
        </div>
      )}

      {/* Payment CTA */}
      <div className="card bg-navy text-white">
        <h2 className="font-bold text-xl">Unlock Your Full Report</h2>
        <p className="text-blue-200 text-sm mt-2">
          Get the complete criterion-by-criterion breakdown, evidence map, gap analysis, and your 12-month career roadmap.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-blue-100">
          {[
            'Full criterion assessment (Strong / Developing / Gap)',
            'Complete evidence mapping tied to your resume',
            'Gap analysis with specific action items',
            '3/6/12-month career + immigration roadmap',
            'Downloadable PDF — formatted for attorneys',
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-teal">✓</span> {item}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-3xl font-bold">$300</p>
          <p className="text-blue-200 text-sm">One-time · No subscription</p>
        </div>
        <PayButton reportId={reportId} productType="strategy" className="mt-4 w-full bg-teal text-white font-bold py-3 rounded-xl hover:bg-teal/90 transition-colors" />
      </div>
    </div>
  )
}
