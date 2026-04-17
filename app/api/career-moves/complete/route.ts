/**
 * PATCH /api/career-moves/complete
 * Toggles the `completed` flag on a single career move stored in profiles.career_moves.
 * Body: { move_id: string, completed: boolean }
 */
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CareerMove } from '@/lib/ai/career-moves'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { move_id, completed } = await req.json()
    if (!move_id) return NextResponse.json({ error: 'move_id required' }, { status: 400 })

    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('career_moves')
      .eq('id', user.id)
      .single()

    const cached = profile?.career_moves as { moves: (CareerMove & { completed?: boolean })[]; generated_at: string; report_id?: string } | null
    if (!cached?.moves) return NextResponse.json({ error: 'No moves found' }, { status: 404 })

    const updated = {
      ...cached,
      moves: cached.moves.map(m => m.id === move_id ? { ...m, completed: !!completed } : m),
    }

    await service.from('profiles').update({ career_moves: updated }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[career-moves/complete]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
