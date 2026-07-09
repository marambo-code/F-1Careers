# Build Brief: Approval Intelligence for Self-Petition Green Cards

**Owner:** F-1 Careers
**For:** a dedicated overnight Cowork thread
**Status:** execute against this spec. Do not redesign the strategy. Ask only if a guardrail is genuinely ambiguous.

---

## 0. Mission, in one paragraph

Build a proprietary, structured dataset of how USCIS actually decides self-petition green card cases (EB-1A and EB-2 NIW), drawn from public Administrative Appeals Office (AAO) decisions, and use it to power an approval-readiness assessment that tells a candidate, grounded in real outcomes, where their case stands and exactly what evidence has cleared each legal requirement. The drafting and scoring that a general AI model already does for free is not the product. The defensible asset is the outcomes data, which no foundation model has structured, and which compounds as we add our own users' filing results over time.

This single build produces both deliverables F-1 Careers wants:
- **A sellable tool in weeks:** the approval-readiness assessment (an upgrade to the existing strategy report).
- **A defensible company over months:** the outcomes dataset plus a profile-to-outcome feedback loop that competitors cannot replicate without our user base.

---

## 1. Background you need

F-1 Careers is a Next.js 15 (App Router) + Supabase + Stripe app that helps professionals self-petition employment-based green cards, mainly **EB-1A** (extraordinary ability) and **EB-2 NIW** (national interest waiver). It already has a scoring engine, a strategy report, an RFE analyzer, and a petition builder. The Anthropic API is already wired in (`ANTHROPIC_API_KEY`, model `claude-sonnet-4-6` used in `lib/ai`). Supabase holds user data with row-level security.

The two legal frameworks this dataset must encode correctly:

**EB-1A**, governed by 8 CFR 204.5(h)(3). A petitioner must satisfy at least 3 of these 10 criteria, then pass a final merits determination (the Kazarian two-step):
1. Nationally or internationally recognized prizes or awards for excellence.
2. Membership in associations that require outstanding achievement.
3. Published material about the person in professional or major trade publications or major media.
4. Judging the work of others in the field.
5. Original contributions of major significance.
6. Authorship of scholarly articles.
7. Display of work at artistic exhibitions or showcases.
8. Leading or critical role for organizations with a distinguished reputation.
9. High salary or remuneration relative to the field.
10. Commercial success in the performing arts.

**EB-2 NIW**, governed by Matter of Dhanasar (AAO 2016), three prongs:
1. The proposed endeavor has substantial merit and national importance.
2. The applicant is well positioned to advance the proposed endeavor.
3. On balance, it would be beneficial to the United States to waive the job-offer and labor-certification requirements.

---

## 2. The asset: the outcomes dataset (highest priority)

### 2.1 Source
Public AAO non-precedent decisions on uscis.gov, under the Administrative Appeals Office decisions section. Filter to the two relevant I-140 categories:
- Extraordinary Ability (EB-1A)
- National Interest Waiver (EB-2 NIW)

Decisions are published as PDFs, organized by month. They are US government works (public domain), so ingesting and quoting them is permitted. Attribute by decision identifier and date.

**Important sampling caveat to record and respect:** AAO decisions are appeals, mostly of denials. The outcome distribution is skewed toward hard and denied cases. This is valuable as failure-mode intelligence (it shows precisely why cases lose), but it is not a representative base rate of all filings. Never present these as overall approval odds. We correct the skew later with our own users' outcomes and any approvals data we can add.

### 2.2 Extraction schema
Store each decision as a parent row plus structured child findings.

`aao_decisions`
- `decision_id` (text, from filename or USCIS id)
- `decision_date` (date)
- `category` (enum: `EB1A`, `NIW`)
- `outcome` (enum: `dismissed` = denial upheld, `sustained` = approved on appeal, `remanded`, `withdrawn`)
- `field_of_endeavor` (text, classified, e.g. `computer_science`, `medicine`, `business`, `engineering`, `arts`, `other`)
- `summary` (text, 2 to 4 sentences, neutral)
- `source_url` (text)
- `raw_text` (text, archived for re-extraction)

