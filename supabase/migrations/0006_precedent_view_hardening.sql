-- 0006_precedent_view_hardening.sql
-- Security + correctness fixes for the precedent views shipped in 0005.
-- MUST be applied to the live database (0005 already ran there without these).
--
-- 1) BLOCKER: Supabase default privileges granted ALL (insert/update/delete/
--    truncate) on the views to anon/authenticated. `precedent_cases` is a
--    simple, auto-updatable view with definer semantics, so anyone holding the
--    public anon key could INSERT/UPDATE/DELETE rows in
--    outcomes_graph.aao_decisions through it. Revoke everything except SELECT.
--
-- 2) precedent_failtags counted failure_tag on rows regardless of `met`.
--    The 59 met-direction corrections left met=true rows tagged 'other',
--    which inflated that bucket. Count only genuine failures (met=false).

create or replace view public.precedent_failtags as
select failure_tag, count(*)::int as n
from outcomes_graph.criterion_findings
where failure_tag is not null and met is false
group by failure_tag;

revoke all on
  public.precedent_corpus,
  public.precedent_outcome_rates,
  public.precedent_criteria,
  public.precedent_prongs,
  public.precedent_failtags,
  public.precedent_field_counts,
  public.precedent_cases
from anon, authenticated;

grant select on
  public.precedent_corpus,
  public.precedent_outcome_rates,
  public.precedent_criteria,
  public.precedent_prongs,
  public.precedent_failtags,
  public.precedent_field_counts,
  public.precedent_cases
to anon, authenticated;
