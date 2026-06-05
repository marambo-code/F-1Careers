-- score_history: per-report score snapshots. The strategy generate route already
-- writes here after each report; the table was never created, so those inserts
-- failed silently. Create it (idempotent) with RLS.
create table if not exists public.score_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  green_card_score integer not null,
  niw_score integer,
  eb1a_score integer,
  snapshot_label text,
  report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.score_history enable row level security;
drop policy if exists "Users can view own score history" on public.score_history;
create policy "Users can view own score history" on public.score_history
  for select using (auth.uid() = user_id);

-- Phase 3: autosave / save-and-resume. Holds the in-progress strategy
-- questionnaire so a user can leave and come back without losing answers.
alter table public.profiles add column if not exists strategy_draft jsonb;
