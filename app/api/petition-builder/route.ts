/**
 * GET  /api/petition-builder  — fetch user's petition progress
 * PATCH /api/petition-builder  — upsert pathway, evidence_items, narrative, service_center
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getTemplateForPathway } from '@/lib/data/petition-evidence'
import type { Pathway } from '@/lib/data/petition-evidence'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Check Pro status
    const { data: sub } = await service
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const isPro = sub?.status === 'active' || sub?.status === 'trialing'
    if (!isPro) return NextResponse.json({ error: 'pro_required' }, { status: 403 })

    const { data: progress } = await service
      .from('petition_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!progress) {
      // Return default NIW template — no row yet
      return NextResponse.json({
        pathway: 'NIW',
        evidence_items: getTemplateForPathway('NIW'),
        narrative_text: '',
        service_center: 'NSC',
      })
    }

    return NextResponse.json({
      pathway: progress.pathway,
      evidence_items: progress.evidence_items,
      narrative_text: progress.narrative_text ?? '',
      service_center: progress.service_center ?? 'NSC',
    })
  } catch (error) {
    console.error('[petition-builder GET]', error)
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Check Pro
    const { data: sub } = await service
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const isPro = sub?.status === 'active' || sub?.status === 'trialing'
    if (!isPro) return NextResponse.json({ error: 'pro_required' }, { status: 403 })

    const body = await req.json()
    const { pathway, evidence_items, narrative_text, service_center } = body

    // Validate pathway
    if (pathway && !['NIW', 'EB-1A'].includes(pathway)) {
      return NextResponse.json({ error: 'Invalid pathway' }, { status: 400 })
    }

    await service
      .from('petition_progress')
      .upsert({
        user_id: user.id,
        ...(pathway && { pathway }),
        ...(evidence_items && { evidence_items }),
        ...(narrative_text !== undefined && { narrative_text }),
        ...(service_center && { service_center }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[petition-builder PATCH]', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
