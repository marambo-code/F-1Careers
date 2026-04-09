import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyReport } from '@/lib/ai/strategy-engine'
import { sendStrategyReportReady } from '@/lib/email'

// Allow Vercel to keep the function alive up to 5 minutes for background generation
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

  // ── Auth ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // ── Fetch & verify ownership ──────────────────────────────────────
  const { data: report, error: fetchErr } = await service
    .from('reports')
    .select('id, user_id, status, questionnaire_responses')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Idempotency ───────────────────────────────────────────────────
  if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
  if (report.status === 'generating') return NextResponse.json({ status: 'generating' })

  // ── Lock the row — mark as generating ────────────────────────────
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

  // ── Fire background generation — returns immediately to client ────
  // waitUntil tells Vercel to keep this Lambda alive until the promise
  // resolves (up to maxDuration = 300s), even after the HTTP response is sent.
  // This prevents the function from being killed mid-generation, which was
  // causing status to freeze at 'generating' forever.
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

  // ── Return immediately — client will poll /api/strategy/status/[id] ─
  return NextResponse.json({ status: 'generating' })
}
