import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyPreview } from '@/lib/ai/strategy-engine'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, answers } = await req.json()

    // Verify ownership
    const { data: report } = await supabase
      .from('reports')
      .select('id, user_id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Generate preview via AI
    const preview = await generateStrategyPreview(answers)

    // Save preview to report
    const service = createServiceClient()
    await service
      .from('reports')
      .update({ preview_data: preview, status: 'pending' })
      .eq('id', reportId)

    return NextResponse.json({ success: true, preview })
  } catch (error) {
    console.error('Strategy preview error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
