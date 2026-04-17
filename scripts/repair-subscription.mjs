#!/usr/bin/env node
/**
 * scripts/repair-subscription.mjs
 * Looks up the active Stripe subscription by email and writes
 * it directly to Supabase — bypassing the webhook entirely.
 *
 * Run: node scripts/repair-subscription.mjs
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
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

async function main() {
  const env = loadEnv()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY)
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const email = 'raypat919@gmail.com'
  console.log(`Looking up Stripe customer for ${email}…`)

  // Find customer by email
  const customers = await stripe.customers.list({ email, limit: 5 })
  if (customers.data.length === 0) {
    console.error('✗ No Stripe customer found for this email')
    process.exit(1)
  }

  // Find active subscription across all customers for this email
  let activeSub = null
  let customerId = null

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 5 })
    if (subs.data.length > 0) {
      activeSub = subs.data[0]
      customerId = customer.id
      break
    }
    // Also check 'trialing'
    const trialing = await stripe.subscriptions.list({ customer: customer.id, status: 'trialing', limit: 5 })
    if (trialing.data.length > 0) {
      activeSub = trialing.data[0]
      customerId = customer.id
      break
    }
  }

  if (!activeSub) {
    // List all subscriptions regardless of status
    console.log('\nNo active subscription found. All subscriptions:')
    for (const customer of customers.data) {
      const all = await stripe.subscriptions.list({ customer: customer.id, limit: 10 })
      all.data.forEach(s => console.log(` - ${s.id}: ${s.status} (${new Date(s.current_period_end * 1000).toLocaleDateString()})`))
    }
    process.exit(1)
  }

  console.log(`✓ Found subscription: ${activeSub.id} (${activeSub.status})`)

  // Find the Supabase user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) { console.error('✗ Could not list users:', listErr.message); process.exit(1) }

  const sbUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!sbUser) { console.error(`✗ No Supabase user found for ${email}`); process.exit(1) }

  console.log(`✓ Found Supabase user: ${sbUser.id}`)

  // Upsert subscription record
  const { error: upsertErr } = await supabase.from('subscriptions').upsert({
    user_id: sbUser.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: activeSub.id,
    status: activeSub.status === 'trialing' ? 'trialing' : 'active',
    current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: activeSub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('✗ Supabase upsert failed:', upsertErr.message)
    process.exit(1)
  }

  // Verify it was written
  const { data: check } = await supabase.from('subscriptions').select('*').eq('user_id', sbUser.id).single()
  console.log('\n✓ Subscription record written to Supabase:')
  console.log(`  user_id: ${check.user_id}`)
  console.log(`  status: ${check.status}`)
  console.log(`  period_end: ${new Date(check.current_period_end).toLocaleDateString()}`)
  console.log('\n✓ Done! Refresh your dashboard — Pro should now be active.')
}

main().catch(e => { console.error('✗', e.message); process.exit(1) })
