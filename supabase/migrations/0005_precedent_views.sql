-- 0005_precedent_views.sql
-- Read-only aggregate views over the isolated `outcomes_graph` schema that
-- powers the Precedent Engine. Aggregates only, no PII. Views run with owner
-- privileges (security_invoker off) so `anon`/`authenticated` can read the
-- aggregates via PostgREST without any direct grant on the base tables.
-- The `outcomes_graph` schema and the app's production tables are untouched.

create or replace view public.precedent_corpus as
select
  (select count(*) from outcomes_graph.aao_decisions)     as decisions,
  (select count(*) from outcomes_graph.criterion_findings) as findings;

create or replace view public.precedent_outcome_rates as
select category, outcome, count(*)::int as n
from outcomes_graph.aao_decisions
where proceeding = 'appeal'
group by category, outcome;

create or replace view public.precedent_criteria as
select criterion,
  count(*) filter (where met is true)::int  as met_true,
  count(*) filter (where met is false)::int as met_false
from outcomes_graph.criterion_findings
where criterion not like 'dhanasar%'
group by criterion;

create or replace view public.precedent_prongs as
select criterion,
  count(*) filter (where met is true)::int  as met_true,
  count(*) filter (where met is false)::int as met_false
from outcomes_graph.criterion_findings
where criterion like 'dhanasar%'
group by criterion;

create or replace view public.precedent_failtags as
select failure_tag, count(*)::int as n
from outcomes_graph.criterion_findings
where failure_tag is not null and met is false
group by failure_tag;

create or replace view public.precedent_field_counts as
select category, field_of_endeavor, count(*)::int as n
from outcomes_graph.aao_decisions
group by category, field_of_endeavor;

create or replace view public.precedent_cases as
select decision_id, decision_date, category, field_of_endeavor, rfe_issued, source_file
from outcomes_graph.aao_decisions
where outcome = 'sustained' and proceeding = 'appeal'
order by decision_date desc;

-- Supabase's default privileges grant ALL on new objects in `public` to
-- anon/authenticated. `precedent_cases` is a simple (auto-updatable) view, and
-- with definer semantics a write through it would hit the base table with
-- owner privileges — so writes MUST be revoked, not just SELECT granted.
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
