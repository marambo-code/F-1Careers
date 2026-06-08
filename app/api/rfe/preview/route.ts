import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEPreview } from '@/lib/ai/rfe-analyzer'
import { stripDashesDeep } from '@/lib/sanitize'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, petitionType, rfeField, additionalContext } = await req.json()

    // Verify ownership and use the document path stored on the OWNED report, // never a client-supplied path (which could point at another user's file).
    const { data: report } = await supabase
      .from('reports')
      .select('id, user_id, rfe_document_path')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!report.rfe_document_path) return NextResponse.json({ error: 'No RFE document on file' }, { status: 400 })

    // Download PDF from Supabase Storage
    const service = createServiceClient()
    const { data: fileData, error: downloadError } = await service.storage
      .from('rfe-documents')
      .download(report.rfe_document_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }

    // Parse PDF text
    const pdfParse = require('pdf-parse')
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const parsed = await pdfParse(buffer)
    const rfeText = parsed.text as string

    // Detect scanned / image-only PDFs, no selectable text extracted
    if (!rfeText || rfeText.trim().length < 100) {
      return NextResponse.json({
        error: 'Your RFE PDF appears to be a scanned image with no selectable text. USCIS RFEs are usually text-based, try opening the PDF and selecting/copying text to confirm. If it is scanned, please use a PDF OCR tool (e.g. Adobe Acrobat, Smallpdf) to convert it to a text-searchable PDF and re-upload.',
      }, { status: 422 })
    }

    // Generate preview via AI, pass petition type and field for accurate analysis
    const preview = stripDashesDeep(await generateRFEPreview(rfeText, { petitionType, rfeField, additionalContext }))

    // Save to report
    await service
      .from('reports')
      .update({
        preview_data: preview,
        rfe_document_text: rfeText.slice(0, 50000), // Store first 50k chars
        status: 'pending',
      })
      .eq('id', reportId)

    return NextResponse.json({ success: true, preview })
  } catch (error) {
    console.error('RFE preview error:', error)
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 })
  }
}
