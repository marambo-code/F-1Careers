import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const reportId = searchParams.get('reportId')
  if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: report } = await supabase
    .from('reports')
    .select('status, updated_at')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If stuck in 'generating' for > 2 minutes, reset to 'paid' so poller retries
  if (report.status === 'generating' && report.updated_at) {
    const minutesStuck = (Date.now() - new Date(report.updated_at).getTime()) / 60000
    if (minutesStuck > 2) {
      const service = createServiceClient()
      await service.from('reports').update({ status: 'paid' }).eq('id', reportId)
      return NextResponse.json({ status: 'paid' })
    }
  }

  return NextResponse.json({ status: report.status })
}
