/**
 * POST /api/subscriptions/checkout
 * ─────────────────────────────────────────────────────────────────
 * Creates a Stripe Subscription checkout session ($49/month).
 * On success, Stripe redirects to /subscribe/success?session_id=...
 * The subscription webhook handles provisioning.
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST() {
  // Guard: env vars must be present
  if (!process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
    console.error('[subscriptions/checkout] STRIPE_SUBSCRIPTION_PRICE_ID is not set')
    return NextResponse.json({ error: 'STRIPE_SUBSCRIPTION_PRICE_ID env var is missing — add it in Vercel dashboard' }, { status: 500 })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[subscriptions/checkout] STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY env var is missing' }, { status: 500 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.status === 'active') {
      return NextResponse.json({ error: 'already_subscribed' }, { status: 400 })
    }

    // Always use the real prod URL for redirects — never localhost
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const baseUrl = appUrl && !appUrl.includes('localhost')
      ? appUrl
      : 'https://f1careers-app.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID, quantity: 1 }],
      customer_email: user.email,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[subscriptions/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
