/**
 * PATCH /api/career-moves/update
 * Updates status and/or notes on a single career move in career_move_sets.
 * Body: { move_id: string, set_id?: string, status?: MoveStatus, notes?: string }
 */
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CareerMove } from '@/lib/ai/career-moves'

export type MoveStatus = 'not_started' | 'in_progress' | 'done' | 'skipped'

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { move_id, set_id, status, notes } = await req.json()
    if (!move_id) return NextResponse.json({ error: 'move_id required' }, { status: 400 })

    const service = createServiceClient()

    // Find the target set
    let query = service
      .from('career_move_sets')
      .select('id, moves')
      .eq('user_id', user.id)

    if (set_id) {
      query = query.eq('id', set_id)
    } else {
      query = query.eq('is_current', true)
    }

    const { data: set } = await query.single()
    if (!set?.moves) return NextResponse.json({ error: 'No moves found' }, { status: 404 })

    type StoredMove = CareerMove & { status?: MoveStatus; notes?: string; completed?: boolean }
    const updatedMoves = (set.moves as StoredMove[]).map(m => {
      if (m.id !== move_id) return m
      const updated = { ...m }
      if (status !== undefined) {
        updated.status = status
        updated.completed = status === 'done' // keep backward compat
      }
      if (notes !== undefined) updated.notes = notes
      return updated
    })

    await service
      .from('career_move_sets')
      .update({ moves: updatedMoves })
      .eq('id', set.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[career-moves/update]', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
