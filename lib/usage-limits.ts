/**
 * lib/usage-limits.ts
 * Server-side Pro plan usage counters, built on the existing rate_limits
 * table (user_id, route, count, window_start, unique(user_id, route)).
 *
 * Two kinds of counter:
 *  - Calendar-month counters: the window resets on the 1st of each month
 *    (e.g. strategy regenerations, 3 per calendar month for Pro members).
 *  - Per-key lifetime counters: never reset (e.g. RFE re-analyses, 2 per
 *    purchased report; the key embeds the report id).
 *
 * All writes go through the service client (RLS bypassed); reads for the UI
 * go through the small GET endpoints that call the check* helpers, so the
 * window logic lives in exactly one place.
 */

import { createServiceClient } from '@/lib/supabase/server'

export const STRATEGY_REGEN_MONTHLY_LIMIT = 3
export const STRATEGY_REGEN_ROUTE = 'strategy-regen-monthly'

export const RFE_REANALYSIS_PER_REPORT_LIMIT = 2
export const rfeReanalysisRoute = (reportId: string) => `rfe-reanalysis:${reportId}`

export interface QuotaStatus {
  used: number
  remaining: number
  limit: number
  /** First day of the next calendar month (monthly counters only). */
  resetsOn?: string
}

function monthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function nextMonthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
}

// ── Calendar-month counter ─────────────────────────────────────────

export async function checkMonthlyQuota(
  userId: string,
  route: string,
  limit: number
): Promise<QuotaStatus> {
  const service = createServiceClient()
  const { data } = await service
    .from('rate_limits')
    .select('count, window_start')
    .eq('user_id', userId)
    .eq('route', route)
    .maybeSingle()

  const resetsOn = nextMonthStart().toISOString()
  if (!data || new Date(data.window_start) < monthStart()) {
    return { used: 0, remaining: limit, limit, resetsOn }
  }
  const used = Math.min(data.count, limit)
  return { used, remaining: Math.max(limit - data.count, 0), limit, resetsOn }
}

/**
 * Atomically-enough consume one unit of a monthly quota. Returns allowed=false
 * (and consumes nothing) when the quota is exhausted for the current month.
 */
export async function consumeMonthlyQuota(
  userId: string,
  route: string,
  limit: number
): Promise<QuotaStatus & { allowed: boolean }> {
  const service = createServiceClient()
  const { data } = await service
    .from('rate_limits')
    .select('count, window_start')
    .eq('user_id', userId)
    .eq('route', route)
    .maybeSingle()

  const resetsOn = nextMonthStart().toISOString()
  const now = new Date().toISOString()

  if (!data) {
    await service.from('rate_limits').insert({ user_id: userId, route, count: 1, window_start: now })
    return { allowed: true, used: 1, remaining: limit - 1, limit, resetsOn }
  }

  // Window from a previous month: reset
  if (new Date(data.window_start) < monthStart()) {
    await service.from('rate_limits')
      .update({ count: 1, window_start: now })
      .eq('user_id', userId).eq('route', route)
    return { allowed: true, used: 1, remaining: limit - 1, limit, resetsOn }
  }

  if (data.count >= limit) {
    return { allowed: false, used: limit, remaining: 0, limit, resetsOn }
  }

  await service.from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('user_id', userId).eq('route', route)
  return { allowed: true, used: data.count + 1, remaining: limit - data.count - 1, limit, resetsOn }
}

// ── Per-key lifetime counter (no window reset) ─────────────────────

export async function checkKeyQuota(
  userId: string,
  route: string,
  limit: number
): Promise<QuotaStatus> {
  const service = createServiceClient()
  const { data } = await service
    .from('rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('route', route)
    .maybeSingle()

  const used = Math.min(data?.count ?? 0, limit)
  return { used, remaining: Math.max(limit - (data?.count ?? 0), 0), limit }
}

export async function consumeKeyQuota(
  userId: string,
  route: string,
  limit: number
): Promise<QuotaStatus & { allowed: boolean }> {
  const service = createServiceClient()
  const { data } = await service
    .from('rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('route', route)
    .maybeSingle()

  if (!data) {
    await service.from('rate_limits').insert({
      user_id: userId, route, count: 1, window_start: new Date().toISOString(),
    })
    return { allowed: true, used: 1, remaining: limit - 1, limit }
  }

  if (data.count >= limit) {
    return { allowed: false, used: limit, remaining: 0, limit }
  }

  await service.from('rate_limits')
    .update({ count: data.count + 1 })
    .eq('user_id', userId).eq('route', route)
  return { allowed: true, used: data.count + 1, remaining: limit - data.count - 1, limit }
}

// ── Shared helper: is this user a Pro member? ──────────────────────

export async function isProMember(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const { data } = await service
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
  return !!data
}
