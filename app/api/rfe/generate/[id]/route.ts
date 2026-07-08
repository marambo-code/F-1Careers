import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEReport } from '@/lib/ai/rfe-analyzer'
import { stripDashesDeep } from '@/lib/sanitize'
import { sendRFEReportReady } from '@/lib/email'
import type { RFEAnswers } from '@/lib/types'
import {
  consumeKeyQuota,
  isProMember,
  rfeReanalysisRoute,
  RFE_REANALYSIS_PER_REPORT_LIMIT,
} from '@/lib/usage-limits'

export const maxDuration = 300

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Optional body: { reanalyze: true } requests a re-run of a completed
  // report. The GeneratingView poller POSTs with no body; tolerate that.
  let reanalyze = false
  try {
    const body = await req.json()
    reanalyze = body?.reanalyze === true
  } catch { /* no body */ }

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
    if (!reanalyze) {
      return NextResponse.json({ status: 'complete' })
    }

    // ── Pro re-analysis gate (server-side, authoritative) ────────────
    // Pro members can re-run a purchased, completed RFE analysis up to
    // RFE_REANALYSIS_PER_REPORT_LIMIT times per report (lifetime counter in
    // rate_limits, route 'rfe-reanalysis:<reportId>'). The $297 purchase
    // itself is unchanged and applies to everyone.
    const pro = await isProMember(user.id)
    if (!pro) {
      return NextResponse.json({
        error: 'pro_required',
        message: 'Re-analysis of a completed report is a Pro member benefit.',
      }, { status: 403 })
    }
    const quota = await consumeKeyQuota(user.id, rfeReanalysisRoute(id), RFE_REANALYSIS_PER_REPORT_LIMIT)
    if (!quota.allowed) {
      return NextResponse.json({
        error: 'reanalysis_limit',
        message: `You have used both re-analyses for this report (${RFE_REANALYSIS_PER_REPORT_LIMIT} per purchased report).`,
      }, { status: 403 })
    }
    console.log(`[rfe/generate] Pro re-analysis ${quota.used}/${quota.limit} for report ${id}`)
    // Fall through: the shared pipeline below re-extracts (if needed),
    // regenerates, and marks the report complete again.
  }

  // Payment gate: the full analysis is generated only after purchase. An unpaid
  // report stays 'pending'; the Stripe webhook moves it to 'paid' before this runs.
  if (report.status === 'pending') {
    return NextResponse.json({ error: 'Payment required for the full analysis.' }, { status: 402 })
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
      console.log(`[rfe/generate] rfe_document_text missing/short, falling back to storage path: ${rfePath}`)
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

      // Detect scanned / image-only PDFs, no selectable text
      if (!rfeText || rfeText.trim().length < 100) {
        await service.from('reports').update({ status: 'error' }).eq('id', id)
        return NextResponse.json({
          error: 'Your RFE PDF appears to be a scanned image (no selectable text). Please export or scan it as a text-based PDF and re-upload. Most USCIS RFE PDFs are text-based, try opening it and copying text to confirm.',
        }, { status: 422 })
      }

      await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', id)
    }

    const qr = report.questionnaire_responses as RFEAnswers | null
    const reportData = stripDashesDeep(await generateRFEReport(rfeText!, {
      petitionType: qr?.petition_type,
      rfeField: qr?.rfe_field,
      additionalContext: qr?.additional_context,
    }))

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
      try {
        await sendRFEReportReady(user.email, id, reportData.case_type ?? 'RFE Analysis')
      } catch (e) {
        console.error('[email] notify failed:', e)
      }
    }

    return NextResponse.json({ status: 'complete' })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[rfe/generate] FAILED for report', id, ':', msg)
    await service.from('reports').update({ status: 'error' }).eq('id', id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
