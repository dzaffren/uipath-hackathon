# Low-Risk Auto-Disposition with Batch Sign-Off and Sampling QA

**Ticket:** TBD

This feature handles the highest-volume bucket of alerts — the ones the agent confidently
assesses as low risk — without forcing a human to review every single one, while keeping a
named human accountable for all of them. Confidently-low-risk alerts are auto-dispositioned
into a batch, a supervisor clears the whole batch with a single sign-off, and a sampled
percentage plus every high-value alert is always pulled out for full individual review. It
closes the governance hole where low-risk alerts get silently auto-closed with no human in
the chain.

## User Story

As a supervisor accountable for the low-risk alert bulk, I want to clear a batch of
auto-dispositioned low-risk alerts in one sign-off while a sample and all high-value items
are pulled for my full review, so that every low-risk closure has a named human accountable
for it without me having to read every alert by hand.

## Background & Context

**Current state:**

- The core triage process already assigns each alert a risk tier and produces a reasoned,
  citation-backed recommendation. Confidently-low-risk alerts — those the agent rates low
  risk with strong confidence and no red flag — are the largest share of the daily volume.
- Today those low-risk alerts are typically closed quickly with a one-line reason and little
  documented oversight. In practice, no specific human is recorded as accountable for each
  low-risk closure.

**Problem:**

- The highest-volume risk is exactly here: large numbers of low-risk alerts closed fast with
  thin oversight is where a missed suspicious transaction is most costly and hardest to
  defend to a regulator afterwards.
- Requiring a human to read every low-risk alert would be unworkable at volume, but
  closing them with no human in the chain is indefensible. There is no middle path today
  that is both efficient and accountable.

## Target User & Persona

- **Who:** A supervisor or quality-assurance reviewer (referred to throughout as "Lena")
  who is accountable for the low-risk bulk and answers for those closures on review.
- **Context:** Lena works through the day's accumulated low-risk alerts in batches —
  typically clearing a batch at the end of a shift or at a set point in the day — rather
  than opening each alert one at a time.
- **Current workaround:** She either spot-checks a handful of closed alerts informally with
  no record of which she looked at, or trusts that the closures were fine because reviewing
  all of them is impossible. Neither leaves a defensible accountability trail.

## Goals

- Let a supervisor clear an entire batch of confidently-low-risk auto-dispositioned alerts
  with a single sign-off action.
- Automatically pull a sampled percentage of each batch for full individual review, and
  always pull every high-value alert regardless of the sample.
- Record the signing supervisor as the named accountable human on every auto-dispositioned
  alert in the batch, and record the reviewer's confirmation or correction on each sampled
  and high-value alert.
- Ensure no low-risk alert is closed with no human in the chain, while keeping the effort
  proportional to the volume.

## Non-Goals

- The agent's risk assessment itself — how an alert is rated low risk and confident — is
  owned by the core triage slice and is consumed here, not redefined.
- The red-flag trigger list and the confidence-floor mechanics are owned by the red-flag
  story; this feature relies on their output (only confidently-low, no-red-flag alerts ever
  reach this batch) and does not re-implement them.
- The high-risk challenger and senior / enhanced-due-diligence review path are out of scope.
- When a sampled alert is corrected upward, the subsequent medium- or high-risk handling of
  that alert is performed by those existing routes, not by this feature.

## User Workflow

> The step-by-step experience from the supervisor's perspective. No technical detail —
> only what she sees, does, and decides.

1. **A batch is ready.** Lena opens her queue and sees a batch of auto-dispositioned
   low-risk alerts waiting for sign-off — for example, 240 alerts accumulated over the day.
   The batch shows how many alerts it contains, how many are flagged for full review (the
   sample plus all high-value items), and a summary she can scan.
2. **The system has already set aside the review items.** Before Lena acts, the batch has
   already pulled out a sampled percentage and every high-value alert for full individual
   review. She sees these listed separately from the alerts that can be cleared in bulk.
3. **She reviews the pulled items.** Lena opens each flagged alert, reads its reasoned
   recommendation and cited evidence, and either confirms the low-risk call or corrects it
   by sending it up for fuller review. Her confirmation or correction is recorded against
   that alert.
4. **She signs off the batch.** Once the pulled items are handled, Lena clicks a single
   batch sign-off. Every auto-dispositioned alert in the batch is closed with her recorded
   as the accountable human.
5. **She is done.** Lena sees a confirmation that the batch is signed off, naming her, the
   batch size, the sampled and high-value items she reviewed, and any she corrected. The
   accountability trail is complete for every alert in the batch.

## Acceptance Criteria

