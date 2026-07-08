# Scripts

## Precedent Engine data pipeline (outcomes_graph schema)

Three maintenance scripts share the same safety pattern: they read credentials
from `.env.local`, open a service client scoped to the isolated
`outcomes_graph` schema (production app tables are never touched), are
**dry-run by default**, only write behind an explicit `--apply` flag, snapshot
originals into the `met_raw` / `failure_tag_raw` columns before changing
anything, and write a per-run JSONL audit log under `scripts/out/`. They need
internet access to uscis.gov (source PDFs) and the Anthropic API, so run them
on your own machine, not in a sandbox.

Run order (each: dry run first, review the printed summary, then `--apply`):

1. `node scripts/precedent-met-audit.mjs` then `--apply`
   Met-direction audit for `leading_critical_role` and `high_salary`
   findings wrongly coded met=false. Already run against the live corpus.
2. `node scripts/precedent-prong-reextract.mjs` then `--apply`  (audit REC 2)
   For sustained/remanded NIW appeals, records met=true on Dhanasar prongs
   the AAO expressly found satisfied. Only ever flips toward met=true.
3. `node scripts/precedent-failtag-retag.mjs` then `--apply`  (audit REC 3)
   Re-tags met=false findings against an expanded closed taxonomy that adds
   NIW-specific `niw_*` tags. Never touches `met`. Useful flags:
   `--scope=eb1a|niw|all`, `--limit=N`, `--retag-all`.

All three are idempotent: re-runs skip rows already corrected (or converge to
the same result at temperature 0).

Revert any run: the `*_raw` columns hold the original values and each `--apply`
run logs every changed id to `scripts/out/*.jsonl`. In SQL:

```sql
update outcomes_graph.criterion_findings
set met = met_raw, failure_tag = failure_tag_raw
where id in (/* ids from the run's jsonl log */);
```

The app reads the corpus through the `precedent_*` views, which reflect these
updates automatically; the in-process cache in `lib/precedent/queries.ts`
refreshes within an hour (or on redeploy).

Regression tests: `npm test` (scripts/precedent.test.mjs) guards the view SQL,
the summary shapes, the prompt-grounding feature flag (`PRECEDENT_GROUNDING`),
and that every tag in the retag script has a display label.

## Other scripts

One-off setup and repair utilities (Stripe prices, subscriptions, migrations):
`finish-setup.mjs`, `setup-stripe-prices.mjs`, `setup-subscription.mjs`,
`repair-subscription.mjs`, `fix-my-subscription.mjs`, `run-migration.mjs`,
`push-vercel-env.sh`.
