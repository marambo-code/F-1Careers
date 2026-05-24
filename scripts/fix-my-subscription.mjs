/**
 * One-shot fix: finds your user by email and upserts an active subscription.
 * Run from the project root:
 *
 *   node scripts/fix-my-subscription.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

// Load .env.local
const env = {}
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim()
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function supabase(path, opts = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1' + path, { headers, ...opts })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

async function main() {
  console.log('\n🔍  Looking up users...\n')

  // List all profiles with emails via auth admin API
  const authRes = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  })
  const authData = await authRes.json()
  const users = authData.users ?? []

  if (!users.length) {
    console.error('❌  No users found')
    process.exit(1)
  }

  console.log('Found users:')
  users.forEach((u, i) => {
    console.log(`  [${i}] ${u.email} — ${u.id}`)
  })

  // Find raypat919@gmail.com specifically
  const ray = users.find(u => u.email === 'raypat919@gmail.com') ?? users[0]
  const userId = ray.id

  console.log(`\n✓  Targeting user: ${ray.email} (${userId})\n`)

  // Upsert active subscription
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const result = await supabase('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: 'manual_fix',
      stripe_subscription_id: 'manual_fix',
      status: 'active',
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates,return=representation',
    }
  })

  if (result.ok) {
    console.log('✅  Subscription row upserted — you are now Pro!')
    console.log(`    Status: active`)
    console.log(`    Period end: ${new Date(periodEnd).toLocaleDateString()}`)
    console.log('\n🎉  Reload the app and you should see Pro status everywhere.\n')
  } else {
    console.error('❌  Failed to upsert subscription:')
    console.error(JSON.stringify(result.data, null, 2))
    process.exit(1)
  }
}

main().catch(e => { console.error('❌ ', e.message); process.exit(1) })
