import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateStrategyPreview, computeNIWScore, computeEB1AScore } from '@/lib/ai/strategy-engine'

// NIW benchmark text based on score
function niwBenchmark(score: number, field: string): string {
  const fieldLabel = field?.includes('stem') ? 'STEM / tech' :
    field === 'medicine' ? 'medicine / healthcare' :
    field === 'business' ? 'business / finance' :
    'your field'

  if (score >= 80) return `Top 10% of NIW filers in ${fieldLabel}. Exceptionally strong case.`
  if (score >= 65) return `Above average for ${fieldLabel}. Typical successful NIW filers score 65–75.`
  if (score >= 50) return `Typical successful NIW filers in ${fieldLabel} score 65–75. You're close — targeted gap-filling will get you there.`
  if (score >= 35) return `Typical successful NIW filers in ${fieldLabel} score 65–75. You're at the 35th percentile — gaps need addressing before filing.`
  return `Typical successful NIW filers in ${fieldLabel} score 65–75. Significant development needed before a viable petition.`
}

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

    // Generate AI preview (pathways, strength, teaser)
    const aiPreview = await generateStrategyPreview(answers)

    // Inject algorithmically computed scores — same functions used by the full report
    const niw = computeNIWScore(answers)
    const eb1a = computeEB1AScore(answers)

    const preview = {
      ...aiPreview,
      niw_score: niw.score,
      niw_benchmark: niwBenchmark(niw.score, answers.field_of_work),
      eb1a_score: eb1a.score,
    }

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
