import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEReport } from '@/lib/ai/rfe-analyzer'
import { sendRFEReportReady } from '@/lib/email'
import type { RFEAnswers } from '@/lib/types'

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
    .select('id, user_id, status, questionnaire_responses, rfe_document_path, rfe_document_text, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  if (report.status === 'complete') {
    return NextResponse.json({ status: 'complete' })
  }

  const ageMs = Date.now() - new Date(report.updated_at as string).getTime()

  if (report.status === 'generating') {
    if (ageMs < 5 * 60 * 1000) {
      return NextResponse.json({ status: 'generating' })
    }
    console.log(`[rfe/generate] Restarting stale generating report ${id} (${Math.round(ageMs / 60000)}min old)`)
  }

  if (report.status === 'error') {
    console.log(`[rfe/generate] Restarting errored report ${id}`)
  }

  await service.from('reports').update({ status: 'generating', report_data: null }).eq('id', id)

  console.log(`[rfe/generate] Starting generation for report ${id}`)

  try {
    // Re-extract PDF text if missing or empty (empty string = scanned PDF on first pass)
    let rfeText = report.rfe_document_text as string | null
    const textIsMissing = rfeText === null || rfeText === undefined || rfeText.trim().length < 100

    if (textIsMissing) {
      const rfePath = report.rfe_document_path as string | null
      console.log(`[rfe/generate] rfe_document_text missing/short — falling back to storage path: ${rfePath}`)
      if (!rfePath) {
        await service.from('reports').update({ status: 'error' }).eq('id', id)
        return NextResponse.json({
          error: 'No RFE document found. Please go back and re-upload your RFE PDF.',
        }, { status: 422 })
      }
      const { data: fileData, error: dlErr } = await service.storage.from('rfe-documents').download(rfePath)
      if (dlErr || !fileData) {
        await service.from('reports').update({ status: 'error' }).eq('id', id)
        return NextResponse.json({ error: 'Could not download RFE document from storage.' }, { status: 500 })
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const parsed = await pdfParse(Buffer.from(await fileData.arrayBuffer()))
      rfeText = parsed.text.slice(0, 50000) as string

      // Detect scanned / image-only PDFs — no selectable text
      if (!rfeText || rfeText.trim().length < 100) {
        await service.from('reports').update({ status: 'error' }).eq('id', id)
        return NextResponse.json({
          error: 'Your RFE PDF appears to be a scanned image (no selectable text). Please export or scan it as a text-based PDF and re-upload. Most USCIS RFE PDFs are text-based — try opening it and copying text to confirm.',
        }, { status: 422 })
      }

      await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', id)
    }

    const qr = report.questionnaire_responses as RFEAnswers | null
    const reportData = await generateRFEReport(rfeText!, {
      petitionType: qr?.petition_type,
      rfeField: qr?.rfe_field,
      additionalContext: qr?.additional_context,
    })

    const { error: saveErr } = await service
      .from('reports')
      .update({ status: 'complete', report_data: reportData })
      .eq('id', id)

    if (saveErr) {
      console.error('[rfe/generate] DB save failed:', saveErr.message)
      await service.from('reports').update({ status: 'error' }).eq('id', id)
      return NextResponse.json({ error: `Failed to save report: ${saveErr.message}` }, { status: 500 })
    }

    console.log(`[rfe/generate] Complete for report ${id}`)

    if (user.email) {
      sendRFEReportReady(user.email, id, reportData.case_type ?? 'RFE Analysis').catch(e =>
        console.error('[email] notify failed:', e)
      )
    }

    return NextResponse.json({ status: 'complete' })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[rfe/generate] FAILED for report', id, ':', msg)
    await service.from('reports').update({ status: 'error' }).eq('id', id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
