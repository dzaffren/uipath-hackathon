# ADR 003 — Custom precision/recall scoring over Agent eval exports (golden set)

**Status:** Accepted (2026-06-20)
**Deciders:** Solo build (Aurora Verdict)
**Affects:** Golden-set accuracy validation (primary); Core triage slice (consumes the verdict).

## Context

The Golden-set validation story must report the triage agent's **precision and recall** on
its risk-tier calls against known-correct labels, plus a three-point rubric pass/fail per
scenario. The chosen low-code Agent Builder runtime ([ADR 001](001-low-code-agent-builder-for-triage-and-challenger.md))
exposes `uip agent eval` with four evaluators (Exact match, JSON similarity, Semantic
Similarity, Trajectory). None of these computes precision/recall, and the
classification/confusion-matrix evaluators exist **only for coded agents**.

## Decision

Run the agent over the golden set with `uip agent eval` using a **deterministic evaluator**
(Exact match / JSON similarity) to get per-scenario pass/fail on the labeled `risk_tier` and
`recommendation` fields, **export the per-case results**, and compute **precision and recall
in a small custom scoring script** (`golden-set/score.py`) over the export. The same script
applies the three-point rubric (correct tier; every citation validated against the bundle;
audit-survivable) and emits the go/fix verdict. Citation validation in the rubric reuses the
same deterministic validator logic as the production gate ([ADR 002](002-api-workflow-and-data-fabric-for-automation-and-audit-store.md)).

## Consequences

- **Positive:** Keeps the low-code agent (no pivot to coded just for metrics); precision/recall
  are real computed numbers from exported per-case data, not eyeballed; the rubric and the
  production citation validator share one implementation, so the validation measures what
  ships.
- **Negative / accepted:** A custom script is an extra artifact to maintain and must be kept
  in sync with the eval export format. Eval runs are cloud-based and require
  `uip solution upload` first.

## Alternatives considered

- **Pivot the triage agent to a coded agent** to use native classification evaluators:
  evaluator-native precision/recall, but contradicts ADR 001 and adds build risk for a
  reporting concern that a ~40-line script solves. Rejected.
- **Eyeball a sample:** explicitly disallowed by the story's success criteria (precision/recall
  must be real computed numbers). Rejected.