> Scenarios from Lena's perspective. They cover batch sign-off, sample confirmation, sample
> correction, the always-pull high-value rule, the named-signer record, and the guard that
> she cannot sign off before handling the pulled items.

### Scenario: Supervisor clears a batch of low-risk alerts in a single sign-off

```gherkin
Given Lena has a batch of 240 auto-dispositioned low-risk alerts accumulated on 14 March 2026
  And every alert in the batch was rated low risk with at least 85% confidence and carries no red flag
  And the sampled and high-value alerts in the batch have all been reviewed and handled
When Lena clicks the single batch sign-off
Then all 240 alerts are closed as low-risk dispositions in one action
  And Lena is recorded as the accountable human on every one of the 240 alerts
  And she sees a confirmation naming her, the batch of 240, and the date 14 March 2026
```

### Scenario: A sampled alert is pulled for full review and confirmed

```gherkin
Given Lena's batch of 240 low-risk alerts applies a 5% sample, pulling 12 alerts for full review
  And one sampled alert is the closure for customer Ravi Menon, a RM1,800 recurring rent payment
When Lena opens Ravi Menon's alert and reads its reasoned recommendation and cited evidence
  And she agrees with the low-risk call and confirms it
Then the alert remains a low-risk disposition
  And the record shows Lena reviewed and confirmed the low-risk call
  And the alert no longer counts as outstanding for the batch
```

### Scenario: A sampled alert is pulled, the supervisor disagrees, and re-routes it up

```gherkin
Given Lena's batch applies a 5% sample, pulling 12 alerts for full review
  And one sampled alert is the closure for customer Sofia Castellano, a RM18,000 transfer to a newly added counterparty
When Lena opens Sofia Castellano's alert and reads its reasoned recommendation and cited evidence
  And she disagrees with the low-risk call and corrects it by sending it up for fuller review
Then the alert is removed from the low-risk batch and is not auto-dispositioned as low risk
  And the alert is routed up for fuller human review
  And the record shows Lena reviewed the alert and corrected the low-risk call, with her reason
  And the remaining 239 alerts in the batch are unaffected
```

### Scenario: A high-value low-risk alert is always pulled for review regardless of the sample

```gherkin
Given Lena's batch of 240 low-risk alerts applies a 5% sample
  And the batch contains an alert for customer Hartwell Logistics with aggregate transactions of RM600,000 that the agent rated low risk
  And the high-value threshold for mandatory review is RM250,000 in aggregate
When the batch is prepared for Lena's sign-off
Then the Hartwell Logistics alert is pulled for full individual review even though it was not selected in the 5% sample
  And it appears in Lena's review list alongside the sampled alerts
  And Lena cannot sign off the batch until she has reviewed and either confirmed or corrected it
```

### Scenario Outline: Alerts at, above, and below the high-value threshold

```gherkin
Given Lena's batch contains a low-risk alert for <customer> with aggregate transactions of <amount>
  And the high-value threshold for mandatory review is RM250,000 in aggregate
  And the alert was not selected in the 5% sample
When the batch is prepared for Lena's sign-off
Then the alert is <treatment>

Examples:
  | customer            | amount   | treatment                                          |
  | Marlow Trading      | RM245,000 | left in the bulk for batch sign-off               |
  | Eastgate Holdings   | RM250,000  | pulled for full individual review                  |
  | Hartwell Logistics  | RM600,000 | pulled for full individual review                  |
```

### Scenario: Every auto-dispositioned alert names the accountable signer in its record

```gherkin
Given Lena has signed off her batch of 240 low-risk alerts on 14 March 2026
When an auditor later opens the record for any closed alert in that batch
Then the record names Lena as the accountable human for the low-risk disposition
  And the record shows the disposition was a batch sign-off with its date and time
  And for a sampled or high-value alert the record additionally shows Lena's confirmation or correction
```

### Scenario: The supervisor cannot sign off the batch while pulled items are unreviewed

```gherkin
Given Lena's batch of 240 low-risk alerts has pulled 12 sampled alerts and 1 high-value alert for full review
  And Lena has reviewed 10 of the 13 pulled alerts
When Lena attempts the single batch sign-off
Then the sign-off is not allowed
  And she is told that 3 pulled alerts still need her review before the batch can be signed off
  And no alert in the batch is closed yet
```

### Scenario: A batch with no sampled or high-value items can be signed off directly

```gherkin
Given Lena has a small batch of 8 auto-dispositioned low-risk alerts on 2 March 2026
  And the 5% sample rounds up to pull 1 alert for review
  And no alert in the batch reaches the RM250,000 high-value threshold
  And Lena has reviewed and confirmed the 1 pulled alert
When Lena clicks the single batch sign-off
Then all 8 alerts are closed as low-risk dispositions
  And Lena is recorded as the accountable human on every one of the 8 alerts
```

