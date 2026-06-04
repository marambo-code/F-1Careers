-- Handoff migration: profile/report columns referenced by the app.
-- Run in Supabase SQL editor:
--   https://supabase.com/dashboard/project/bpoyxatswymvqebldtcj/sql/new
-- Idempotent (safe to run more than once).

alter table public.reports  add column if not exists regen_count        int default 0;
alter table public.profiles add column if not exists current_employer   text;
alter table public.profiles add column if not exists job_title          text;
alter table public.profiles add column if not exists stay_score_snapshot jsonb;
alter table public.profiles add column if not exists roi_snapshot       jsonb;
