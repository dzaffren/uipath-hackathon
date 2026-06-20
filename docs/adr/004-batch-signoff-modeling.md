# ADR 004 — Batch sign-off via a summary HITL task plus individual pull-outs

**Status:** Accepted (2026-06-20)
**Deciders:** Solo build (Aurora Verdict)
**Affects:** Low-risk auto-disposition with batch sign-off & QA (primary).

## Context

The low-risk story needs one supervisor action to disposition a whole batch of
auto-dispositioned low-risk alerts, while a sampled percentage (5% default, round up) and
**every** high-value alert (≥ RM250,000 aggregate default) are pulled out for full
individual review, and the batch cannot be signed off until those pulled items are handled.
Action Center QuickForm tasks disposition **one** decision context with a fixed field set
and one set of outcomes — there is **no native primitive** for one action approving N
independent items, and no native per-row grid in QuickForm.

## Decision

Model batch sign-off as a composite, all built on Action Center primitives wired in the
Maestro BPMN flow:

1. An upstream API Workflow partitions the day's eligible low-risk alerts into **pulled
   items** (sampled subset ∪ all high-value) and the **bulk remainder**, and creates a
   `BatchSignoff` record.
2. Each pulled item becomes its **own individual review HITL task** (confirm low-risk /
   correct upward), iterated.
3. The bulk remainder is dispositioned by a **single summary HITL task** whose read-only
   fields show batch stats (count, total value, sample rate, pulled count) and whose
   outcomes are `Approve Batch` / `Reject Batch`, with the sign-off **gated** so it cannot
   complete until every pulled task is resolved.

## Consequences

- **Positive:** One supervisor action clears the bulk; sampled + high-value items get real
  individual review; the gate guarantees no batch closes with pulled items outstanding; every
  alert in the batch gets the signer named in its `DecisionRecord`. Stays on supported
  QuickForm primitives — no custom app needed for the submission.
- **Negative / accepted:** The "single sign-off" is one action over a *pre-partitioned* bulk,
  not literally one form listing 240 rows; the gating logic (block sign-off while pulled
  tasks are open) is enforced in the orchestration, not by Action Center itself. Low-code/BPMN
  HITL CLI is in-flight, so the `userTask` nodes are authored manually in the `.bpmn`.

## Alternatives considered

- **Coded Action App grid** (`inputs.type: "custom"`, React/TS) for a true per-row batch UI:
  the richest UX and closest to "one screen, many rows," but a separate deployable app and
  build effort that a solo 9-day window can't justify. Deferred as a post-submission upgrade.
- **One QuickForm task per alert, no batch:** defeats the story's whole purpose (proportional
  effort at volume). Rejected.
