export const maxDuration = 300 // Vercel: allow up to 5 min (requires Pro plan)

/**
 * POST /api/petition-builder/generate
 * ─────────────────────────────────────────────────────────────────
 * Generates a full petition package (personal statement + cover letter)
 * using the user's profile, narrative, and completed evidence items.
 *
 * Stores the result in petition_progress.generated_petition.
 * Rate limit: 5 generations per 24h (expensive, uses 2 AI calls).
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generatePetitionPackage } from '@/lib/ai/petition-generator'
import { getPrecedentGroundingAlways } from '@/lib/precedent/grounding'
import { checkRateLimit } from '@/lib/rate-limit'
import type { EvidenceItem, Pathway } from '@/lib/data/petition-evidence'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Pro check
    const { data: sub } = await service
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (sub?.status !== 'active' && sub?.status !== 'trialing') {
      return NextResponse.json({ error: 'pro_required' }, { status: 403 })
    }

    // Rate limit
    const rateLimit = await checkRateLimit(user.id, 'petition-gen')
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return NextResponse.json(
        { error: 'rate_limited', message: `Limit reached. Resets at ${resetTime}.` },
        { status: 429 }
      )
    }

    // Load petition progress + profile + latest strategy report in parallel
    const [progressResult, profileResult, reportResult] = await Promise.all([
      service.from('petition_progress').select('*').eq('user_id', user.id).maybeSingle(),
      service.from('profiles').select('full_name, university, degree, field_of_study, current_employer, job_title, visa_status, country_of_birth').eq('id', user.id).single(),
      service.from('reports')
        .select('report_data')
        .eq('user_id', user.id)
        .eq('type', 'strategy')
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const progress = progressResult.data
    const profile = profileResult.data ?? {}
    const strategyData = reportResult.data?.report_data as Record<string, unknown> | null

    if (!progress) {
      return NextResponse.json({ error: 'No petition progress found. Start the Evidence Track first.' }, { status: 400 })
    }

    const pathway = (progress.pathway ?? 'NIW') as Pathway
    const narrative = progress.narrative_text ?? ''
    const evidenceItems = (progress.evidence_items ?? []) as EvidenceItem[]

    // Ground the draft in real AAO adjudication patterns (Pro interactive
    // tool, so the flag-independent variant). Resolves to '' on any failure
    // or timeout; the draft still generates ungrounded.
    const grounding = await getPrecedentGroundingAlways(pathway === 'EB-1A' ? 'EB1A' : 'NIW')

    // Generate
    const packet = await generatePetitionPackage(
      profile,
      pathway,
      narrative,
      evidenceItems,
      strategyData,
      grounding
    )

    // Save to petition_progress
    await service
      .from('petition_progress')
      .update({
        generated_petition: packet,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json(packet)
  } catch (error) {
    console.error('[petition-gen]', error)
    return NextResponse.json({ error: 'Failed to generate petition' }, { status: 500 })
  }
}
