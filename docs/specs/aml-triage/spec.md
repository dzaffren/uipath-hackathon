# Defensible AML Alert Triage ("Aurora Verdict") — Overview

**Discovery Brief:** docs/discovery/aml-triage/brief.md

## Summary

This epic delivers a triage process for anti-money-laundering (AML) alerts that makes
every escalate-or-close decision **defensible by construction**. Each alert flows through
a standardized orchestration that gathers the full evidence picture, produces a reasoned
recommendation with citations that are checked against real evidence, routes risk to the
right level of human review, and writes a complete, replayable audit record. It is built
for AML investigators and the supervisors and auditors who answer for those decisions
later.

## Background & Context

**Current state:**

- AML investigators receive transaction-monitoring alerts and must decide whether to
  escalate (file a suspicious-activity report / open an investigation) or close them.
- Evidence needed for that judgement is scattered across separate systems — customer
  due-diligence records, transaction history, sanctions and politically-exposed-person
  (PEP) screening, and adverse media. Assembling it consumes the time meant for judgement.
- When a decision is recorded, the rationale is typically a one-or-two-sentence
  close reason.

**Problem:**

- A thin recorded rationale does not hold up when a regulator or internal auditor reviews
  the decision months or years later. The reasoning, the evidence relied on, and the
  approval trail are not captured in a way that survives scrutiny.
- Because evidence-gathering is manual and slow, and because there is no consistent
  standard applied to every alert, outcomes vary by which analyst is on shift.
- The highest-volume risk — large numbers of low-risk alerts closed quickly with little
  documented oversight — is exactly where a missed suspicious activity is most costly and
  hardest to defend afterwards.

## Goals

- Produce, for every triaged alert, a structured rationale that states the call, the risk
  tier, the agent's confidence, and a list of cited evidence — where every citation has
  been confirmed to point at real, gathered evidence.
- Route each alert to a level of human review proportional to its risk, with humans
  remaining accountable for every disposition, including the low-risk bulk.
- Capture a complete, replayable trail for each decision — from alert received, through
  evidence gathered, recommendation made, human decision taken, to outcome logged.
- Prove the agent's reasoning is accurate and audit-defensible on a realistic dataset
  before committing to the full orchestration.

## Non-Goals

- **No use of real or anonymized-real customer data.** The demonstration uses a public
  synthetic dataset plus an engineered evidence layer. Production data handling is out of
  scope.
- **No broad external-system integration.** Evidence sources are engineered/mocked for the
  demonstration. Wiring multiple genuine external sources is explicitly deferred.
- **No replacement of the investigator's judgement.** The process produces a
  recommendation and the human decides; it never auto-files a regulatory report.
- **Deferred beats (ranked backlog, not committed for the submission):** a
  missing-evidence loop-back that re-fetches data and re-triages; a service-level-agreement
  timer that escalates undecided alerts; and a live adverse-media / notification connector.
  See Open Questions for rationale.

## Story Index

| Ticket | Story                                              | Spec                                                               | Type        | Status      | Dependencies         |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------- | ----------- | ----------- | -------------------- |
| TBD    | Golden-set accuracy validation                     | [spec-golden-set-validation.md](spec-golden-set-validation.md)     | Technical   | Not Started | —                    |
| TBD    | Core triage slice (recommendation → sign-off → log)| [spec-core-triage-slice.md](spec-core-triage-slice.md)            | User-facing | Not Started | Golden-set validation |
| TBD    | Red-flag override & conservative tiering           | [spec-red-flag-override.md](spec-red-flag-override.md)             | User-facing | Not Started | Core triage slice    |
| TBD    | Maker–checker challenger on the high-risk path     | [spec-maker-checker-challenger.md](spec-maker-checker-challenger.md)| User-facing | Not Started | Core slice; Red-flag override |
| TBD    | Low-risk auto-disposition with batch sign-off & QA | [spec-low-risk-batch-signoff.md](spec-low-risk-batch-signoff.md)   | User-facing | Not Started | Core triage slice    |

## Shared Business Rules

