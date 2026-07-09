# Gold-Standard Product Spec: Approval Intelligence

**Owner:** F-1 Careers
**Companion to:** `cowork-brief_approval-intelligence.md` (that brief is the first night; this document is the finished product to build toward).
**Working name:** Approval Intelligence. The data core is the Outcomes Graph. Rename freely.

> Read this as the definition of "done at world class," not a wish list. Every section is a capability the finished product must actually have, with the bar it must clear. Build toward this, in the order in section 12.

---

## 1. Vision, concretely

A professional, an attorney, or a partner platform asks one question: "Will this case be approved, and what exactly makes it approvable?" Approval Intelligence answers it with a calibrated, evidence-grounded estimate and a precise, criterion-by-criterion plan, every assertion traceable to real USCIS outcomes. It is the system of record for self-petition green card readiness (EB-1A, EB-2 NIW, O-1), trusted enough that people pay to know their odds before they file and firms pay to cut case preparation in half.

The product is never "an AI that drafts a petition." That is commodity. The product is the **only** place that knows, from real decisions and real filing results, what actually wins. The drafting, scoring, and letters are features of that knowledge, not the asset.

---

## 2. The five principles that define gold standard

1. **Grounded.** No claim reaches a user without a citation to real decisions or real outcomes. If the data cannot support a statement, the product says so. Zero invented statistics.
2. **Calibrated.** When the product says a case is "70 percent ready," roughly 70 percent of comparable cases at that level actually clear. Calibration is measured continuously against held-out outcomes, not asserted.
3. **Complete.** Every EB-1A criterion, every Dhanasar prong, every major field of endeavor, updated continuously as new decisions and outcomes arrive.
4. **Accountable.** Because the system knows real outcomes, the business can stand behind its reads: tiered guarantees, risk-based pricing, and a defensible "we only take cases above threshold X" position. A raw model can never do this.
5. **Auditable.** Any output can be expanded to show the exact decisions and data points behind it. An attorney can verify it. A regulator could inspect it.

---

## 3. The core IP: the Outcomes Graph

A continuously updated, versioned knowledge base linking three layers:

1. **Adjudicated decisions.** The full public corpus of AAO EB-1A, NIW, and O-1 decisions, structured per the schema in the build brief, plus newly published decisions ingested on a schedule. This teaches failure modes and accepted-evidence patterns.
2. **Filing outcomes.** The proprietary, opt-in dataset linking real candidate profiles to real results (filed, RFE, approved, denied), gathered from F-1 Careers users and, later, attorney partners. This is the part no competitor can replicate without our user base, and it is what makes the estimates calibrated rather than anecdotal.
3. **Context signals.** Visa Bulletin movement, processing times by service center, fee and policy changes, and RFE language patterns. These shape timing and risk, not just eligibility.

The Outcomes Graph is the asset that appreciates. Every decision ingested and every outcome reported makes every product on top of it better. Treat it as the company's balance sheet.

### Maturity bar for the Graph
- Decisions: full available public AAO corpus for EB-1A, NIW, O-1, refreshed at least monthly, with a documented coverage figure.
- Outcomes: a growing labeled set of profile-to-outcome records, with a target of enough volume per field and criterion to support calibrated estimates, and an honest "low confidence" flag where coverage is thin.
- Versioning: the Graph is versioned, so every estimate records which Graph version produced it and can be reproduced.

---

## 4. Consumer product suite (the wedge, fully built)

Each module is grounded in the Outcomes Graph. Together they take a candidate from "should I even try" to "filing-ready."

