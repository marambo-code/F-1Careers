import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEReport } from '@/lib/ai/rfe-analyzer'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId } = await req.json()

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    if (report.status === 'complete') return NextResponse.json({ status: 'complete' })
    if (report.status === 'generating') return NextResponse.json({ status: 'generating' })

    const service = createServiceClient()

    // For pending: verify payment exists
    if (report.status === 'pending') {
      const { data: payment } = await service
        .from('payments')
        .select('id')
        .eq('report_id', reportId)
        .eq('status', 'complete')
        .maybeSingle()
      if (!payment) return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 })
    }

    // If document text wasn't saved during preview, re-extract it from storage now
    let rfeText = report.rfe_document_text
    if (!rfeText) {
      if (!report.rfe_document_path) {
        return NextResponse.json({ error: 'No document found. Please re-upload your RFE.' }, { status: 400 })
      }
      try {
        const { data: fileData, error: downloadError } = await service.storage
          .from('rfe-documents')
          .download(report.rfe_document_path)
        if (downloadError || !fileData) throw new Error('Download failed')
        const pdfParse = require('pdf-parse')
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const parsed = await pdfParse(buffer)
        rfeText = parsed.text.slice(0, 50000)
        // Save it for future use
        await service.from('reports').update({ rfe_document_text: rfeText }).eq('id', reportId)
      } catch (e) {
        console.error('PDF re-extraction failed:', e)
        return NextResponse.json({ error: 'Failed to extract document text. Please re-upload your RFE.' }, { status: 500 })
      }
    }

    // Extract petition context from questionnaire_responses
    const qr = report.questionnaire_responses as { petition_type?: string; rfe_field?: string; additional_context?: string } | null
    const rfeOpts = {
      petitionType: qr?.petition_type,
      rfeField: qr?.rfe_field,
      additionalContext: qr?.additional_context,
    }

    // Mark as generating
    await service.from('reports').update({ status: 'generating' }).eq('id', reportId)

    try {
      const reportData = await generateRFEReport(rfeText, rfeOpts)
      await service.from('reports').update({ status: 'complete', report_data: reportData }).eq('id', reportId)
      return NextResponse.json({ status: 'complete' })
    } catch (aiError) {
      console.error('RFE AI generation failed:', aiError)
      await service.from('reports').update({ status: 'error' }).eq('id', reportId)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('RFE generate route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
