-- 0007_perf_indexes.sql
-- Hot-path indexes found missing during the timeout/reliability audit.
-- All are plain btree indexes on small, user-owned tables: safe to apply on
-- the live database (brief write lock, no data changes, `if not exists`).
--
-- 1. reports: every dashboard load, "latest strategy report" lookup
--    (career moves, petition drafts), and report list filters by user_id and
--    orders by created_at. Only the primary key existed, so these were
--    sequential scans.
create index if not exists reports_user_created
  on public.reports (user_id, created_at desc);

-- 2. score_history: dashboard trend chart reads by user_id ordered by
--    created_at. Only the primary key existed.
create index if not exists score_history_user_created
  on public.score_history (user_id, created_at);

-- 3. payments: the generate routes verify payment by report_id before
--    starting a paid generation. Only id and stripe_session_id were indexed.
create index if not exists payments_report_id
  on public.payments (report_id);