### Scenario: Only confidently-low, no-red-flag alerts ever appear in the batch

```gherkin
Given the core triage process has rated a set of alerts over the day
  And some alerts were rated low risk with at least 85% confidence and no red flag
  And other alerts were rated low risk but below 85% confidence, or carried a red flag, or were rated medium or high risk
When Lena opens her low-risk batch for sign-off
Then she sees only the alerts rated low risk with at least 85% confidence and no red flag
  And the below-confidence, red-flagged, medium, and high-risk alerts are not in her batch
```

## Business Rules & Constraints

- **A human is accountable for every low-risk disposition.** No alert is closed as low risk
  with no human in the chain. The supervisor who signs off the batch is recorded as the
  accountable human on every alert in it.
- **Only confidently-low, no-red-flag alerts reach this batch.** An alert is eligible for
  auto-disposition and batch sign-off only if the agent rated it low risk with at least 85%
  confidence and no red flag fired. Anything not confidently low — lower confidence, a
  red-flag trigger, or a medium or high tier — never lands in this batch; it is handled by
  the other routes. This is conservative by design: doubt is never resolved downward.
- **A sampled percentage is always pulled for full review.** A set sample rate (5% for the
  demonstration) of each batch is selected for full individual review. If the sample rate
  applied to the batch size is not a whole number, it rounds up so at least one alert is
  always reviewed when the batch is non-empty.
- **All high-value alerts are always pulled, regardless of the sample.** Any low-risk alert
  at or above the high-value threshold (RM250,000 in aggregate for the demonstration) is
  pulled for full individual review even if it was not selected in the sample. A high-value
  alert is never cleared by batch sign-off alone.
- **The batch cannot be signed off until all pulled items are handled.** The supervisor must
  confirm or correct every sampled and high-value alert before the single batch sign-off is
  allowed.
- **A corrected sample leaves the low-risk batch.** When a supervisor disagrees with a
  sampled or high-value low-risk call, that alert is removed from the batch, is not
  auto-dispositioned as low risk, and is routed up for fuller review. The correction and the
  supervisor's reason are recorded.
- **Sampled and high-value reviews are recorded in addition to the signer.** Beyond naming
  the batch signer, each sampled and high-value alert records the reviewer's confirmation or
  correction.

## Success Metrics

- 100% of auto-dispositioned low-risk alerts have a named accountable human (the batch
  signer) in their record — no low-risk alert is closed with no human in the chain.
- 100% of low-risk alerts at or above the high-value threshold are pulled for full
  individual review, regardless of whether the sample selected them.
- The configured sample rate is met or exceeded on every signed-off batch (at least the
  rounded-up sampled percentage is fully reviewed).
- Supervisor effort is proportional to volume: a batch is cleared in one sign-off after
  reviewing only the sample plus high-value items, rather than reading every alert.

## Dependencies

- **Core triage slice** — supplies each alert's risk tier, confidence level, reasoned
  recommendation, and cited evidence that the supervisor reads when reviewing a pulled item.
  This feature consumes those outputs and does not produce them.
- **Red-flag override and conservative tiering** — guarantees that only confidently-low,
  no-red-flag alerts are eligible for this batch. This feature relies on that guarantee
  rather than re-checking red flags or the confidence floor itself.
- **The audit-ready decision record** — the shared record that this feature writes the batch
  signer, the disposition, and any sampled-review confirmation or correction into.

## Open Questions

> Resolve all questions before implementation. Non-blocking questions may be deferred with
> rationale.

- [x] ~~Is a human accountable for low-risk closures, and how?~~ — **Resolved:** yes, via a
  single batch sign-off that names the signer on every alert, plus sampled and high-value
  full review. No low-risk alert is closed with no human in the chain.
- [x] ~~What is pulled for full review beyond the sample?~~ — **Resolved:** a set sample
  percentage (5% for the demonstration, rounding up to at least one) plus every alert at or
  above the high-value threshold (RM250,000 in aggregate for the demonstration).
- [x] ~~What happens when the supervisor disagrees with a sampled low-risk call?~~ —
  **Resolved:** the alert leaves the low-risk batch, is not auto-dispositioned as low risk,
  and is routed up for fuller review, with the correction and reason recorded.
- [ ] The exact sample percentage and high-value threshold for production use — **Deferred
  (non-blocking):** the demonstration uses 5% and RM250,000 in aggregate; both are stated
  defaults that can be tuned later without changing how the feature behaves.

---

# Technical Refinement

