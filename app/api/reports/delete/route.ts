import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const reportId = searchParams.get('id')
  if (!reportId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Verify ownership before deleting
  const { data: report } = await service
    .from('reports')
    .select('id, user_id, rfe_document_path')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete stored PDF if present
  if (report.rfe_document_path) {
    await service.storage.from('rfe-documents').remove([report.rfe_document_path])
  }

  // Delete report (cascades to payments if FK set up)
  await service.from('reports').delete().eq('id', reportId)

  return NextResponse.json({ ok: true })
}
