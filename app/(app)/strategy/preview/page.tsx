import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PayButton from '@/components/strategy/PayButton'
import type { StrategyPreview } from '@/lib/types'

export default async function StrategyPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string }>
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
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
        <h1 className="text-2xl font-bold text-navy mt-1">Your Green Card Strategy Preview</h1>
        <p className="text-mid mt-2">Here's what the AI found. Unlock the full report to see the complete analysis.</p>
      </div>

      {preview ? (
        <>
          {/* Score dashboard */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* NIW Score */}
            <div className="card text-center space-y-2">
              <p className="text-xs font-bold text-mid uppercase tracking-widest">EB-2 NIW Score</p>
              <p className={`text-6xl font-black ${
                (preview.niw_score ?? 0) >= 65 ? 'text-teal' :
                (preview.niw_score ?? 0) >= 45 ? 'text-yellow-600' : 'text-orange-500'
              }`}>{preview.niw_score ?? '—'}</p>
              <p className="text-xs text-mid">/100</p>
              {preview.niw_benchmark && (
                <p className="text-xs text-mid leading-relaxed border-t border-border pt-2">{preview.niw_benchmark}</p>
              )}
            </div>

            {/* EB-1A Score */}
            <div className="card text-center space-y-2">
              <p className="text-xs font-bold text-mid uppercase tracking-widest">EB-1A Score</p>
              <p className={`text-6xl font-black ${
                (preview.eb1a_score ?? 0) >= 70 ? 'text-teal' :
                (preview.eb1a_score ?? 0) >= 50 ? 'text-yellow-600' : 'text-orange-500'
              }`}>{preview.eb1a_score ?? '—'}</p>
              <p className="text-xs text-mid">/100</p>
              <p className="text-xs text-mid leading-relaxed border-t border-border pt-2">
                {(preview.eb1a_score ?? 0) >= 70 ? 'Competitive EB-1A case — full breakdown in report.' :
                 (preview.eb1a_score ?? 0) >= 50 ? 'Developing EB-1A case — 12–18 months of credential building needed.' :
                 'EB-1A is premature — focus on NIW pathway first.'}
              </p>
            </div>
          </div>

          {/* Recommended pathway + strength */}
          <div className="card flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-mid uppercase tracking-widest mb-1">Recommended Pathway</p>
              <p className="text-xl font-black text-navy">{preview.top_pathway}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-sm ${strengthColors[preview.overall_strength]}`}>
              {preview.overall_strength} Profile
            </div>
          </div>

          {/* Teaser — locked */}
          <div className="card border-l-4 border-l-teal">
            <p className="text-sm font-semibold text-mid uppercase tracking-wide mb-2">AI Assessment Preview</p>
            <p className="text-navy">{preview.teaser}</p>
            <div className="mt-4 space-y-2 relative">
              <div className="blur-sm select-none pointer-events-none space-y-2">
                <p className="text-sm text-mid">■■■■■■■■ ■■■ ■■■■ ■■■■■■■■■■ ■■■■■■ ■■■■■■■ ■■■■■■■■■■■</p>
                <p className="text-sm text-mid">■■■■ ■■■■■■ ■■■ ■■■■■■■■ ■■■■■ ■■■■■■ ■■■■■■■■■■■■</p>
                <p className="text-sm text-mid">■■■■■■■■■■■■ ■■■■ ■■■■■■ ■■■ ■■■■■■■■ ■■■■■</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white border border-border rounded-lg px-3 py-1 text-xs font-semibold text-navy shadow-sm">🔒 Unlock full report</span>
              </div>
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