1. **Approval Readiness Assessment.** A calibrated readiness estimate with a confidence band, per criterion and per prong, each backed by the count and citations of comparable decisions, plus a denial pre-mortem naming the specific failure patterns most likely to apply to this profile. Clearly framed as an evidence-based estimate, not a guarantee.
2. **Evidence Plan.** The exact evidence to gather for each criterion the candidate is pursuing, ranked by impact, drawn from what actually cleared that criterion in their field, with a tracker and acceptance examples. This is the difference between "you need awards" and "here is the kind of award, at this level, that AAO accepted in cases like yours."
3. **Petition Composer.** A petition draft shaped by winning patterns from the Graph, not a generic LLM essay: argument structure, criterion mapping, and language that mirrors what has been accepted, with every section showing the precedent it is modeled on. Always attorney-review framed.
4. **Recommendation Letter Engine.** Criterion-targeted letters grounded in what officers have accepted versus dismissed as too general, tailored to each recommender's relationship and standing.
5. **RFE Defense.** If an RFE arrives, a response strategy grounded in how comparable RFEs were resolved, mapped issue by issue.
6. **Readiness Monitor.** Ongoing tracking: the candidate's readiness as their record grows, plus alerts on Visa Bulletin movement, processing-time shifts, and policy changes that affect their case.
7. **Outcome Reporting.** A simple, incentivized loop for users to report their result, which feeds the Graph and recalibrates everyone's estimates. The incentive is concrete (for example a free re-assessment, or a credit).

---

## 5. Attorney and firm product (the larger revenue)

The same intelligence as a productivity tool for immigration practices.

- **Case workspace.** Intake, evidence mapping, draft generation, RFE prediction, and readiness scoring for the firm's caseload, all grounded in the Graph.
- **Time collapse.** The promise is concrete: cut preparation hours per EB-1A or NIW case substantially, with auditable outputs an attorney can trust and edit.
- **Firm benchmarks.** How the firm's cases compare to the corpus, where their evidence is weak, what is trending in adjudication.
- **Pricing.** Per-seat SaaS plus per-case, the model legal-tech buyers already accept.
- **Why it is clean.** Selling to attorneys keeps the product on the right side of the unauthorized-practice-of-law line, since the lawyer remains the professional of record.

---

## 6. Data and infrastructure layer (the platform)

- **Outcomes API.** Programmatic access to readiness and eligibility intelligence, licensed to universities, relocation and global-mobility platforms, job boards, and fintechs serving immigrants. Outcomes-as-a-service.
- **Embeddable assessment.** A drop-in widget partners place in their own product, sending users and outcome signals back, which both distributes the brand and feeds the Graph.
- **Benchmarks and data licensing.** Aggregate, fully anonymized intelligence for firms, researchers, and policy work. Never individual data.

---

## 7. The accountability layer (the deepest moat)

Once the outcomes dataset is rich enough to be calibrated, the business can do what no model and no thin competitor can:

- **Tiered guarantees.** Offer a money-back or success-linked guarantee for cases above a measured readiness threshold, priced from the real base rate.
- **Risk-based pricing.** Charge by readiness and complexity because you can measure both.
- **Curated intake.** A defensible "we take cases above threshold X" stance that protects approval rates and brand.
- **Attorney-of-record network.** An optional done-with-you tier where a vetted attorney files, with the intelligence layer doing the heavy preparation.

This layer is only possible because of the Outcomes Graph. It is the reason the company is worth far more than the tool.

---

## 8. Distribution moat

The student-to-professional funnel (the `/students` bridge page and, later, university partnerships) acquires future high-value customers years before any competitor, at low cost, and keeps them through the lifecycle from F-1 to green card. Cheap, early, owned distribution is as much a moat as the data.

---

## 9. Trust and quality engineering (what makes it gold rather than good)

- **Citations everywhere.** Every readiness number, evidence recommendation, and draft section expands to the exact decisions and outcomes behind it.
- **Calibration harness.** A continuous evaluation that holds out real outcomes and measures calibration error and accuracy by criterion and field. Published internally; targets tracked over time.
- **Extraction QA.** Automated validation plus periodic human spot-checks of decision extraction, with a measured accuracy figure and a correction loop.
- **Human-in-the-loop.** Attorney review built into the high-stakes paths; the product knows the difference between informational guidance and anything resembling legal advice, and stays on the correct side.
- **Honest uncertainty.** Where the Graph is thin for a field or criterion, the product shows lower confidence rather than false precision.
- **Legal and privacy posture.** Not legal advice, not a guarantee of approval, USCIS decides at discretion. Sensitive immigration data handled under the privacy policy, encrypted, opt-in for outcome sharing, fully anonymized for any aggregate or licensed use.

