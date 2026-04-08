# F-1 Careers — App Setup Guide

## What You Need First (30 minutes)

### 1. Install Node.js
→ nodejs.org → Download LTS → Install → Restart computer
Verify: open Terminal, type `node -v` — should show a version number

### 2. Install Cursor
→ cursor.com → Download → Install
This is your AI code editor. Open this project folder in Cursor.

### 3. Create GitHub account
→ github.com → Sign up

### 4. Create Supabase account + project
→ supabase.com → New project → Name it "f1careers" → Note your password

### 5. Create Stripe account
→ stripe.com → Create account → Stay in test mode for now

### 6. Create Vercel account
→ vercel.com → Sign up with GitHub

---

## Setup Steps

### Step 1 — Install dependencies
Open Terminal in this project folder and run:
```bash
npm install
```

### Step 2 — Create your environment file
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and fill in all the values (instructions below).

### Step 3 — Fill in your .env.local

**Supabase values:**
1. Go to supabase.com → your project → Settings → API
2. Copy: Project URL → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy: anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy: service_role secret key → `SUPABASE_SERVICE_ROLE_KEY`

**OpenAI:**
1. Go to platform.openai.com → API Keys → Create new secret key
2. Copy → `OPENAI_API_KEY`

**Stripe:**
1. Go to dashboard.stripe.com → Developers → API Keys
2. Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy Secret key → `STRIPE_SECRET_KEY`

**Stripe Products (create these):**
1. Stripe Dashboard → Products → Add product
2. Name: "Career Strategy Report" → Price: $300 one-time
3. Copy the Price ID (starts with `price_`) → `STRIPE_STRATEGY_PRICE_ID`
4. Add another product: "RFE Analyzer" → Price: $200 one-time
5. Copy Price ID → `STRIPE_RFE_PRICE_ID`

### Step 4 — Set up Supabase database
1. Go to supabase.com → your project → SQL Editor → New Query
2. Copy the entire contents of `supabase/schema.sql`
3. Paste → Run

### Step 5 — Create Supabase Storage buckets
1. Supabase → Storage → New bucket → Name: `resumes` → Private
2. New bucket → Name: `rfe-documents` → Private
3. Run the storage policies in the SQL editor (they're in schema.sql, commented out)

### Step 6 — Run locally
```bash
npm run dev
```
Open http://localhost:3000

### Step 7 — Set up Stripe webhook (for local testing)
Install Stripe CLI: stripe.com/docs/stripe-cli
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Deploy to Vercel

1. Push this folder to GitHub:
```bash
git init
git add .
git commit -m "Initial F-1 Careers app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/f1careers-app.git
git push -u origin main
```

2. Go to vercel.com → New Project → Import from GitHub
3. Add all environment variables from your `.env.local`
4. Deploy → Your app is live at `xxx.vercel.app`
5. Set up custom domain: `app.f1careers.com` in Vercel → Domains

6. Update Stripe webhook for production:
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://app.f1careers.com/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Project Structure

```
f1careers-app/
├── app/
│   ├── (app)/              ← Protected app routes
│   │   ├── dashboard/      ← Main dashboard
│   │   ├── profile/        ← User profile
│   │   ├── strategy/       ← Career Strategy Engine
│   │   └── rfe/            ← RFE Analyzer
│   ├── api/
│   │   ├── strategy/preview/   ← AI preview generation
│   │   ├── rfe/preview/        ← RFE PDF parsing + preview
│   │   └── stripe/
│   │       ├── checkout/       ← Create Stripe session
│   │       └── webhook/        ← Payment → trigger AI report
│   ├── login/              ← Auth pages
│   └── signup/
├── lib/
│   ├── ai/
│   │   ├── strategy-engine.ts  ← GPT-4o career strategy prompts
│   │   └── rfe-analyzer.ts     ← GPT-4o RFE analysis prompts
│   ├── supabase/           ← DB clients
│   └── types.ts            ← All TypeScript types
├── components/
├── supabase/schema.sql     ← Run this first
└── .env.local.example      ← Copy → .env.local
```

---

## The User Flow

1. User signs up at `/signup`
2. Fills profile at `/profile` (visa status, degree, uploads resume)
3. Goes to `/strategy` → reads what's in the report
4. Clicks "Start questionnaire" → 4-step form
5. Submits → AI generates **preview** (free)
6. Preview page shows: pathway assessment + teaser
7. Pays $300 via Stripe Checkout
8. Stripe webhook fires → AI generates **full report**
9. User redirected to full report page
10. Can download as PDF (use browser print → Save as PDF for now)

Same flow for `/rfe` — upload PDF → preview → pay → full report.

---

## Troubleshooting

**"Cannot read properties of undefined"** — check your `.env.local` has all values set

**Stripe webhook not firing locally** — make sure `stripe listen` is running in a separate terminal

**PDF upload failing** — check Supabase storage bucket names match exactly: `resumes` and `rfe-documents`

**AI not generating** — check your OpenAI API key has credits/billing enabled
