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
