#!/usr/bin/env node
/**
 * scripts/setup-subscription.mjs
 * ─────────────────────────────────────────────────────────────────
 * One-time setup script for the Green Card Score Pro subscription.
 *
 * Run from the project root:
 *   node scripts/setup-subscription.mjs
 *
 * What it does (fully automated):
 *  1. Creates the $29/month Stripe subscription price
 *  2. Creates the Stripe subscription webhook endpoint (pointing to your prod URL)
 *  3. Runs the Supabase schema migration (subscriptions + score_history tables)
 *  4. Writes the new env vars to .env.local
 *  5. Pushes all env vars to Vercel (if vercel CLI is installed & logged in)
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load env vars ────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, '.env.local')
  const raw = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    env[key] = value
  }
  return env
}

function updateEnvFile(key, value) {
  const envPath = resolve(ROOT, '.env.local')
  let raw = readFileSync(envPath, 'utf8')
  if (raw.includes(`${key}=`)) {
    raw = raw.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
  } else {
    raw = raw.trimEnd() + `\n${key}=${value}\n`
  }
  writeFileSync(envPath, raw)
  console.log(`  ✓ ${key} written to .env.local`)
}

// ── Step 1 + 2: Stripe ───────────────────────────────────────────
async function setupStripe(env) {
  console.log('\n── Step 1: Stripe ──────────────────────────────────────────')
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)

  // Check if subscription price already exists
  const existingPrices = await stripe.prices.list({ limit: 100 })
  const existing = existingPrices.data.find(p =>
    p.nickname === 'Green Card Score Pro' && p.recurring?.interval === 'month' && p.active
  )

  let priceId
  if (existing) {
    priceId = existing.id
    console.log(`  ✓ Subscription price already exists: ${priceId}`)
  } else {
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: 2900,
      recurring: { interval: 'month' },
      nickname: 'Green Card Score Pro',
      product_data: {
        name: 'Green Card Score Pro',
        description: 'Living Green Card Score, 4 personalized career moves, score history tracking',
        metadata: { app: 'f1careers' },
      },
    })
    priceId = price.id
    console.log(`  ✓ Created subscription price: ${priceId} ($29/month)`)
  }

  // Step 2: Create subscription webhook endpoint
  console.log('\n── Step 2: Stripe Webhook ──────────────────────────────────')

  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace('http://localhost:3000', 'https://f1careers.vercel.app') ?? ''
  if (!appUrl || appUrl.includes('localhost')) {
    console.log('  ⚠  NEXT_PUBLIC_APP_URL is localhost — please enter your production URL:')
    console.log('     e.g. https://your-app.vercel.app')
    console.log('     Skipping webhook creation. Create it manually in Stripe Dashboard.')
    console.log('     URL: <your-prod-url>/api/subscriptions/webhook')
    console.log('     Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed')
    return { priceId, webhookSecret: null }
  }

  const webhookUrl = `${appUrl}/api/subscriptions/webhook`
  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 })
  const existingWebhook = existingWebhooks.data.find(w => w.url === webhookUrl)

  let webhookSecret = null
  if (existingWebhook) {
    console.log(`  ✓ Webhook already exists: ${webhookUrl}`)
    console.log('  ⚠  Cannot retrieve existing webhook secret — check Stripe Dashboard if needed')
  } else {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed',
      ],
      description: 'Green Card Score Pro — subscription lifecycle',
    })
    webhookSecret = webhook.secret
    console.log(`  ✓ Created webhook: ${webhookUrl}`)
    console.log(`  ✓ Webhook secret: ${webhookSecret}`)
  }

  return { priceId, webhookSecret }
}

// ── Step 3: Supabase migration ───────────────────────────────────
async function runSupabaseMigration(env) {
  console.log('\n── Step 3: Supabase Schema Migration ───────────────────────')

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const sql = `
-- subscriptions table
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

-- score_history table
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

-- profile extensions
alter table public.profiles add column if not exists career_moves jsonb;
alter table public.profiles add column if not exists career_moves_updated_at timestamptz;

-- RLS
alter table public.subscriptions enable row level security;
alter table public.score_history enable row level security;

-- policies (drop first so re-runs are safe)
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Users can view own score history" on public.score_history;
create policy "Users can view own score history" on public.score_history
  for select using (auth.uid() = user_id);
`

  // Run via Supabase REST API (pg_meta endpoint)
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`

  // Try using the supabase client's rpc or raw query
  // Supabase JS client doesn't expose raw SQL directly — use the management API
  const mgmtUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'https://api.supabase.com/')
  const projectRef = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

  if (!projectRef) {
    console.log('  ⚠  Could not determine project ref — run schema.sql manually in Supabase Dashboard')
    return
  }

  // Use the pg-meta query endpoint (available with service role)
  const queryUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`

  // Supabase doesn't have a direct SQL endpoint in the JS SDK for DDL.
  // Use the Postgres REST admin endpoint instead.
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 3)

  let successCount = 0
  for (const stmt of statements) {
    const fullStmt = stmt + ';'
    try {
      // Use the Supabase service role to call the pg_meta SQL endpoint
      const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: fullStmt }),
      })
      if (res.ok) successCount++
    } catch { /* ignore individual failures */ }
  }

  if (successCount > 0) {
    console.log(`  ✓ Ran ${successCount}/${statements.length} SQL statements`)
  } else {
    // Fallback: just log instructions
    console.log('  ⚠  Direct SQL execution not available — copy the SQL from supabase/schema.sql')
    console.log('     and run it in Supabase Dashboard → SQL Editor')
  }
}

