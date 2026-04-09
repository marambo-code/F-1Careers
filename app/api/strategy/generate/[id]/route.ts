import { after } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'
import { sendStrategyReportReady } from '@/lib/email'

export const maxDuration = 300

async function markError(id: string) {
  const service = createServiceClient()
  try { await service.from('reports').update({ status: 'error' }).eq('id', id) } catch { /* ignore */ }
}

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

  if (fetchErr || !report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (report.status === 'complete') return NextResponse.json({ status: 'complete' })

  // Allow retry if stuck generating for more than 8 minutes (prior failed run)
  if (report.status === 'generating') {
    const ageMs = Date.now() - new Date(report.updated_at as string).getTime()
    if (ageMs < 8 * 60 * 1000) {
      return NextResponse.json({ status: 'generating' })
    }
    console.log(`[strategy/generate] Report ${id} stuck for ${Math.round(ageMs / 60000)}m — restarting`)
  }

  if (!report.questionnaire_responses) {
    console.error(`[strategy/generate] Report ${id} has no questionnaire_responses`)
    return NextResponse.json({ error: 'No questionnaire data found.' }, { status: 422 })
  }

  const { error: lockErr } = await service
    .from('reports')
    .update({ status: 'generating', report_data: null })
    .eq('id', id)

  if (lockErr) {
    console.error('[strategy/generate] Failed to lock report:', lockErr.message)
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
  }

  const userEmail = user.email
  const questionnaire = report.questionnaire_responses

  // after() is Next.js 15's native API for background work after the response is sent.
  // It keeps the serverless function alive until the promise resolves (up to maxDuration).
  // No external package needed — built into next/server since Next.js 15.1.
  after(async () => {
    try {
      console.log(`[strategy/generate] Starting generation for report ${id}`)
      const reportData = await generateStrategyReport(questionnaire)

      const { error: saveErr } = await service
        .from('reports')
        .update({ status: 'complete', report_data: reportData })
        .eq('id', id)

      if (saveErr) {
        console.error('[strategy/generate] Failed to save:', saveErr.message)
        await markError(id)
        return
      }

      console.log(`[strategy/generate] Complete for report ${id}`)
      if (userEmail) {
        sendStrategyReportReady(userEmail, id).catch(e =>
          console.error('[email] notify failed:', e)
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[strategy/generate] FAILED for report', id, ':', msg)
      await markError(id)
    }
  })

  return NextResponse.json({ status: 'generating' })
}
