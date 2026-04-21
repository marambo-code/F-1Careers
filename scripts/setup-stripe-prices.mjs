/**
 * One-time script to create the correct Stripe subscription prices.
 * Run from the project root:
 *
 *   node scripts/setup-stripe-prices.mjs
 *
 * Reads STRIPE_SECRET_KEY from .env.local automatically.
 * Outputs the price IDs to copy into Vercel.
 */

import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

// Load .env.local manually
const env = {}
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) env[k.trim()] = v.join('=').trim()
  })
}

const secretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  console.error('❌  STRIPE_SECRET_KEY not found in .env.local')
  process.exit(1)
}

const stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' })

console.log(`\n🔑  Using key: ${secretKey.slice(0, 14)}...`)
console.log(`📦  Mode: ${secretKey.startsWith('sk_live') ? '🔴 LIVE' : '🟡 TEST'}\n`)

// Find or create the Pro product
async function getOrCreateProduct() {
  const existing = await stripe.products.list({ limit: 100, active: true })
  const found = existing.data.find(p => p.name === 'F-1 Careers Pro')
  if (found) {
    console.log(`✓  Found existing product: ${found.id} (${found.name})`)
    return found.id
  }
  const created = await stripe.products.create({
    name: 'F-1 Careers Pro',
    description: 'Living Green Card Score, 4 AI career moves, score history',
  })
  console.log(`✓  Created product: ${created.id}`)
  return created.id
}

async function main() {
  const productId = await getOrCreateProduct()

  // Create $49/month price
  const monthly = await stripe.prices.create({
    product: productId,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Pro Monthly $49',
  })
  console.log(`✓  Created monthly price: ${monthly.id}  ($49/mo)`)

  // Create $399/year price
  const annual = await stripe.prices.create({
    product: productId,
    unit_amount: 39900,
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Pro Annual $399',
  })
  console.log(`✓  Created annual price:  ${annual.id}  ($399/yr)`)

  // Update .env.local
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent
    .replace(/^STRIPE_SUBSCRIPTION_PRICE_ID=.*/m, `STRIPE_SUBSCRIPTION_PRICE_ID=${monthly.id}`)

  if (envContent.includes('STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID=')) {
    envContent = envContent.replace(/^STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID=.*/m, `STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID=${annual.id}`)
  } else {
    envContent += `\nSTRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID=${annual.id}\n`
  }

  fs.writeFileSync(envPath, envContent)
  console.log(`✓  Updated .env.local\n`)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Add these to Vercel → Settings → Environment Variables')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  STRIPE_SUBSCRIPTION_PRICE_ID         = ${monthly.id}`)
  console.log(`  STRIPE_SUBSCRIPTION_ANNUAL_PRICE_ID  = ${annual.id}`)
  console.log(`  STRIPE_SUBSCRIPTION_WEBHOOK_SECRET   = ${env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || '(copy from Stripe webhook dashboard)'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(e => { console.error('❌ ', e.message); process.exit(1) })
