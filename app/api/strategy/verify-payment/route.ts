import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId } = await req.json()

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
    if (!report.stripe_session_id) return NextResponse.json({ status: 'no_session' })

    // Verify directly with Stripe
    const session = await stripe.checkout.sessions.retrieve(report.stripe_session_id)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ status: 'unpaid' })
    }

    const service = createServiceClient()

    // Upsert payment record (may already exist from a partial webhook)
    const { data: existingPayment } = await service
      .from('payments')
      .select('id')
      .eq('stripe_session_id', report.stripe_session_id)
      .maybeSingle()

    if (!existingPayment) {
      await service.from('payments').insert({
        user_id: user.id,
        report_id: reportId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total ?? 0,
        status: 'complete',
        product_type: 'strategy',
      })
    }

    // Update report status to paid so the poller can generate
    await service
      .from('reports')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: session.amount_total ?? 0,
      })
      .eq('id', reportId)

    return NextResponse.json({ status: 'paid' })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
