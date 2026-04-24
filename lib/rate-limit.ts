/**
 * lib/rate-limit.ts
 * Simple Supabase-backed rate limiter for expensive AI routes.
 * Uses a sliding 24-hour window per user per route.
 */

import { createServiceClient } from '@/lib/supabase/server'

const LIMITS: Record<string, number> = {
  'career-moves': 15,          // 15 generations per 24h (Pro users)
  'strategy-gen': 5,           // 5 strategy report generations per 24h
  'rfe-gen': 5,                // 5 RFE generations per 24h
  'narrative-feedback': 10,    // 10 adversarial reviews per 24h
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(userId: string, route: string): Promise<RateLimitResult> {
  const limit = LIMITS[route] ?? 10
  const service = createServiceClient()
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get or create rate limit record
  const { data: existing } = await service
    .from('rate_limits')
    .select('count, window_start')
    .eq('user_id', userId)
    .eq('route', route)
    .maybeSingle()

  if (!existing) {
    // First call — create record
    await service.from('rate_limits').insert({ user_id: userId, route, count: 1, window_start: new Date().toISOString() })
    return { allowed: true, remaining: limit - 1, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  // Check if window has expired (>24h since window_start)
  const windowStartDate = new Date(existing.window_start)
  if (windowStartDate < new Date(windowStart)) {
    // Reset window
    await service.from('rate_limits').update({ count: 1, window_start: new Date().toISOString() }).eq('user_id', userId).eq('route', route)
    return { allowed: true, remaining: limit - 1, resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  }

  if (existing.count >= limit) {
    const resetAt = new Date(windowStartDate.getTime() + 24 * 60 * 60 * 1000)
    return { allowed: false, remaining: 0, resetAt }
  }

  // Increment
  await service.from('rate_limits').update({ count: existing.count + 1 }).eq('user_id', userId).eq('route', route)
  return { allowed: true, remaining: limit - existing.count - 1, resetAt: new Date(windowStartDate.getTime() + 24 * 60 * 60 * 1000) }
}
