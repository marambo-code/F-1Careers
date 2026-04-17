/**
 * DELETE /api/account/delete
 * Permanently deletes the authenticated user's account:
 * 1. Cancels active Stripe subscription
 * 2. Deletes all DB data (cascades from auth.users)
 * 3. Deletes the Supabase Auth user
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // 1. Cancel Stripe subscription if active
    const { data: sub } = await service
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (sub?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id)
      } catch (e) {
        // Non-fatal — subscription may already be canceled
        console.warn('[account/delete] Stripe cancel warning:', e instanceof Error ? e.message : e)
      }
    }

    // 2. Delete storage files (resume, RFE documents)
    try {
      const { data: resumeFiles } = await service.storage.from('resumes').list(user.id)
      if (resumeFiles?.length) {
        await service.storage.from('resumes').remove(resumeFiles.map(f => `${user.id}/${f.name}`))
      }
      const { data: rfeFiles } = await service.storage.from('rfe-documents').list(user.id)
      if (rfeFiles?.length) {
        await service.storage.from('rfe-documents').remove(rfeFiles.map(f => `${user.id}/${f.name}`))
      }
    } catch (e) {
      console.warn('[account/delete] Storage cleanup warning:', e)
    }

    // 3. Delete auth user — cascades to profiles, reports, payments, subscriptions, score_history
    const { error: deleteErr } = await service.auth.admin.deleteUser(user.id)
    if (deleteErr) throw new Error(`Auth delete failed: ${deleteErr.message}`)

    return NextResponse.json({ deleted: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[account/delete]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