> Appended by `prd-refine`. The business sections above are frozen and unchanged. This
> section adds implementation detail and references the **Technical Architecture (Shared)**
> contract in [spec.md](spec.md) and [ADR 004](../../adr/004-batch-signoff-modeling.md). It
> does **not** redefine the shared Data Fabric entities (`Alert`, `EvidenceItem`,
> `AgentAssessment`, `CitationCheck`, `RedFlagTrigger`, `DecisionRecord`, `BatchSignoff`),
> the component map, the HITL baseline, or the Shared Error / Outcome Catalogue — all of
> which live in the shared contract.

## Functional Requirements

> Concrete worked example used throughout: **Lena's 240-alert batch on 14 Mar 2026**
> (`BatchReference = BATCH-2026-03-14`). 5% sample ⇒ `sampledCount = max(1, ceil(240 * 0.05))
> = ceil(12.0) = 12`. Pulled high-value items in this batch (illustrative): **Hartwell
> Logistics RM600,000** and **Eastgate Holdings RM250,000** are always pulled; **Marlow
> Trading RM245,000** stays in the bulk. **Ravi Menon RM1,800** is one of the 12 sampled and
> is confirmed; **Sofia Castellano RM18,000** is sampled and corrected upward.

- **FR-1 — Named human on every low-risk disposition.** Every alert in a signed-off batch
  gets a `DecisionRecord` whose `DecisionMakerName` is the batch signer (Lena). After Lena
  signs `BATCH-2026-03-14`, all 240 `DecisionRecord` rows name Lena; no low-risk alert is
  closed with no human in the chain.
- **FR-2 — Sampling math (5%, ceil, ≥1 when non-empty).** For a non-empty batch,
  `sampledCount = max(1, ceil(batchSize * (SampleRatePct / 100)))`. Examples:
  `batchSize=240 → ceil(12.0) = 12`; `batchSize=8 → ceil(0.4) = 1` (rounds UP and the
  `max(1, …)` floor both yield 1); `batchSize=0 → sampledCount = 0` (no sign-off task is
  created). Selection of the sampled subset is deterministic and seeded by `BatchReference`
  so a re-run reproduces the same sample (see FR-7 idempotency).
- **FR-3 — Always-pull high-value (≥ RM250,000).** Every alert with
  `AggregateAmountMYR >= 250000` is pulled for individual review **regardless** of the
  sample. The boundary is inclusive: **Eastgate Holdings RM250,000** is pulled,
  **Marlow Trading RM245,000** is not. A high-value alert is **never** cleared by batch
  sign-off alone. The pulled set is `pulled = sampledSubset ∪ highValueSet` (union, so an
  alert that is both sampled and high-value is counted once); `pulledCount = |pulled|`.
- **FR-4 — Sign-off gate (no clearance until pulled items handled).** The single summary
  HITL task cannot complete while any pulled item is unresolved. An attempt while items
  remain returns `BATCH_SIGNOFF_BLOCKED` with `outstandingCount`. Example: of 13 pulled
  (12 sampled + 1 high-value), 10 resolved ⇒ blocked with `outstandingCount = 3`; nothing
  in the batch is closed.
- **FR-5 — Corrected sample leaves the batch.** When Lena corrects a pulled low-risk call
  (e.g. **Sofia Castellano RM18,000**), that alert is removed from the batch
  (`AlertCount` for sign-off purposes excludes it), is **not** auto-dispositioned as low,
  is routed up for fuller review, and its correction + `correctionReason` are recorded. The
  remaining 239 alerts are unaffected.
- **FR-6 — Pulled reviews recorded in addition to the signer.** Every pulled (sampled or
  high-value) alert sets `WasPulledForReview = true` and additionally records the reviewer's
  confirm/correct outcome and (on correct) the reason — over and above the signer named by
  FR-1.
- **FR-7 — Idempotent partition.** Re-running `BatchPartition.json` for a `BatchReference`
  that already has a `BatchSignoff` record returns the existing partition rather than
  creating a second `BatchSignoff` or re-creating individual review tasks. The partition is
  keyed on `BatchReference` (one batch per business day, e.g. `BATCH-2026-03-14`).

## Permissions & Security

