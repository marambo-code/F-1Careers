/**
 * PATCH /api/career-moves/update
 * Updates status and/or notes on a single career move.
 *
 * Handles two storage backends:
 *  - career_move_sets table (new system, set_id is a UUID)
 *  - profiles.career_moves JSONB (legacy, set_id === 'legacy' or missing)
 *
 * Body: { move_id: string, set_id?: string, status?: MoveStatus, notes?: string }
 */
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CareerMove } from '@/lib/ai/career-moves'

export type MoveStatus = 'not_started' | 'in_progress' | 'done' | 'skipped'

type StoredMove = CareerMove & { status?: MoveStatus; notes?: string; completed?: boolean }

function applyUpdate(move: StoredMove, status?: MoveStatus, notes?: string): StoredMove {
  const updated = { ...move }
  if (status !== undefined) {
    updated.status = status
    updated.completed = status === 'done'
  }
  if (notes !== undefined) updated.notes = notes
  return updated
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { move_id, set_id, status, notes } = await req.json()
    if (!move_id) return NextResponse.json({ error: 'move_id required' }, { status: 400 })

    const service = createServiceClient()

    // ── Legacy path: update profiles.career_moves ─────────────────
    if (!set_id || set_id === 'legacy') {
      const { data: profile } = await service
        .from('profiles')
        .select('career_moves')
        .eq('id', user.id)
        .single()

      const cached = profile?.career_moves as {
        moves: StoredMove[];
        generated_at?: string;
        report_id?: string;
      } | null

      if (!cached?.moves) return NextResponse.json({ error: 'No moves found' }, { status: 404 })

      const updatedMoves = cached.moves.map(m =>
        m.id === move_id ? applyUpdate(m, status, notes) : m
      )

      await service
        .from('profiles')
        .update({ career_moves: { ...cached, moves: updatedMoves } })
        .eq('id', user.id)

      return NextResponse.json({ ok: true })
    }

    // ── New system: update career_move_sets ───────────────────────
    const { data: set } = await service
      .from('career_move_sets')
      .select('id, moves')
      .eq('id', set_id)
      .eq('user_id', user.id)
      .single()

    if (!set?.moves) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

    const updatedMoves = (set.moves as StoredMove[]).map(m =>
      m.id === move_id ? applyUpdate(m, status, notes) : m
    )

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
