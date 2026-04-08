import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId } = await req.json()

    // Verify ownership and that payment is confirmed
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    // Already done
    if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
    // Already in progress — don't start a second one
    if (report.status === 'generating') return NextResponse.json({ status: 'generating' })

    // Allow generation for 'paid' state, and also 'error' state (retry)
    // For 'pending', verify a payment record exists before allowing
    if (report.status === 'pending') {
      const service2 = createServiceClient()
      const { data: payment } = await service2
        .from('payments')
        .select('id')
        .eq('report_id', reportId)
        .eq('status', 'complete')
        .maybeSingle()
      if (!payment) return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 })
    }

    const service = createServiceClient()

    // Mark as generating to prevent duplicate calls
    await service
      .from('reports')
      .update({ status: 'generating' })
      .eq('id', reportId)

    // Generate the full report
    try {
      const reportData = await generateStrategyReport(report.questionnaire_responses)

      await service
        .from('reports')
        .update({ status: 'complete', report_data: reportData })
        .eq('id', reportId)

      return NextResponse.json({ status: 'complete' })
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      await service
        .from('reports')
        .update({ status: 'error' })
        .eq('id', reportId)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('Generate route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