- **Supervisor role on both task kinds.** Both the individual review `userTask` and the
  summary sign-off `userTask` are assigned to the supervisor / QA role (Lena's group). Only
  a member of that role can confirm/correct a pulled item or sign off the batch. This reuses
  the **HITL task baseline** in the shared contract (read-only context + `outcomes[]`); no
  new role model is introduced.
- **Only eligible alerts enter (upstream guarantee).** Eligibility — `low` tier,
  `confidence >= 85`, no red flag — is enforced by the core slice + the red-flag story's
  `DecisionGateApi`. This story **relies** on that guarantee and does not re-evaluate red
  flags or the confidence floor (see Negative Constraints). The partition reads only alerts
  already routed `low_batch`.
- **Threat model.** See the **Cross-cutting Threat Model** in [spec.md](spec.md). The deltas
  for this story are in the Threat Model Checklist below.

## System Design

The batch sign-off is the **composite from [ADR 004](../../adr/004-batch-signoff-modeling.md)**,
wired on the Maestro BPMN spine (`TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn`):

1. **Partition** — `AuroraVerdict/BatchPartitionApi/BatchPartition.json` (API Workflow)
   reads the day's `low_batch`-routed alerts, computes `sampledCount` (FR-2), selects the
   sampled subset, unions in the high-value set (FR-3), creates one `BatchSignoff` record,
   and returns `{ pulled[], bulk[], stats }`.
2. **Individual review** — each pulled item becomes its **own** `bpmn:userTask` (confirm
   low / correct upward), iterated over `pulled[]` (a BPMN multi-instance / loop construct).
3. **Summary sign-off** — one `bpmn:userTask` shows read-only batch stats and offers
   `Approve Batch` / `Reject Batch`, **gated** so it cannot complete until every individual
   review task has resolved (`BATCH_SIGNOFF_BLOCKED`).
4. **Persistence** — `AuroraVerdict/AuditWriteApi/AuditWrite.json` writes the
   `DecisionRecord` rows (signer on all; reviewer confirm/correct on pulled; re-route on
   corrected). Append-only by convention.

```mermaid
flowchart TD
    A[low_batch alerts accumulated] --> P[BatchPartition.json: sampledCount = max&#40;1, ceil&#40;n*0.05&#41;&#41; ; pulled = sample ∪ highValue ; create BatchSignoff]
    P --> R{partition}
    R -->|pulled[] : sampled ∪ high-value| I[Individual review userTask &#40;loop&#41;<br/>Confirm low / Correct upward]
    R -->|bulk remainder| S[Summary sign-off userTask<br/>read-only stats<br/>Approve / Reject Batch]
    I -->|confirm| G[gate: all pulled resolved?]
    I -->|correct upward| X[alert leaves batch → routed up + reason recorded]
    G -->|no, outstandingCount &gt; 0| B[BATCH_SIGNOFF_BLOCKED — nothing closed]
    G -->|yes| S
    B -.->|return to pulled tasks| I
    S -->|Approve| W[AuditWrite.json: DecisionRecord per alert<br/>signer on all; WasPulledForReview on pulled]
    X --> W
```

**Tradeoffs (per [ADR 004](../../adr/004-batch-signoff-modeling.md)).** Rejected
alternatives:

- **Coded Action App grid** (`inputs.type: "custom"`, React/TS, true per-row batch UI):
  richest UX and closest to "one screen, 240 rows," but a separate deployable app whose
  build cost a solo 9-day window can't justify. Deferred as a post-submission upgrade.
- **One QuickForm task per alert, no batch:** defeats the story's purpose (proportional
  effort at volume) — Lena would face 240 forms. Rejected.

The accepted shape is **partition + per-pulled-item task + one gated summary task** on
supported QuickForm primitives; the "single sign-off" is one action over a *pre-partitioned*
bulk, and the gate is enforced in the orchestration (not by Action Center natively).

## Threat Model Checklist

Deltas on the **Cross-cutting Threat Model** in [spec.md](spec.md):

- **[Bulk-close bypass]** The gate prevents the bulk summary task closing while any
  high-value or sampled item is unreviewed. A sign-off attempt with outstanding pulled items
  returns `BATCH_SIGNOFF_BLOCKED` and closes nothing — the principal defence against a
  supervisor (accidentally or otherwise) clearing the bulk before reviewing the high-risk-by-value
  long tail.
- **[High-value escape]** No high-value alert (`AggregateAmountMYR >= 250000`) can be cleared
  by batch sign-off alone; it is always in `pulled[]` and must be individually resolved.
  Eastgate RM250,000 cannot ride the bulk path.
- **[Eligibility spoofing]** This story does not re-check eligibility; if an ineligible alert
  reaches the partition it is an upstream defect, not a downstream one. The partition reads
  only `RouteTaken=low_batch` alerts produced by the deterministic gate (no LLM in the
  partition path).
- **[Double-clearance / replay]** Idempotent partition (FR-7) keyed on `BatchReference`
  prevents a re-run double-creating `BatchSignoff` or re-issuing review tasks.
- **Inherited:** no PII / synthetic data only; Automation Cloud identity for all `uip`
  operations; Action Center tasks assigned to the named supervisor group; no new public
  routes.

## API Design

### `BatchPartition.json` (API Workflow)

