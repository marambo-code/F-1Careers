import { waitUntil } from '@vercel/functions'
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

  // Include updated_at so we can detect stale 'generating' rows
  const { data: report, error: fetchErr } = await service
    .from('reports')
    .select('id, user_id, status, questionnaire_responses, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (report.status === 'complete') return NextResponse.json({ status: 'complete' })

  // Idempotency: if already generating but NOT stale, let client keep polling.
  // If it has been stuck for > 8 minutes (prior failed run), restart it.
  if (report.status === 'generating') {
    const ageMs = Date.now() - new Date(report.updated_at as string).getTime()
    const STALE_MS = 8 * 60 * 1000 // 8 minutes
    if (ageMs < STALE_MS) {
      return NextResponse.json({ status: 'generating' })
    }
    console.log(`[strategy/generate] Report ${id} stuck generating for ${Math.round(ageMs / 60000)}m — restarting`)
    // Fall through to restart
  }

  if (!report.questionnaire_responses) {
    console.error(`[strategy/generate] Report ${id} has no questionnaire_responses`)
    return NextResponse.json({ error: 'No questionnaire data found. Please re-submit the form.' }, { status: 422 })
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

  waitUntil(
    (async () => {
      try {
        console.log(`[strategy/generate] Starting background generation for report ${id}`)
        const reportData = await generateStrategyReport(questionnaire)

        const { error: saveErr } = await service
          .from('reports')
          .update({ status: 'complete', report_data: reportData })
          .eq('id', id)

        if (saveErr) {
          console.error('[strategy/generate] Failed to save report:', saveErr.message)
          await markError(id)
          return
        }

        console.log(`[strategy/generate] Generation complete for report ${id}`)
        if (userEmail) {
          sendStrategyReportReady(userEmail, id).catch(e =>
            console.error('[email] strategy notify failed:', e)
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[strategy/generate] Generation failed for report', id, ':', msg)
        await markError(id)
      }
    })()
  )

  return NextResponse.json({ status: 'generating' })
}
