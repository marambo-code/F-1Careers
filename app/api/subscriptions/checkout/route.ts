/**
 * POST /api/subscriptions/checkout
 * ─────────────────────────────────────────────────────────────────
 * Creates a Stripe Subscription checkout session.
 * Supports monthly ($49/mo) and annual ($399/yr) billing.
 *
 * Body: { billing: 'monthly' | 'annual' }
 *
 * Env vars required:
 *   STRIPE_SUBSCRIPTION_PRICE_ID         — monthly price ID
 *   STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID  — annual price ID (optional, falls back to monthly)
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(req: Request) {
  if (!process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
    console.error('[subscriptions/checkout] STRIPE_SUBSCRIPTION_PRICE_ID is not set')
    return NextResponse.json({ error: 'STRIPE_SUBSCRIPTION_PRICE_ID env var is missing' }, { status: 500 })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY env var is missing' }, { status: 500 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse billing preference
    const body = await req.json().catch(() => ({}))
    const billing: 'monthly' | 'annual' = body?.billing === 'annual' ? 'annual' : 'monthly'

    // Pick the right price ID
    const monthlyPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    const annualPriceId = process.env.STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID
    const priceId = billing === 'annual' && annualPriceId ? annualPriceId : monthlyPriceId

    console.log(`[subscriptions/checkout] billing=${billing} priceId=${priceId}`)

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.status === 'active') {
      return NextResponse.json({ error: 'already_subscribed' }, { status: 400 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const baseUrl = appUrl && !appUrl.includes('localhost')
      ? appUrl
      : 'https://f1careers-app.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
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