**Run:** `uip api-workflow run AuroraVerdict/BatchPartitionApi/BatchPartition.json --input-arguments '{...}'`

**Request:**
```json
{
  "batchReference": "BATCH-2026-03-14",
  "batchDate": "2026-03-14",
  "sampleRatePct": 5,
  "highValueThresholdMYR": 250000,
  "signerName": "Lena"
}
```

**Response (concrete 240-alert example).** Suppose the 240 `low_batch` alerts include 3
high-value (Hartwell RM600,000, Eastgate RM250,000, and one more), of which 1 also happened
to fall in the 12-item sample. Then `sampledCount = 12`, `highValueCount = 3`,
`pulledCount = 12 + 3 - 1 = 14`, and the bulk remainder is `240 - 14 = 226`:
```json
{
  "batchReference": "BATCH-2026-03-14",
  "batchSignoffId": "5e3b…-uuid",
  "stats": {
    "alertCount": 240,
    "sampleRatePct": 5,
    "sampledCount": 12,
    "highValueCount": 3,
    "pulledCount": 14,
    "bulkCount": 226
  },
  "pulled": [
    { "alertReference": "ALERT-2026-1107", "customerName": "Hartwell Logistics", "aggregateAmountMYR": 600000, "pulledReason": "high_value" },
    { "alertReference": "ALERT-2026-1142", "customerName": "Eastgate Holdings",  "aggregateAmountMYR": 250000, "pulledReason": "high_value" },
    { "alertReference": "ALERT-2026-1009", "customerName": "Ravi Menon",         "aggregateAmountMYR": 1800,   "pulledReason": "sampled" },
    { "alertReference": "ALERT-2026-1055", "customerName": "Sofia Castellano",   "aggregateAmountMYR": 18000,  "pulledReason": "sampled" }
  ],
  "bulk": [
    { "alertReference": "ALERT-2026-1071", "customerName": "Marlow Trading", "aggregateAmountMYR": 245000 }
  ]
}
```
(`pulled[]`/`bulk[]` abbreviated; Marlow RM245,000 is below the threshold so it stays in the
bulk.) Re-running with the same `batchReference` returns this same payload without creating a
second `BatchSignoff` (FR-7).

### Individual-review HITL (`bpmn:userTask`, one per pulled item)

Read-only fields (from the shared HITL baseline): recommendation, `FinalRiskTier=low`,
`Confidence`, the `CitationCheck` results, the alert's evidence summary, and `pulledReason`
(`sampled` / `high_value`).

- **Outcomes:** `[Confirm low, Correct upward]`
- **Output:** `correctionReason` (MULTILINE) — **required** on `Correct upward`, omitted on
  `Confirm low`.
- On `Confirm low`: alert stays low; `WasPulledForReview=true`; reviewer outcome recorded;
  item no longer outstanding for the gate.
- On `Correct upward`: alert is removed from the batch, routed up (medium/high path),
  `correctionReason` recorded; item no longer outstanding for the gate (FR-5).

### Summary sign-off HITL (`bpmn:userTask`, one per batch)

Read-only fields: `alertCount`, total value, `sampleRatePct`, `pulledCount`,
`outstandingCount`.

- **Outcomes:** `[Approve Batch, Reject Batch]`
- **Output:** `batchSignoffReason` (MULTILINE).
- **Gate:** the task **cannot complete** while `outstandingCount > 0`; an attempt returns
  `BATCH_SIGNOFF_BLOCKED` and closes nothing. On `Approve Batch` with all pulled items
  resolved, `AuditWrite.json` writes a `DecisionRecord` per remaining alert (signer named on
  all). `Reject Batch` records `batchSignoffReason` and closes no alert.

### Error / outcome table (story-specific; references the shared catalogue)

| Code / outcome | Surfaced where | Meaning |
| -------------- | -------------- | ------- |
| `BATCH_SIGNOFF_BLOCKED` | Summary sign-off HITL | Sign-off attempted while `outstandingCount > 0`; nothing closed (shared catalogue). |
| `Confirm low` | Individual review HITL | Pulled low-risk call upheld; `WasPulledForReview=true`, reviewer outcome recorded. |
| `Correct upward` | Individual review HITL | Pulled call disagreed; alert leaves batch, routed up, `correctionReason` recorded (FR-5). |
| `Approve Batch` | Summary sign-off HITL | Bulk remainder closed low-risk; signer named on every `DecisionRecord`. |
| `Reject Batch` | Summary sign-off HITL | Supervisor declines to clear the bulk; `batchSignoffReason` recorded; nothing closed. |
| `correctionReason` empty on `Correct upward` | Individual review HITL | Reason is required on a correction; mirrors `OVERRIDE_REASON_REQUIRED` in the shared catalogue. |

