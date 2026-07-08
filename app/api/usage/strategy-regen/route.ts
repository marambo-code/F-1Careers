import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  checkMonthlyQuota,
  isProMember,
  STRATEGY_REGEN_MONTHLY_LIMIT,
  STRATEGY_REGEN_ROUTE,
} from '@/lib/usage-limits'

// Read-only view of the signed-in user's strategy regeneration allowance.
// Free members: 1 regeneration per report (tracked on the report itself).
// Pro members: STRATEGY_REGEN_MONTHLY_LIMIT per calendar month.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pro = await isProMember(user.id)
    if (!pro) {
      return NextResponse.json({ isPro: false })
    }

    const quota = await checkMonthlyQuota(user.id, STRATEGY_REGEN_ROUTE, STRATEGY_REGEN_MONTHLY_LIMIT)
    return NextResponse.json({
      isPro: true,
      limit: quota.limit,
      used: quota.used,
      remaining: quota.remaining,
      resetsOn: quota.resetsOn,
    })
  } catch (error) {
    console.error('Usage route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
