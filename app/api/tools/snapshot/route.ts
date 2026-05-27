import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tool, data } = await req.json()
    if (!tool || !data) return NextResponse.json({ error: 'Missing tool or data' }, { status: 400 })
    if (!['stay_score', 'roi'].includes(tool)) return NextResponse.json({ error: 'Invalid tool' }, { status: 400 })

    const column = tool === 'stay_score' ? 'stay_score_snapshot' : 'roi_snapshot'
    const { error } = await supabase
      .from('profiles')
      .update({ [column]: { ...data, saved_at: new Date().toISOString() } })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
