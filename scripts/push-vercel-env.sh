#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# push-vercel-env.sh
# Run this from your terminal inside the f1careers-app directory:
#   bash scripts/push-vercel-env.sh
#
# Requires: vercel CLI (npm i -g vercel && vercel login)
# ─────────────────────────────────────────────────────────────────

set -e

# Load .env.local
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

echo "═══════════════════════════════════════════════════"
echo "  Pushing all env vars to Vercel (production)"
echo "═══════════════════════════════════════════════════"

push_env() {
  local KEY=$1
  local VALUE=$2
  if [ -z "$VALUE" ]; then
    echo "  ⚠  Skipping $KEY (empty)"
    return
  fi
  # Remove old value silently, then add
  echo "$VALUE" | vercel env rm "$KEY" production --yes 2>/dev/null || true
  echo "$VALUE" | vercel env add "$KEY" production
  echo "  ✓ $KEY"
}

push_env NEXT_PUBLIC_SUPABASE_URL          "$NEXT_PUBLIC_SUPABASE_URL"
push_env NEXT_PUBLIC_SUPABASE_ANON_KEY     "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
push_env SUPABASE_SERVICE_ROLE_KEY         "$SUPABASE_SERVICE_ROLE_KEY"
push_env ANTHROPIC_API_KEY                 "$ANTHROPIC_API_KEY"
push_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
push_env STRIPE_SECRET_KEY                 "$STRIPE_SECRET_KEY"
push_env STRIPE_WEBHOOK_SECRET             "$STRIPE_WEBHOOK_SECRET"
push_env STRIPE_STRATEGY_PRICE_ID          "$STRIPE_STRATEGY_PRICE_ID"
push_env STRIPE_RFE_PRICE_ID               "$STRIPE_RFE_PRICE_ID"
push_env STRIPE_SUBSCRIPTION_PRICE_ID      "$STRIPE_SUBSCRIPTION_PRICE_ID"
push_env STRIPE_SUBSCRIPTION_WEBHOOK_SECRET "$STRIPE_SUBSCRIPTION_WEBHOOK_SECRET"
push_env NEXT_PUBLIC_APP_URL               "$NEXT_PUBLIC_APP_URL"

if [ -n "$RESEND_API_KEY" ]; then
  push_env RESEND_API_KEY "$RESEND_API_KEY"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Done! Triggering Vercel redeploy..."
echo "═══════════════════════════════════════════════════"
vercel --prod --yes 2>/dev/null || echo "  ⚠  Run 'vercel --prod' manually to redeploy"
