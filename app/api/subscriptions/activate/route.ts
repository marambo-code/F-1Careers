/**
 * POST /api/subscriptions/activate
 * ─────────────────────────────────────────────────────────────────
 * Called immediately from the success page after Stripe redirects.
 * Verifies the checkout session with Stripe and writes the subscription
 * record to Supabase right away — so the user sees Pro instantly
 * without waiting for the webhook to arrive.
 *
 * The webhook (/api/subscriptions/webhook) will also fire and upsert
 * the same record — that's fine, upsert is idempotent.
 */

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

    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Payment not confirmed yet' }, { status: 402 })
    }

    const sub = session.subscription as Stripe.Subscription | null
    if (!sub) return NextResponse.json({ error: 'No subscription found on session' }, { status: 400 })

    const service = createServiceClient()

    await service.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: sub.id,
      status: 'active',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ status: 'active' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[subscriptions/activate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
