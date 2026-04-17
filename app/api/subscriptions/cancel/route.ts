/**
 * POST /api/subscriptions/cancel
 * Toggles cancel_at_period_end on the user's active Stripe subscription.
 * - If not yet cancelling: sets cancel_at_period_end=true (access continues until period end)
 * - If already set to cancel: resumes the subscription (cancel_at_period_end=false)
 */
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: sub } = await service
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const newValue = !sub.cancel_at_period_end

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: newValue,
    })

    await service
      .from('subscriptions')
      .update({ cancel_at_period_end: newValue, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return NextResponse.json({
      ok: true,
      cancel_at_period_end: newValue,
      current_period_end: sub.current_period_end,
    })
  } catch (err) {
    console.error('[subscriptions/cancel]', err)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
