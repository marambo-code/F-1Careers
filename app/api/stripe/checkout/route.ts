import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const PRICES = {
  strategy: process.env.STRIPE_STRATEGY_PRICE_ID!,
  rfe: process.env.STRIPE_RFE_PRICE_ID!,
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, productType } = await req.json()

    if (!PRICES[productType as keyof typeof PRICES]) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 })
    }

    // Verify report belongs to user
    const { data: report } = await supabase
      .from('reports')
      .select('id, status')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    if (report.status === 'complete') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICES[productType as keyof typeof PRICES],
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        report_id: reportId,
        user_id: user.id,
        product_type: productType,
      },
      success_url: `${appUrl}/${productType}/report/${reportId}?payment=success`,
      cancel_url: `${appUrl}/${productType}/preview?reportId=${reportId}&payment=cancelled`,
    })

    // Store session ID on report
    await supabase
      .from('reports')
      .update({ stripe_session_id: session.id })
      .eq('id', reportId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
