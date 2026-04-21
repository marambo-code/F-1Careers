/**
 * POST /api/subscriptions/webhook
 * ─────────────────────────────────────────────────────────────────
 * Handles Stripe subscription lifecycle events.
 * Register this endpoint in Stripe Dashboard → Webhooks.
 * Set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET in Vercel env vars.
 *
 * Events handled:
 *  • checkout.session.completed (subscription mode) — initial provisioning
 *  • customer.subscription.updated — status/period changes
 *  • customer.subscription.deleted — cancellation
 *  • invoice.payment_failed — mark as past_due
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// This is a SEPARATE webhook secret from the one-time payment webhook
const WEBHOOK_SECRET = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET!

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    console.error('[sub/webhook] STRIPE_SUBSCRIPTION_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[sub/webhook] Signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // ── checkout.session.completed (subscription) ────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription') return NextResponse.json({ received: true })

    const userId = session.metadata?.user_id
    if (!userId) {
      console.error('[sub/webhook] Missing user_id in session metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const subscriptionId = session.subscription as string
    const customerId = session.customer as string

    // Fetch subscription details to get period end
    const sub = await stripe.subscriptions.retrieve(subscriptionId)

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: 'active',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    console.log(`✓ Subscription activated for user ${userId}`)
  }

  // ── customer.subscription.created / updated ──────────────────────
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    const statusMap: Record<string, string> = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'past_due',
      incomplete: 'past_due',
      incomplete_expired: 'canceled',
      paused: 'past_due',
    }

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_subscription_id: sub.id,
      status: statusMap[sub.status] ?? 'canceled',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    console.log(`✓ Subscription ${event.type} for user ${userId}: ${sub.status}`)
  }

  // ── customer.subscription.deleted ───────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ received: true })

    await supabase.from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    console.log(`✓ Subscription canceled for user ${userId}`)
  }

  // ── invoice.payment_failed ───────────────────────────────────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    if (!subscriptionId) return NextResponse.json({ received: true })

    await supabase.from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', subscriptionId)

    console.log(`⚠ Payment failed for subscription ${subscriptionId}`)
  }

  return NextResponse.json({ received: true })
}
