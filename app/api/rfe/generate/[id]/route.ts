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

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: report } = await service
      .from('reports')
      .select('id, user_id, status, questionnaire_responses, rfe_document_path, rfe_document_text')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
    if (report.status === 'generating') return NextResponse.json({ status: 'generating' })

    await service.from('reports').update({ status: 'generating' }).eq('id', id)

    // Re-extract PDF text if missing
    let rfeText = report.rfe_document_text
    if (!rfeText) {
      if (!report.rfe_document_path) throw new Error('No document found — please re-upload your RFE.')
      const { data: fileData, error: dlErr } = await service.storage
        .from('rfe-documents')
        .download(report.rfe_document_path)
      if (dlErr || !fileData) throw new Error('Could not download your RFE document from storage.')
      const pdfParse = require('pdf-parse')
      const parsed = await pdfParse(Buffer.from(await fileData.arrayBuffer()))
      rfeText = parsed.text.slice(0, 50000)
      await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', id)
    }

    const qr = report.questionnaire_responses as RFEAnswers | null
    const reportData = await generateRFEReport(rfeText, {
      petitionType: qr?.petition_type,
      rfeField: qr?.rfe_field,
      additionalContext: qr?.additional_context,
    })

    await service
      .from('reports')
      .update({ status: 'complete', report_data: reportData })
      .eq('id', id)

    if (user.email) {
      sendRFEReportReady(user.email, id, reportData.case_type ?? 'RFE Analysis').catch(e =>
        console.error('[email] rfe notify failed:', e)
      )
    }

    return NextResponse.json({ status: 'complete' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[rfe/generate] failed:', msg)
    try {
      const service = createServiceClient()
      await service.from('reports').update({ status: 'error' }).eq('id', id)
    } catch { /* ignore */ }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