## Data Model & Migrations

> **Delta only.** All seven entities are defined in the shared contract. This story
> **creates** `BatchSignoff` and **sets** specific `DecisionRecord` fields. Do not redefine
> the other entities.

**`BatchSignoff`** (fields exactly per the shared contract) —
`uip df entities create "BatchSignoff" --body '{...}' --output json`:
```json
{
  "displayName": "BatchSignoff",
  "fields": [
    { "name": "BatchReference",   "dataType": "STRING",            "isUnique": true },
    { "name": "SignoffTimestamp", "dataType": "DATETIME_WITH_TZ" },
    { "name": "SignerName",       "dataType": "STRING" },
    { "name": "AlertCount",       "dataType": "INTEGER" },
    { "name": "SampleRatePct",    "dataType": "INTEGER" },
    { "name": "SampledCount",     "dataType": "INTEGER" },
    { "name": "HighValueCount",   "dataType": "INTEGER" }
  ]
}
```
(Confirm the exact `--body` schema shape with
`uip df entities create --help --output json` before running; field names/types are
authoritative.)

**`DecisionRecord` fields this story sets** (entity already defined in the shared contract;
this story does **not** add fields):

| Field | Value this story writes |
| ----- | ----------------------- |
| `RouteTaken` | `low_batch` |
| `BatchSignoffLink` | → the batch's `BatchSignoff.Id` |
| `DecisionMakerName` | the signer (e.g. `Lena`) on **every** alert in the batch |
| `WasPulledForReview` | `true` for sampled/high-value items, else `false` |
| `HumanAction` | `signed_agree` on confirmed/bulk; corrected items leave the batch and are written by the upgraded route |
| `FinalDisposition` / `DispositionTimestamp` | `closed` + sign-off time for cleared alerts |

`uip df records insert` / `uip df records query` operate these rows (no schema migration
beyond creating `BatchSignoff`).

## Architecture Notes

- **Relies on the red-flag guarantee.** The eligibility filter (`low`, `confidence >= 85`,
  no red flag) is upstream (core slice + red-flag story `DecisionGateApi`). This story
  consumes `RouteTaken=low_batch` alerts and does not re-check (FR / Negative Constraints).
- **Partition runs on accumulated low-risk alerts.** `BatchPartition.json` queries the day's
  `low_batch` alerts (one batch per business day, `BATCH-YYYY-MM-DD`) rather than reacting to
  a single alert; it is invoked at the batch point in the BPMN spine.
- **Reuses `AuditWrite.json`.** No new audit writer — the shared
  `AuroraVerdict/AuditWriteApi/AuditWrite.json` is extended to emit batch `DecisionRecord`s
  (signer on all; reviewer confirm/correct on pulled; re-route on corrected). Append-only.
- **HITL authored manually in the `.bpmn`** (low-code/BPMN HITL CLI in-flight, per ADR 004)
  inside `TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn`.

## Implementation Plan

> Sizes are rough developer-effort. INDEPENDENT = can start without the others; SEQUENTIAL =
> needs a prior sub-task. All paths are full.

1. **Create the `BatchSignoff` Data Fabric entity.**
   `uip df entities create "BatchSignoff" --body '{…}'` with the 7 fields above.
   *Size:* S. *INDEPENDENT.*
