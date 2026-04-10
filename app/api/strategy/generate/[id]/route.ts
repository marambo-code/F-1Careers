import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'
import { sendStrategyReportReady } from '@/lib/email'

// Allow this function to run up to 5 minutes (Vercel Pro required for > 60s)
export const maxDuration = 300

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: report, error: fetchErr } = await service
    .from('reports')
    .select('id, user_id, status, questionnaire_responses, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Already done — return immediately
  if (report.status === 'complete') {
    return NextResponse.json({ status: 'complete' })
  }

  const ageMs = Date.now() - new Date(report.updated_at as string).getTime()

  // Generating — only block retry if started < 5 minutes ago (parallel calls finish in ~45s)
  if (report.status === 'generating') {
    if (ageMs < 5 * 60 * 1000) {
      return NextResponse.json({ status: 'generating' })
    }
    // Stale generating — fall through and restart
    console.log(`[strategy/generate] Restarting stale generating report ${id} (${Math.round(ageMs / 60000)}min old)`)
  }

  // Error state — fall through and restart (user explicitly requested retry)
  if (report.status === 'error') {
    console.log(`[strategy/generate] Restarting errored report ${id}`)
  }

  if (!report.questionnaire_responses) {
    return NextResponse.json({ error: 'No questionnaire data — please resubmit the form.' }, { status: 422 })
  }

  // Lock the row
  await service.from('reports').update({ status: 'generating', report_data: null }).eq('id', id)

  console.log(`[strategy/generate] Starting generation for report ${id}`)

  try {
    const reportData = await generateStrategyReport(report.questionnaire_responses)

    const { error: saveErr } = await service
      .from('reports')
      .update({ status: 'complete', report_data: reportData })
      .eq('id', id)

    if (saveErr) {
      console.error('[strategy/generate] DB save failed:', saveErr.message)
      await service.from('reports').update({ status: 'error' }).eq('id', id)
      return NextResponse.json({ error: `Failed to save report: ${saveErr.message}` }, { status: 500 })
    }

    console.log(`[strategy/generate] Complete for report ${id}`)

    if (user.email) {
      sendStrategyReportReady(user.email, id).catch(e =>
        console.error('[email] notify failed:', e)
      )
    }

    return NextResponse.json({ status: 'complete' })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[strategy/generate] FAILED for report', id, ':', msg)
    await service.from('reports').update({ status: 'error' }).eq('id', id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
