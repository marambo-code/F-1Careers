-- ─────────────────────────────────────────────────────────────────
-- F-1 Careers — Supabase Schema (idempotent — safe to re-run)
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  university text,
  degree text,
  field_of_study text,
  graduation_date date,
  visa_status text check (visa_status in ('F-1 CPT', 'F-1 OPT', 'F-1 OPT STEM', 'H-1B', 'H-1B1', 'O-1', 'EB-2 NIW Pending', 'Green Card', 'Other')),
  career_goal text check (career_goal in ('First job / internship', 'H-1B sponsorship', 'Green card (EB pathway)', 'Switching employers', 'Other')),
  linkedin_url text,
  resume_path text,
  resume_filename text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── REPORTS ─────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('strategy', 'rfe')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'generating', 'complete', 'error')),
  questionnaire_responses jsonb,
  rfe_document_path text,
  rfe_document_text text,
  report_data jsonb,
  preview_data jsonb,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_paid integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── PAYMENTS ────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete cascade not null,
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  amount integer not null,
  currency text default 'usd',
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed', 'refunded')),
  product_type text not null check (product_type in ('strategy', 'rfe')),
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Reports policies
drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports" on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports" on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports" on public.reports
  for update using (auth.uid() = user_id);

-- Payments policies
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments" on public.payments
  for select using (auth.uid() = user_id);

-- ─── STORAGE BUCKET POLICIES ─────────────────────────────────────
-- (Run after buckets are created via node setup.js)

drop policy if exists "Users can upload own resume" on storage.objects;
create policy "Users can upload own resume" on storage.objects
  for insert with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can read own resume" on storage.objects;
create policy "Users can read own resume" on storage.objects
  for select using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can upload own RFE" on storage.objects;
create policy "Users can upload own RFE" on storage.objects
  for insert with check (bucket_id = 'rfe-documents' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can read own RFE" on storage.objects;
create policy "Users can read own RFE" on storage.objects
  for select using (bucket_id = 'rfe-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────
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

-- ─── SCORE HISTORY ───────────────────────────────────────────────
create table if not exists public.score_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  green_card_score integer not null,
  niw_score integer,
  eb1a_score integer,
  snapshot_label text,      -- e.g. "After strategy report · Apr 2026"
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz default now()
);

-- ─── PROFILE EXTENSIONS ──────────────────────────────────────────
alter table public.profiles add column if not exists career_moves jsonb;
alter table public.profiles add column if not exists career_moves_updated_at timestamptz;

-- ─── RLS ON NEW TABLES ───────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.score_history enable row level security;

-- Subscriptions policies
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Score history policies
drop policy if exists "Users can view own score history" on public.score_history;
create policy "Users can view own score history" on public.score_history
  for select using (auth.uid() = user_id);

-- ─── COUNTRY / PROFILE EXTENSION ────────────────────────────────
alter table public.profiles add column if not exists country_of_birth text;

-- ─── ADMIN ALERTS ────────────────────────────────────────────────
-- Manually managed via Supabase dashboard — toggle active to show/hide
create table if not exists public.admin_alerts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text not null,
  severity text default 'info' check (severity in ('info', 'warning', 'critical')),
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.admin_alerts enable row level security;
-- Drop all known historical names for this policy (safe to re-run)
drop policy if exists "Anyone can view active alerts" on public.admin_alerts;
drop policy if exists "Authenticated users can read active alerts" on public.admin_alerts;
create policy "Anyone can view active alerts" on public.admin_alerts
  for select using (active = true);

-- ─── CAREER MOVE SETS ────────────────────────────────────────────
-- Each generated batch of career moves is stored as its own row.
-- is_current = true marks the active set; past sets are archived (is_current = false).
-- This preserves full history and completion state across regenerations.
create table if not exists public.career_move_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete set null,
  moves jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  is_current boolean not null default true
);

create index if not exists career_move_sets_user_current
  on public.career_move_sets(user_id, is_current);
create index if not exists career_move_sets_user_time
  on public.career_move_sets(user_id, generated_at desc);

alter table public.career_move_sets enable row level security;

drop policy if exists "Users can view own career move sets" on public.career_move_sets;
create policy "Users can view own career move sets" on public.career_move_sets
  for select using (auth.uid() = user_id);

-- ─── RATE LIMITS ─────────────────────────────────────────────────
create table if not exists public.rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  route text not null,
  count integer default 1,
  window_start timestamptz default now(),
  unique(user_id, route)
);
alter table public.rate_limits enable row level security;
drop policy if exists "Users manage own rate limits" on public.rate_limits;
create policy "Users manage own rate limits" on public.rate_limits
  for all to authenticated using (auth.uid() = user_id);

-- ─── DASHBOARD VIEW ──────────────────────────────────────────────
create or replace view public.user_reports_view as
  select
    r.id,
    r.user_id,
    r.type,
    r.status,
    r.created_at,
    r.updated_at,
    p.amount as amount_paid,
    p.status as payment_status
  from public.reports r
  left join public.payments p on p.report_id = r.id;

-- ─── PETITION BUILDER ────────────────────────────────────────────
create table if not exists public.petition_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pathway text not null default 'NIW' check (pathway in ('NIW', 'EB-1A')),
  evidence_items jsonb not null default '[]',
  narrative_text text not null default '',
  service_center text not null default 'NSC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.petition_progress enable row level security;
drop policy if exists "Users manage own petition progress" on public.petition_progress;
create policy "Users manage own petition progress" on public.petition_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