2. **Author `AuroraVerdict/BatchPartitionApi/BatchPartition.json`.** API Workflow: query
   `low_batch` alerts; `sampledCount = max(1, ceil(n * pct/100))` (round UP); deterministic
   seeded sample; union in `AggregateAmountMYR >= threshold`; create the `BatchSignoff`
   record; return `{ pulled[], bulk[], stats }`; idempotent on `batchReference` (FR-7).
   *Size:* M. *SEQUENTIAL* (after #1 — needs the entity to write `BatchSignoff`).
3. **Author the individual-review `userTask` loop in
   `TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn`.** Multi-instance `bpmn:userTask`
   over `pulled[]`: read-only recommendation/evidence/`pulledReason` + outcomes
   `[Confirm low, Correct upward]` + `correctionReason` required on correct.
   *Size:* M. *SEQUENTIAL* (after #2 — consumes `pulled[]`).
4. **Author the summary `userTask` + sign-off gate in the same `.bpmn`.** Single
   `bpmn:userTask` with read-only stats + `[Approve Batch, Reject Batch]` +
   `batchSignoffReason`; gate that blocks completion while `outstandingCount > 0`
   (`BATCH_SIGNOFF_BLOCKED`). *Size:* M. *SEQUENTIAL* (after #3 — the gate keys off the
   individual tasks' resolution).
5. **Extend `AuroraVerdict/AuditWriteApi/AuditWrite.json` for batch DecisionRecords.** Write
   `DecisionRecord` per alert: signer (`DecisionMakerName`) on all, `RouteTaken=low_batch`,
   `BatchSignoffLink` set, `WasPulledForReview=true` + reviewer confirm/correct on pulled,
   and the re-route write for corrected items. *Size:* M. *SEQUENTIAL* (after #1, #2, #4 —
   needs the entity, partition output, and resolved outcomes).

## Negative Constraints

- Do **not** re-implement the confidence floor or red-flag checks — eligibility is
  guaranteed upstream (core slice + red-flag story); this story consumes `low_batch` alerts.
- Do **not** close a high-value alert (`AggregateAmountMYR >= 250000`) by batch sign-off
  alone — it is always pulled and must be individually resolved.
- Do **not** allow the summary sign-off to complete while any pulled item remains
  outstanding — return `BATCH_SIGNOFF_BLOCKED`.
- Do **not** auto-dispose a corrected alert as low — a `Correct upward` removes it from the
  batch and routes it up.
- Do **not** double-create a `BatchSignoff` on a partition re-run (idempotent on
  `BatchReference`).
- Inherits the **Global Negative Constraints** in [spec.md](spec.md) (append-only
  `DecisionRecord`; no real data; no hand-editing CLI-derived files; no reserved field names).

## Test Scenarios

> Implementation-level checks (distinct from the business Gherkin above). Run partition math
> with `uip api-workflow run`, the gate with `uip maestro bpmn debug`, and records with
> `uip df records query`.

- **TS-1 — 240-alert sample size.** Partition `batchSize=240`, `sampleRatePct=5` ⇒
  `stats.sampledCount == 12`.
- **TS-2 — 8-alert round-up.** Partition `batchSize=8`, `sampleRatePct=5` ⇒
  `ceil(0.4) = 1`, `stats.sampledCount == 1`.
- **TS-3 — High-value boundary.** With no sample selection: **Marlow RM245,000** → `bulk`
  (`pulledReason` absent); **Eastgate RM250,000** → `pulled` (`pulledReason="high_value"`);
  **Hartwell RM600,000** → `pulled` (`pulledReason="high_value"`).
- **TS-4 — Gate blocks with outstanding items.** 13 pulled (12 sampled + 1 high-value), 10
  resolved; attempt `Approve Batch` ⇒ `BATCH_SIGNOFF_BLOCKED`, `outstandingCount == 3`, and
  no `DecisionRecord` written (nothing closed).
- **TS-5 — Corrected sample leaves batch.** **Sofia Castellano RM18,000** → `Correct upward`
  with `correctionReason` set ⇒ alert removed from batch, routed up, reason recorded; the
  other 239 alerts unaffected (no change to their pending state).
- **TS-6 — Signer named on every record.** After `Approve Batch` on `BATCH-2026-03-14`,
  every cleared alert's `DecisionRecord` has `DecisionMakerName == "Lena"`,
  `RouteTaken == "low_batch"`, and `BatchSignoffLink` set.
- **TS-7 — Idempotent partition.** Re-run `BatchPartition.json` with `BATCH-2026-03-14` ⇒
  same `batchSignoffId`, no second `BatchSignoff` row.

## Verification

- **Partition math —** `uip api-workflow run AuroraVerdict/BatchPartitionApi/BatchPartition.json
  --input-arguments '{"batchReference":"BATCH-2026-03-14","sampleRatePct":5,"highValueThresholdMYR":250000,"signerName":"Lena"}'`
  and assert `stats.sampledCount == 12` (240 batch); repeat for the 8-alert batch asserting
  `sampledCount == 1`; assert Eastgate RM250,000 / Hartwell RM600,000 appear in `pulled[]`
  with `pulledReason="high_value"` and Marlow RM245,000 in `bulk[]`.
- **The gate —** `uip maestro bpmn debug` on
  `TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn`: drive 13 pulled tasks with 3
  unresolved, attempt `Approve Batch`, and confirm `BATCH_SIGNOFF_BLOCKED` with
  `outstandingCount = 3` and no closure; then resolve all and confirm the sign-off completes.
- **Records —** `uip df records query "BatchSignoff" …` confirms one row for
  `BATCH-2026-03-14` with `SignerName="Lena"`, `SampledCount=12`; and
  `uip df records query "DecisionRecord" …` confirms **every** batch `DecisionRecord` has
  `DecisionMakerName="Lena"` and `RouteTaken="low_batch"`, and that high-value items
  (Hartwell, Eastgate) show `WasPulledForReview=true`.