// ── Step 4: Update env vars ──────────────────────────────────────
async function updateEnvVars(priceId, webhookSecret) {
  console.log('\n── Step 4: Update .env.local ───────────────────────────────')

  updateEnvFile('STRIPE_SUBSCRIPTION_PRICE_ID', priceId)
  if (webhookSecret) {
    updateEnvFile('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET', webhookSecret)
  } else {
    console.log('  ⚠  STRIPE_SUBSCRIPTION_WEBHOOK_SECRET — set this manually after creating the webhook in Stripe Dashboard')
  }
}

// ── Step 5: Push to Vercel ───────────────────────────────────────
async function pushToVercel(env, priceId, webhookSecret) {
  console.log('\n── Step 5: Push to Vercel ──────────────────────────────────')

  const hasVercel = (() => {
    try { execSync('vercel --version', { stdio: 'pipe' }); return true } catch { return false }
  })()

  if (!hasVercel) {
    console.log('  ⚠  Vercel CLI not found. Install with: npm i -g vercel')
    console.log('  Then run these commands manually:')
    printVercelCommands(env, priceId, webhookSecret)
    return
  }

  const envVars = buildEnvVars(env, priceId, webhookSecret)

  let pushed = 0
  for (const [key, value] of Object.entries(envVars)) {
    if (!value) continue
    try {
      // Remove existing, then add (both prod and preview)
      execSync(`echo "${value}" | vercel env rm ${key} production --yes 2>/dev/null || true`, { stdio: 'pipe', cwd: ROOT })
      execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'pipe', cwd: ROOT, input: value })
      console.log(`  ✓ Pushed ${key} to Vercel production`)
      pushed++
    } catch (e) {
      console.log(`  ⚠  Could not push ${key}: ${e.message?.slice(0, 60)}`)
    }
  }

  if (pushed === 0) {
    console.log('  ⚠  Vercel push failed. Run these manually:')
    printVercelCommands(env, priceId, webhookSecret)
  }
}

function buildEnvVars(env, priceId, webhookSecret) {
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    STRIPE_STRATEGY_PRICE_ID: env.STRIPE_STRATEGY_PRICE_ID,
    STRIPE_RFE_PRICE_ID: env.STRIPE_RFE_PRICE_ID,
    STRIPE_SUBSCRIPTION_PRICE_ID: priceId,
    ...(webhookSecret ? { STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: webhookSecret } : {}),
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL?.includes('localhost')
      ? 'https://f1careers.vercel.app'   // update if your URL differs
      : env.NEXT_PUBLIC_APP_URL,
    RESEND_API_KEY: env.RESEND_API_KEY ?? '',
  }
}

function printVercelCommands(env, priceId, webhookSecret) {
  console.log('\n  Copy and run these in your terminal:\n')
  const vars = buildEnvVars(env, priceId, webhookSecret)
  for (const [key, value] of Object.entries(vars)) {
    if (!value) continue
    console.log(`  echo "${value}" | vercel env add ${key} production`)
  }
  console.log('')
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Green Card Score Pro — Subscription Setup')
  console.log('═══════════════════════════════════════════════════════════')

  const env = loadEnv()

  if (!env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY not found in .env.local')
    process.exit(1)
  }

  const { priceId, webhookSecret } = await setupStripe(env)
  await runSupabaseMigration(env)
  await updateEnvVars(priceId, webhookSecret)
  await pushToVercel(env, priceId, webhookSecret)

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  Setup complete!')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('\nNext steps:')
  console.log('  1. git push  (if not done)')
  if (!webhookSecret) {
    console.log('  2. Create subscription webhook in Stripe Dashboard manually:')
    console.log('     URL: <your-prod-url>/api/subscriptions/webhook')
    console.log('     Events: checkout.session.completed, customer.subscription.updated,')
    console.log('             customer.subscription.deleted, invoice.payment_failed')
    console.log('  3. Add STRIPE_SUBSCRIPTION_WEBHOOK_SECRET to Vercel env vars')
  } else {
    console.log('  2. Vercel will auto-redeploy with the new env vars')
  }
  console.log('\nRun the Supabase SQL if it did not auto-apply:')
  console.log('  Supabase Dashboard → SQL Editor → paste supabase/schema.sql → Run')
}

main().catch(err => {
  console.error('\n✗ Setup failed:', err.message)
  process.exit(1)
})
