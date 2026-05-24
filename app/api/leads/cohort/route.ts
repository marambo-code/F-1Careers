import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, full_name, field, current_visa, years_in_field } = body

    if (!email || !field) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()
    const { error } = await service.from('cohort_waitlist').insert({
      email, full_name: full_name ?? null,
      field, current_visa: current_visa ?? null,
      years_in_field: years_in_field ?? null,
    })

    if (error) {
      // Unique constraint = already joined
      if (error.code === '23505') {
        return NextResponse.json({ success: true, already: true })
      }
      console.error('Cohort waitlist insert error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cohort lead error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const service = createServiceClient()
    const { data, error } = await service
      .from('cohort_waitlist')
      .select('field')

    if (error) return NextResponse.json({ counts: {} })

    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.field] = (counts[row.field] ?? 0) + 1
    }

    return NextResponse.json({ counts })
  } catch {
    return NextResponse.json({ counts: {} })
  }
}
