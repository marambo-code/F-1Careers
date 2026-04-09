import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEReport } from '@/lib/ai/rfe-analyzer'
import { sendRFEReportReady } from '@/lib/email'
import type { RFEAnswers } from '@/lib/types'

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
    .select('id, user_id, status, questionnaire_responses, rfe_document_path, rfe_document_text')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Idempotency ───────────────────────────────────────────────────
  if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
  if (report.status === 'generating') return NextResponse.json({ status: 'generating' })

  // ── Lock the row ──────────────────────────────────────────────────
  const { error: lockErr } = await service
    .from('reports')
    .update({ status: 'generating', report_data: null })
    .eq('id', id)

  if (lockErr) {
    console.error('[rfe/generate] Failed to lock report:', lockErr.message)
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
  }

  const userEmail = user.email
  const qr = report.questionnaire_responses as RFEAnswers | null
  const existingRfeText = report.rfe_document_text as string | null
  const rfePath = report.rfe_document_path as string | null

  // ── Fire background generation ────────────────────────────────────
  waitUntil(
    (async () => {
      try {
        console.log(`[rfe/generate] Starting background generation for report ${id}`)

        // Re-extract PDF text if missing
        let rfeText = existingRfeText
        if (!rfeText) {
          if (!rfePath) {
            console.error('[rfe/generate] No document found for report', id)
            await markError(id)
            return
          }
          const { data: fileData, error: dlErr } = await service.storage
            .from('rfe-documents')
            .download(rfePath)
          if (dlErr || !fileData) {
            console.error('[rfe/generate] Could not download RFE document for report', id)
            await markError(id)
            return
          }
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require('pdf-parse')
          const parsed = await pdfParse(Buffer.from(await fileData.arrayBuffer()))
          rfeText = parsed.text.slice(0, 50000) as string
          try {
            await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', id)
          } catch { /* non-fatal: text is still in memory */ }
        }

        const reportData = await generateRFEReport(rfeText, {
          petitionType: qr?.petition_type,
          rfeField: qr?.rfe_field,
          additionalContext: qr?.additional_context,
        })

        const { error: saveErr } = await service
          .from('reports')
          .update({ status: 'complete', report_data: reportData })
          .eq('id', id)

        if (saveErr) {
          console.error('[rfe/generate] Failed to save report:', saveErr.message)
          await markError(id)
          return
        }

        console.log(`[rfe/generate] Generation complete for report ${id}`)

        if (userEmail) {
          sendRFEReportReady(userEmail, id, reportData.case_type ?? 'RFE Analysis').catch(e =>
            console.error('[email] rfe notify failed:', e)
          )
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[rfe/generate] Generation failed for report', id, ':', msg)
        await markError(id)
      }
    })()
  )

  // ── Return immediately — client polls /api/rfe/status/[id] ────────
  return NextResponse.json({ status: 'generating' })
}
