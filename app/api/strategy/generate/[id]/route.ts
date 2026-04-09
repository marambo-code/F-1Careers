import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'
import { sendStrategyReportReady } from '@/lib/email'

// Tell Vercel this function can run up to 5 minutes
export const maxDuration = 300

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Fetch report and verify ownership
    const { data: report } = await service
      .from('reports')
      .select('id, user_id, status, questionnaire_responses')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Idempotency: if already complete, return immediately
    if (report.status === 'complete') {
      return NextResponse.json({ status: 'complete' })
    }

    // Idempotency: if already generating (another request beat us here), let client keep polling
    if (report.status === 'generating') {
      return NextResponse.json({ status: 'generating' })
    }

    // Mark as generating — acts as a DB-level lock against double generation
    await service.from('reports').update({ status: 'generating' }).eq('id', id)

    // Run the AI generation — this is the long part (up to 2–3 min)
    const reportData = await generateStrategyReport(report.questionnaire_responses)

    // Save result
    await service
      .from('reports')
      .update({ status: 'complete', report_data: reportData })
      .eq('id', id)

    // Fire-and-forget email notification
    if (user.email) {
      sendStrategyReportReady(user.email, id).catch(e =>
        console.error('[email] strategy notify failed:', e)
      )
    }

    return NextResponse.json({ status: 'complete' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[strategy/generate] failed:', msg)

    // Mark as error so the UI can surface it
    try {
      const service = createServiceClient()
      await service.from('reports').update({ status: 'error' }).eq('id', id)
    } catch { /* ignore secondary failure */ }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
