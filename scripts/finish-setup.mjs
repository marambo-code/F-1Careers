#!/usr/bin/env node
/**
 * scripts/finish-setup.mjs
 * ─────────────────────────────────────────────────────────────────
 * Completes the Pro subscription setup:
 *  1. Detects your Vercel production URL automatically
 *  2. Creates the Stripe subscription webhook for that URL
 *  3. Pushes STRIPE_SUBSCRIPTION_PRICE_ID + STRIPE_SUBSCRIPTION_WEBHOOK_SECRET to Vercel
 *
 * Run: node scripts/finish-setup.mjs
 * Requires: vercel CLI (npm i -g vercel && vercel login)
 */

import Stripe from 'stripe'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load .env.local ───────────────────────────────────────────────
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

function writeEnv(key, value) {
  const envPath = resolve(ROOT, '.env.local')
  let raw = readFileSync(envPath, 'utf8')
  if (raw.includes(`${key}=`)) {
    raw = raw.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
  } else {
    raw = raw.trimEnd() + `\n${key}=${value}\n`
  }
  writeFileSync(envPath, raw)
}

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim()
}

// ── Step 1: Get production URL from Vercel ────────────────────────
function getProductionUrl() {
  try {
    const output = run('vercel ls --json 2>/dev/null || vercel ls 2>&1')
    // Try to parse JSON
    try {
      const parsed = JSON.parse(output)
      const prod = parsed.find?.(d => d.target === 'production' || d.aliasError === null)
      if (prod?.url) return `https://${prod.url}`
    } catch {}
    // Fallback: grep for vercel.app / custom domain
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.vercel\.app/i)
    if (urlMatch) return urlMatch[0]
  } catch {}

  // Last resort: read from vercel project config
  try {
    const config = JSON.parse(readFileSync(resolve(ROOT, '.vercel/project.json'), 'utf8'))
    return `https://${config.projectId}.vercel.app`
  } catch {}

  return null
}

