import { NextRequest, NextResponse } from 'next/server'
import { getPrecedentSummary } from '@/lib/precedent/queries'

export const dynamic = 'force-dynamic'

// GET /api/precedent/summary?pathway=NIW&field=software
// Returns the compact precedent summary used by client surfaces (e.g. the RFE
// wizard). Aggregates only, safe to expose to authenticated app users.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pathway = searchParams.get('pathway') ?? 'NIW'
  const field = searchParams.get('field')

  try {
    const summary = await getPrecedentSummary(pathway, field)
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[precedent/summary]', err)
    return NextResponse.json({ error: 'Failed to load precedent summary' }, { status: 500 })
  }
}
