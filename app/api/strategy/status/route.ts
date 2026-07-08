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

  // Stale-job recovery: if stuck in 'generating' past any legitimate runtime
  // (worst case is ~4 min with the SDK call timeouts; the function limit is
  // 300s), reset to 'paid' so the poller retries. Kept above the generate
  // routes' 5-minute restart window so a healthy in-flight generation is
  // never duplicated by an early reset.
  if (report.status === 'generating' && report.updated_at) {
    const minutesStuck = (Date.now() - new Date(report.updated_at).getTime()) / 60000
    if (minutesStuck > 6) {
      const service = createServiceClient()
      await service.from('reports').update({ status: 'paid' }).eq('id', reportId)
      return NextResponse.json({ status: 'paid' })
    }
  }

  return NextResponse.json({ status: report.status })
}
