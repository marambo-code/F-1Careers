#!/usr/bin/env node
/**
 * scripts/run-migration.mjs
 * Applies the subscription schema migration to Supabase.
 * Run: node scripts/run-migration.mjs
 */

import { readFileSync, dirname } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const SQL = `
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.score_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  green_card_score integer not null,
  niw_score integer,
  eb1a_score integer,
  snapshot_label text,
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists career_moves jsonb;
alter table public.profiles add column if not exists career_moves_updated_at timestamptz;

alter table public.subscriptions enable row level security;
alter table public.score_history enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can view own score history" on public.score_history;
create policy "Users can view own score history" on public.score_history
  for select using (auth.uid() = user_id);
`

const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql: SQL }),
})

if (res.ok) {
  console.log('✓ Migration applied successfully')
} else {
  const body = await res.text()
  console.log('Note: Direct SQL RPC not available via REST. Apply schema.sql manually in Supabase Dashboard.')
  console.log('Go to: https://supabase.com/dashboard/project/bpoyxatswymvqebldtcj/sql/new')
}
