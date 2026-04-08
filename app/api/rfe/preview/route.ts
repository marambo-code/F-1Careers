import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateRFEPreview } from '@/lib/ai/rfe-analyzer'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, storagePath, petitionType, rfeField, additionalContext } = await req.json()

    // Verify ownership
    const { data: report } = await supabase
      .from('reports')
      .select('id, user_id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Download PDF from Supabase Storage
    const service = createServiceClient()
    const { data: fileData, error: downloadError } = await service.storage
      .from('rfe-documents')
      .download(storagePath)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }

    // Parse PDF text
    const pdfParse = require('pdf-parse')
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const parsed = await pdfParse(buffer)
    const rfeText = parsed.text

    // Generate preview via AI — pass petition type and field for accurate analysis
    const preview = await generateRFEPreview(rfeText, { petitionType, rfeField, additionalContext })

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
