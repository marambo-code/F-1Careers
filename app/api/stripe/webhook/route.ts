import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { report_id, user_id, product_type } = session.metadata ?? {}

    if (!report_id || !user_id || !product_type) {
      console.error('Missing metadata in webhook')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Record payment
    await supabase.from('payments').insert({
      user_id,
      report_id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: session.amount_total ?? 0,
      status: 'complete',
      product_type,
    })

    // Mark report as paid — generation happens client-side via /api/*/generate
    await supabase
      .from('reports')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: session.amount_total ?? 0,
      })
      .eq('id', report_id)

    console.log(`✓ Payment recorded for report ${report_id}. Status → paid.`)
  }

  // Return 200 immediately so Stripe doesn't timeout/retry
  return NextResponse.json({ received: true })
}