// ── Step 2: Inspect Vercel deployment for real URL ────────────────
function getVercelProductionDomain() {
  try {
    // vercel inspect shows the deployment URL
    const output = run('vercel inspect --wait 2>&1 | head -20 || true')
    const match = output.match(/https:\/\/[^\s]+/)
    if (match) return match[0]
  } catch {}

  // Try reading .vercel/project.json
  try {
    const proj = JSON.parse(readFileSync(resolve(ROOT, '.vercel/project.json'), 'utf8'))
    // org + project name
    if (proj.projectId) {
      const info = run(`vercel project ls 2>&1 | grep -i "f1" | head -1 || true`)
      const domainMatch = info.match(/https:\/\/[^\s]+/)
      if (domainMatch) return domainMatch[0]
    }
  } catch {}

  return null
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════')
  console.log('  Finishing Pro Subscription Setup')
  console.log('══════════════════════════════════════════════════\n')

  const env = loadEnv()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)

  const priceId = env.STRIPE_SUBSCRIPTION_PRICE_ID
  if (!priceId) {
    console.error('✗ STRIPE_SUBSCRIPTION_PRICE_ID not in .env.local — run setup-subscription.mjs first')
    process.exit(1)
  }
  console.log(`✓ Price ID: ${priceId}`)

  // ── Get production URL ─────────────────────────────────────────
  console.log('\n── Step 1: Detect production URL ─────────────────')
  let prodUrl = null

  // Try vercel CLI
  try {
    const domains = run('vercel domains ls 2>&1')
    const match = domains.match(/https?:\/\/[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/i)
    if (match && !match[0].includes('localhost')) prodUrl = match[0].replace(/\/$/, '')
  } catch {}

  if (!prodUrl) {
    try {
      const ls = run('vercel ls 2>&1')
      const lines = ls.split('\n')
      for (const line of lines) {
        const m = line.match(/(https?:\/\/[a-z0-9][a-z0-9.-]+-[a-z0-9]+-[^.\s]+\.vercel\.app)/i)
        if (m) { prodUrl = m[1]; break }
      }
      if (!prodUrl) {
        for (const line of lines) {
          const m = line.match(/(https?:\/\/[a-z0-9][a-z0-9.-]+\.vercel\.app)/i)
          if (m) { prodUrl = m[1]; break }
        }
      }
    } catch {}
  }

  if (!prodUrl) {
    // Ask user
    console.log('  Could not auto-detect production URL from Vercel CLI.')
    console.log('  Please open Vercel dashboard and copy your production URL,')
    console.log('  then re-run with: PROD_URL=https://your-app.vercel.app node scripts/finish-setup.mjs')
    if (process.env.PROD_URL) {
      prodUrl = process.env.PROD_URL.replace(/\/$/, '')
      console.log(`  Using PROD_URL from env: ${prodUrl}`)
    } else {
      process.exit(1)
    }
  }

  console.log(`  Production URL: ${prodUrl}`)

  // ── Create/update Stripe webhook ──────────────────────────────
  console.log('\n── Step 2: Stripe Subscription Webhook ───────────')
  const webhookUrl = `${prodUrl}/api/subscriptions/webhook`
  const EVENTS = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_failed',
  ]

  // Check if webhook already exists for this URL
  const { data: existing } = await stripe.webhookEndpoints.list({ limit: 100 })
  const existingForUrl = existing.find(w => w.url === webhookUrl)

  let webhookSecret
  if (existingForUrl) {
    console.log(`  ✓ Webhook already exists for ${webhookUrl}`)
    console.log('  ℹ  Cannot retrieve secret from existing webhook — using value already in .env.local')
    webhookSecret = env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
  } else {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: EVENTS,
      description: 'Green Card Score Pro — subscription lifecycle',
    })
    webhookSecret = webhook.secret
    console.log(`  ✓ Created webhook: ${webhookUrl}`)
    console.log(`  ✓ Secret: ${webhookSecret}`)
    writeEnv('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET', webhookSecret)
    console.log('  ✓ Saved STRIPE_SUBSCRIPTION_WEBHOOK_SECRET to .env.local')
  }

  // ── Push env vars to Vercel ────────────────────────────────────
  console.log('\n── Step 3: Push new env vars to Vercel ────────────')

  const toSet = {
    STRIPE_SUBSCRIPTION_PRICE_ID: priceId,
    STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: webhookSecret,
    NEXT_PUBLIC_APP_URL: prodUrl,
  }

  for (const [key, value] of Object.entries(toSet)) {
    if (!value) continue
    try {
      // Remove old, add new (both production and preview)
      try { run(`vercel env rm ${key} production --yes 2>/dev/null`) } catch {}
      const result = run(`echo "${value}" | vercel env add ${key} production`)
      console.log(`  ✓ ${key} → Vercel production`)
    } catch (e) {
      console.log(`  ✗ ${key} failed: ${e.message?.slice(0, 80)}`)
      console.log(`    Set manually: echo "${value}" | vercel env add ${key} production`)
    }
  }

  // ── Redeploy ──────────────────────────────────────────────────
  console.log('\n── Step 4: Trigger Vercel redeploy ────────────────')
  try {
    run('vercel --prod --yes')
    console.log('  ✓ Redeploying to production with new env vars')
  } catch {
    console.log('  ℹ  Run "vercel --prod" manually, or push to git to trigger auto-deploy')
  }

  console.log('\n══════════════════════════════════════════════════')
  console.log('  ✓ Setup complete!')
  console.log('══════════════════════════════════════════════════')
  console.log('\nRemaining step — run Supabase SQL migration:')
  console.log(`  https://supabase.com/dashboard/project/bpoyxatswymvqebldtcj/sql/new`)
  console.log('  (paste the contents of supabase/schema.sql and click Run)')
}

main().catch(err => {
  console.error('\n✗ Failed:', err.message)
  process.exit(1)
})
