import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// Resets stuck/corrupt reports so the report page auto-regenerates on next visit
// POST with { reportId } — or GET with ?reportId=xxx for convenience
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reportId } = await req.json()
  const service = createServiceClient()

  await service
    .from('reports')
    .update({ status: 'error', report_data: null })
    .eq('id', reportId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true, message: `Report ${reportId} reset — visit the report page to regenerate` })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const reportId = searchParams.get('reportId')
  if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  await service
    .from('reports')
    .update({ status: 'error', report_data: null })
    .eq('id', reportId)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true, message: `Report ${reportId} reset — visit the report page to regenerate` })
}
