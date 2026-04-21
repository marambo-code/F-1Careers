/**
 * PATCH /api/career-moves/complete
 * Toggles the `completed` flag on a single career move stored in career_move_sets.
 * Body: { move_id: string, completed: boolean, set_id: string }
 */
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CareerMove } from '@/lib/ai/career-moves'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { move_id, completed, set_id } = await req.json()
    if (!move_id) return NextResponse.json({ error: 'move_id required' }, { status: 400 })

    const service = createServiceClient()

    // Find the target set — fall back to is_current if no set_id provided
    let query = service.from('career_move_sets').select('id, moves').eq('user_id', user.id)
    if (set_id) {
      query = query.eq('id', set_id)
    } else {
      query = query.eq('is_current', true)
    }
    const { data: set } = await query.single()

    if (!set?.moves) return NextResponse.json({ error: 'No moves found' }, { status: 404 })

    const updatedMoves = (set.moves as (CareerMove & { completed?: boolean })[])
      .map(m => m.id === move_id ? { ...m, completed: !!completed } : m)

    await service
      .from('career_move_sets')
      .update({ moves: updatedMoves })
      .eq('id', set.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[career-moves/complete]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
