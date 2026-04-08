import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const service = createServiceClient()

  const { data: reports } = await service
    .from('reports')
    .select('id, type, status, stripe_session_id, amount_paid, created_at, rfe_document_text, questionnaire_responses')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: payments } = await service
    .from('payments')
    .select('id, report_id, status, amount, stripe_session_id')
    .eq('user_id', user.id)

  // Check Stripe status for any report with a session ID
  const enriched = await Promise.all((reports ?? []).map(async (r) => {
    let stripeStatus = null
    if (r.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(r.stripe_session_id)
        stripeStatus = session.payment_status
      } catch (e: unknown) {
        stripeStatus = 'error: ' + (e instanceof Error ? e.message : String(e))
      }
    }
    return {
      ...r,
      rfe_document_text: r.rfe_document_text ? `[${r.rfe_document_text.length} chars]` : null,
      questionnaire_responses: r.questionnaire_responses ? '[present]' : null,
      stripeStatus,
    }
  }))

  return NextResponse.json({ reports: enriched, payments })
}