These rules apply across every story and define the standard each alert is held to.

- **Three risk tiers, three routes.** Every alert is assigned **low**, **medium**, or
  **high** risk. Low risk is auto-dispositioned with human batch sign-off and sampled
  review; medium risk gets an agent recommendation that a human signs or overrides; high
  risk gets the agent recommendation, an independent challenger review, then senior /
  enhanced-due-diligence (EDD) sign-off.
- **Citations must be grounded.** The agent may cite only evidence items that were actually
  gathered into the case file. Every citation is checked against the gathered evidence; any
  citation that cannot be traced to a real evidence item is flagged for the human before
  they see the recommendation. An unverifiable citation never passes silently.
- **Conservative tiering — uncertainty escalates.** Deterministic red-flag triggers force
  the high-risk route regardless of what the agent concludes. A confidence floor sends
  anything the agent is not strongly confident is low risk up to a human. The system never
  resolves doubt downward.
- **Red-flag trigger list (any one forces the high-risk route):** a sanctions-list match on
  the customer or a counterparty; a politically-exposed-person (PEP) match; a structuring
  pattern (three or more transactions each just under the RM25,000 cash-transaction-report
  threshold within a 7-day window); a counterparty in a jurisdiction on the international high-risk
  call-to-action list; or an internal watchlist match.
- **Confidence floor for auto-disposition:** an alert may be auto-dispositioned as low risk
  only when the agent's confidence is at least 85%. Below 85%, it is routed to a human.
- **Every alert carries an audit-ready decision record** containing: the alert reference
  and date; the customer / account reference; the risk tier and the agent's confidence; the
  recommendation (escalate / close / send to EDD); the list of cited evidence with each
  item's source and citation-check status; any red-flag triggers that fired; the challenger
  outcome where applicable; the human decision (who, when, agreed or overridden, and the
  override reason); and the final disposition with its timestamp. The record reconstructs
  the full alert → evidence → recommendation → decision → outcome trail.
- **A human is accountable for every disposition**, including auto-dispositioned low-risk
  alerts (via batch sign-off and sampling). No alert is closed with no human in the chain.

## User Journey Map

> End-to-end experience across all five stories, from the investigator's and supervisor's
> perspective.

1. **An alert arrives.** A transaction-monitoring alert enters the queue. The process
   immediately assembles the evidence picture — customer profile, transaction history,
   screening results, adverse-media indicators — into one case file. _(Story: Core triage
   slice)_
2. **The risk is sorted.** Deterministic red-flag triggers and a confidence floor decide
   whether the alert must go to the high-risk route; otherwise the agent's risk tier
   stands. _(Story: Red-flag override & conservative tiering)_
3. **The investigator receives a reasoned recommendation.** For a medium-risk alert, the
   investigator opens a case that already states the call, the risk tier, the confidence,
   and the cited evidence — with any unverifiable citation already flagged. They sign or
   override, recording why. _(Story: Core triage slice)_
4. **High-risk alerts get a second opinion.** A challenger independently reviews the
   recommendation and either agrees or raises a documented disagreement before a senior /
   EDD reviewer makes the call. _(Story: Maker–checker challenger)_
5. **Low-risk volume stays accountable.** Low-risk alerts are auto-dispositioned, but a
   supervisor clears them in a single batch sign-off, with a sampled percentage (and all
   high-value alerts) pulled for full review. _(Story: Low-risk auto-disposition with batch
   sign-off & QA)_
6. **The decision is logged and defensible.** Whatever the route, a complete audit record
   is written. Anyone reviewing it later can reconstruct exactly what was known, what was
   recommended, who decided, and why. _(Story: Core triage slice)_
7. **Confidence is earned first.** Before any of this runs end-to-end, the agent's
   recommendations are scored against a realistic dataset with known answers, so the team
   knows the reasoning is accurate, not plausible-sounding. _(Story: Golden-set accuracy
   validation)_

## Success Metrics

- **Audit-readiness:** at least 90% of triaged alerts produce a full cited narrative (the
  call, the risk tier, and validated evidence citations) that passes a simple
  audit-readiness rubric — measured against today's one-line close reason.
