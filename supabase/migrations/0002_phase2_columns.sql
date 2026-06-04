-- Phase 2: promote "about you" fields to canonical profile columns.
-- Run in Supabase SQL editor. Idempotent.

alter table public.profiles add column if not exists visa_expiration  text;
alter table public.profiles add column if not exists country_of_birth text;
