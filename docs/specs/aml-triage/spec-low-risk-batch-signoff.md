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
