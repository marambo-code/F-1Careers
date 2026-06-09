-- Phase 1 attorney-review demand capture. When a user (who has a completed report)
-- asks to be connected with an attorney, we store the request + their consent to
-- share the report, and notify the founder. No fee handling here, this is a demand
-- signal + warm-intro queue, deliberately kept simple and compliance-safe.
create table if not exists public.attorney_review_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  report_id uuid references public.reports(id) on delete set null,
  report_type text,                       -- 'strategy' | 'rfe'
  consent_share boolean not null default false,
  note text,
  status text not null default 'new',     -- new | contacted | matched | closed
  created_at timestamptz default now()
);

alter table public.attorney_review_requests enable row level security;

drop policy if exists "users_insert_own_attorney_req" on public.attorney_review_requests;
create policy "users_insert_own_attorney_req" on public.attorney_review_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "users_view_own_attorney_req" on public.attorney_review_requests;
create policy "users_view_own_attorney_req" on public.attorney_review_requests
  for select using (auth.uid() = user_id);