`criterion_findings` (one row per criterion or prong evaluated)
- `decision_id` (fk)
- `criterion` (enum: the 10 EB-1A criteria by short name, or `dhanasar_prong_1/2/3`)
- `claimed` (bool)
- `met` (bool, the AAO's finding)
- `evidence_described` (text, what the petitioner submitted)
- `reasoning` (text, why the AAO found it met or not)
- `failure_tag` (text enum where not met, e.g. `citations_not_significant`, `letters_too_general`, `membership_not_selective`, `media_not_major`, `role_not_leading`, `salary_not_comparative`, `contribution_not_major_significance`)

### 2.3 Pipeline
1. Navigate the AAO decisions listing for the two categories and collect PDF links (paginate by month). Start with the most recent and work backward.
2. Download a meaningful batch (target 200 to 500 for the overnight run, designed to scale to the full corpus later).
3. Extract text from each PDF.
4. Run an LLM extraction pass per decision against a strict JSON schema matching 2.2. Put the EB-1A criteria list and the Dhanasar prongs verbatim into the extraction prompt so mapping is consistent. Require the model to return `null` rather than guess when a field is not determinable from the text.
5. Validate and normalize enums, dedupe by `decision_id`.
6. Load into Supabase (`aao_decisions`, `criterion_findings`) and also export a flat CSV for inspection.
7. Build aggregation views: per criterion and per prong, counts of met vs not-met, the most common `failure_tag`s, and the evidence types that most often appear in `met = true` findings, sliced by `field_of_endeavor`.

### 2.4 Query and explore UI (overnight deliverable)
A simple internal web view (a Next.js admin page or a standalone HTML file is fine) that lets you:
- Pick a criterion or prong and see the met vs not-met distribution, the top failure reasons, and example accepted evidence with short quotes and decision ids.
- Free-text search the corpus.
- Filter by field of endeavor.

This UI plus the populated dataset is the proof the asset is real.

---

## 3. The product: approval-readiness assessment (sellable wedge)

### 3.1 What the user gets
The candidate provides a profile (reuse and extend the existing strategy questionnaire). The tool returns, grounded in the dataset, not generic prose:
- Per criterion (EB-1A) or per prong (NIW): what evidence has historically cleared it in comparable decisions, and an honest read of where this candidate stands.
- The specific failure patterns most likely to apply to a profile like theirs (a denial pre-mortem), each traceable to real decisions.
- An overall, clearly-labeled, evidence-based readiness estimate. This is an estimate from comparable past decisions, not a prediction and not a guarantee.

### 3.2 How it works (this is why it beats a raw model)
Retrieval over the proprietary corpus: filter `criterion_findings` by category, field of endeavor, and the criteria the candidate is claiming, summarize the winning and losing patterns, and ground the candidate-facing output in those records with citations to decision ids. A general model cannot do this because it has never seen these decisions organized. That grounding is the moat in action.

### 3.3 Integration and monetization
Build inside the existing F-1 Careers Next.js + Supabase app. Surface it as an upgraded tier of the strategy report or a standalone "Approval Readiness" product, priced above the current report. Reuse existing Stripe wiring.

---

## 4. The compounding loop (the months-long moat)

After an assessment, invite the user to opt in to report their eventual filing outcome (filed, RFE issued, approved, denied), with reminders. Store the link between profile and outcome.

`user_outcomes`
- `user_id` (fk), `category`, `criteria_claimed` (jsonb), `field_of_endeavor`
- `stage` (enum: `assessed`, `filed`, `rfe`, `approved`, `denied`, `withdrawn`)
- `reported_at`

Design this schema now even though the data accrues over time. This profile-to-outcome dataset is the thing no competitor can copy without our users, and it is what eventually lets F-1 Careers underwrite outcomes (a readiness threshold or a guarantee, which is the trust and accountability moat) and license the intelligence layer to firms and platforms (the infrastructure play).

---

## 5. Architecture and stack
- App: existing Next.js 15 App Router project.
- Database: Supabase Postgres. New tables: `aao_decisions`, `criterion_findings`, `user_assessments`, `user_outcomes`. Archive raw decision text.
- Ingestion: a Node script run in the Cowork sandbox.
- Extraction and synthesis: Anthropic API, reuse `ANTHROPIC_API_KEY` and the existing `lib/ai` patterns.
- Assessment: a server action or API route that does retrieval over the corpus plus synthesis.

---

## 6. Phasing and overnight scope

**Phase 0 (overnight, must finish):** ingest and structure 200 to 500 AAO EB-1A and NIW decisions into Supabase and CSV; build the query UI; produce a findings memo (top failure reasons per criterion and prong, evidence types that cleared each, by field, with the appeal-skew caveat stated).

**Phase 1 (overnight, stretch):** a working Approval Readiness prototype that takes one sample profile and returns the grounded per-criterion read using the dataset, with citations to decision ids.

**Phase 2 (later, not overnight):** scale ingestion to the full corpus; wire into the live app behind the paywall; ship the outcome-capture loop.

---

## 7. Guardrails (must follow)
- **Legal framing.** Every user-facing output is an evidence-based estimate from comparable past decisions. It is explicitly not legal advice, not a prediction, and not a guarantee of approval. USCIS decides at its own discretion. Reuse the app's existing not-legal-advice language. Recommend a licensed attorney for filing.
- **No fabricated data.** Every pattern or claim must trace to real ingested decisions and cite decision ids. If the dataset is too thin to support a claim, say so. Do not invent statistics.
- **Respect the appeal-skew.** Internally label these as failure-mode data, not base rates. Do not present them to users as overall approval probabilities.
- **Encode the law correctly.** Use the 10 EB-1A criteria from 8 CFR 204.5(h)(3) and the three Dhanasar prongs exactly as listed in section 1. Do not drift or merge criteria.
- **Copyright.** AAO decisions are public domain; quoting is fine; attribute by id and date.
- **Privacy.** User profiles and outcomes are sensitive personal information (immigration status). Store under Supabase RLS per the app's privacy policy. Outcome reporting is opt-in only.

---

## 8. Deliverables by morning (acceptance criteria)
1. A populated dataset of 200 or more structured AAO decisions in Supabase, plus a CSV export.
2. A working query and explore UI (provide a link and a screenshot).
3. A findings memo: top failure reasons per criterion and prong, evidence types that cleared each, sliced by field, with the appeal-skew caveat.
4. A manual spot-check of at least 15 decisions comparing the structured extraction against the source PDF, with an accuracy estimate and notes on failure modes.
5. (Stretch) A working Approval Readiness prototype on one sample profile, with citations.
6. A short "what is next and what is risky" note.

---

## 9. Risks and how to handle them
- **PDF parsing variance.** AAO PDFs vary in layout. Validate extraction with the spot-check in deliverable 4; tune the prompt rather than trusting blind.
- **Web access limits.** If the source cannot be fetched in this environment, report that clearly and do not fake data. Stop and surface it.
- **Extraction hallucination.** Enforce `null` over guessing; require decision-id citations downstream.
- **Thin coverage in a field.** When a candidate's field has few comparable decisions, say so in the assessment rather than overstating confidence.
- **Scope creep.** Do not build the full consumer paywall tonight. Phase 0 and the Phase 1 prototype are the night's job.
