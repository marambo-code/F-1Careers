# Deploy to GitHub + Vercel

## Step 1 — Push to GitHub

Open Terminal, paste this entire block and press Enter:

```
cd ~/Downloads/f1careers-app && rm -rf .git && git init && git add -A && git commit -m "F-1 Careers — full app" && git remote add origin https://github.com/marambo-code/F-1Careers.git && git push --force -u origin main
```

This nukes any old git history (which had secrets in it) and force-pushes a clean copy.

---

## Step 2 — Watch Vercel build

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find **f1careers-app** → click it → watch the build complete
3. Your live URL is: **https://f1careers-app.vercel.app**

---

## Step 3 — Update Stripe webhook URL

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Find your webhook → click Edit
3. Update the endpoint URL to: `https://f1careers-app.vercel.app/api/stripe/webhook`
4. Save

---

## Step 4 — Verify Vercel environment variables

Make sure these are set in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://f1careers-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `STRIPE_SECRET_KEY` | your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | your Stripe webhook signing secret |
| `RESEND_API_KEY` | your Resend key (sign up free at resend.com) |
| `FROM_EMAIL` | e.g. `F-1 Careers <reports@yourdomain.com>` |

If `RESEND_API_KEY` is not set, emails are silently skipped — the app still works fine.

---

## Step 5 — Fix any stuck reports

If you have old reports stuck in error/generating state, visit:
```
https://f1careers-app.vercel.app/api/debug/reset?reportId=REPORT_ID_HERE
```
Then navigate back to the report page to trigger fresh generation.