- **Decision accuracy:** the agent's precision and recall on its risk-tier calls are
  reported as real numbers against the dataset's known answers, with at least 6 of 8
  curated golden-set scenarios passing all three rubric points (correct call, validated
  citations, would survive an audit).
- **Defensibility coverage:** 100% of dispositioned alerts — including auto-dispositioned
  low-risk alerts — have a named human accountable in the record.
- **Citation integrity:** zero unverifiable citations reach a human reviewer unflagged.
- **Time-to-defensible-decision:** investigators start from a complete, reasoned
  recommendation rather than a blank case file (qualitative, demonstrated).

## Dependencies

- **Public synthetic AML dataset** (SAML-D or the IBM Transactions for AML dataset) as the
  realistic substrate, with its license attributed. No real or anonymized-real data.
- **An engineered evidence layer** that assembles each alert's evidence bundle and injects
  synthetic sanctions / PEP indicators (the raw datasets contain none).
- **Monetary values are expressed in Malaysian ringgit (MYR)**, reflecting a Bank Negara
  Malaysia supervision context: the cash-transaction-report (CTR) threshold is RM25,000 and
  the high-value mandatory-review bar is RM250,000 (demonstration default). Dataset amounts
  are normalized into ringgit in the engineered layer.
- **Automation platform access** confirmed — the UiPath CLI is authenticated against
  Automation Cloud; the orchestration, human-review steps, and audit store depend on it.
  **Solo build (team size 1)** — scope discipline carries more weight than usual.
- **A curated golden set** of 8–12 scenarios drawn from the dataset, each engineered to
  exercise a specific route and demonstration beat.

## Rollout Strategy

- **Validate, then build a vertical slice.** The golden-set validation runs first to prove
  the agent's reasoning. Then one alert is taken fully end-to-end (gather → recommendation
  with validated citations → human sign-off → audit log) by a hard internal date.
- **Layer the beats in priority order** once the slice works: red-flag override, then the
  maker–checker challenger, then low-risk batch sign-off and sampling QA. Each is a ranked
  backlog item, not an unconditional commitment.
- **Feature-freeze near the end of the build window**, after which effort shifts to the
  demonstration narrative. Narrow-but-works beats broad-but-broken.

## Open Questions

> Resolve all questions before implementation. Non-blocking questions may be deferred with
> rationale.

- [x] ~~What exact fields make a decision record audit-ready?~~ — **Resolved:** the field
  set is fixed in Shared Business Rules above (alert reference, customer reference, tier,
  confidence, recommendation, cited evidence with check status, red-flag triggers,
  challenger outcome, human decision and override reason, final disposition and timestamp).
- [x] ~~What is the confidence-floor threshold and the red-flag trigger list?~~ —
  **Resolved:** auto-disposition requires ≥85% agent confidence; the red-flag list is the
  five triggers fixed in Shared Business Rules. These are demonstration defaults, tunable
  later.
- [x] ~~What is the minimum-viable challenger?~~ — **Resolved:** an independent review that
  agrees or raises a documented disagreement on the high-risk path before senior / EDD
  sign-off. Detailed in its story.
- [x] ~~Which evidence sources are real vs. mocked?~~ — **Resolved:** all evidence is
  engineered / mocked over the public dataset for the submission; a live adverse-media /
  notification connector is a deferred backlog beat.
- [x] ~~What accuracy bar does the agent have to clear?~~ — **Resolved:** at least 6 of 8
  golden-set scenarios pass all three rubric points; precision and recall are reported as
  real numbers without a hard pass threshold.
- [x] ~~Confirm automation-platform access and team size on day one~~ — **Resolved:**
  UiPath CLI is authenticated against Automation Cloud; solo build (team size 1). No
  blocking dependencies remain.
- [ ] Missing-evidence loop-back and service-level-agreement escalation timer — **Deferred
  (non-blocking):** valuable but build-heavy; included in the ranked backlog and layered
  only if the committed stories land with time to spare.