---

## 10. Architecture at scale

- **Ingestion pipeline.** Scheduled fetch of new AAO decisions, text extraction, schema-strict LLM extraction with null-over-guess, validation, dedupe, and versioned load into the Graph.
- **Outcomes store.** Profile-to-outcome records with consent flags and RLS, feeding the calibration harness.
- **Retrieval and synthesis layer.** Grounded retrieval over the Graph that produces cited, calibrated outputs for every product surface.
- **Application.** The existing Next.js plus Supabase app for consumer surfaces; a firm workspace; an API gateway with usage metering for partners.
- **Evaluation service.** The calibration and extraction-QA harness, run continuously, gating releases.
- **Observability.** Track Graph version, citation coverage, calibration error, and per-field confidence on every output.

---

## 11. Metrics that define world class

- **Calibration error** below a tight target, measured against held-out real outcomes.
- **Citation coverage:** 100 percent of user-facing claims traceable to data.
- **Extraction accuracy:** measured, with a correction loop, above a high bar on human spot-checks.
- **Coverage:** full public AAO corpus for the three categories, refreshed monthly, plus a growing outcomes set with documented depth per field.
- **Commercial:** assessment-to-paid conversion, attorney-seat retention, API revenue, and gross margin that reflects a software-and-data business, not a services shop.
- **Trust:** attorney usage and outcome-reporting rate, the two signals that the loop is real.

---

## 12. Roadmap from today to gold standard

1. **Foundation (the overnight brief).** Ingest and structure the first AAO batch; query UI; findings memo; a grounded readiness prototype on one profile.
2. **Calibrated consumer assessment.** Scale the corpus, ship the Approval Readiness Assessment and Evidence Plan behind the existing paywall, and stand up the outcome-reporting loop.
3. **Composer, letters, RFE defense.** Add the grounded drafting suite, all citing the Graph, all attorney-review framed.
4. **Calibration harness and confidence.** Build the evaluation service; expose confidence bands; recalibrate from incoming outcomes.
5. **Attorney workspace.** Launch the firm product and per-seat motion.
6. **API and embeds.** Open the Outcomes API and the embeddable assessment to partners; wire the student funnel as a feeder.
7. **Accountability layer.** Once outcomes are rich enough to be calibrated, introduce guarantees, risk-based pricing, curated intake, and the optional attorney-of-record tier.

---

## 13. Non-negotiable guardrails (carry over from the build brief)

- Evidence-based estimates only; never legal advice, never a guarantee of approval; USCIS decides at discretion; recommend licensed counsel for filing.
- No fabricated data; every claim cites real decisions or outcomes; null over guessing.
- AAO decisions are appeal-skewed; treat as failure-mode intelligence, correct with real outcomes, never present as overall base rates until the outcomes data supports it.
- Encode the law exactly: the 10 EB-1A criteria of 8 CFR 204.5(h)(3) and the three Dhanasar prongs.
- AAO decisions are public domain; quote and attribute. User data is sensitive; protect it, anonymize all aggregate and licensed use, keep outcome sharing opt-in.

---

## 14. Definition of perfect

The product is "perfect" when a stranger can enter their profile and receive a calibrated, fully cited read of their approval odds and a precise plan to raise them; when an attorney runs their caseload through it and trusts the output enough to file from it; when a partner platform embeds the assessment and it just works; when the company can offer a guarantee because it knows the real numbers; and when every one of those outputs can be traced, line by line, back to real USCIS outcomes. At that point the moat is the data and the trust, the AI is invisible plumbing, and the thing is very hard to compete with.
