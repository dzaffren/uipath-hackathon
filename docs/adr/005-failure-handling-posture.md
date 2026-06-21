# ADR 005 — Failure-handling posture (idempotent re-run, no saga)

**Status:** Accepted (2026-06-20)
**Deciders:** Solo build (Aurora Verdict)
**Affects:** All stories — primarily the API Workflows (`EvidenceGather`, `DecisionGate`, `AuditWrite`, `BatchPartition`) and the BPMN spine.

## Context

The orchestration has several steps that can fail at runtime: an agent job
(`Orchestrator.StartAgentJob`) can error or time out; an API Workflow
(`Orchestrator.ExecuteApiWorkflowAsync`) can throw; and a multi-entity Data Fabric write
can partially succeed (e.g. `EvidenceGather` inserts an `Alert` then fails partway through
the four `EvidenceItem`s). Data Fabric has **no cross-record transaction** and no upsert.
For a system whose whole value is being *audit-defensible and replayable*, we must state a
deliberate posture rather than leave failure behaviour undefined. Full saga/compensation is
disproportionate for a 9-day solo demo.

## Decision

Adopt **idempotent re-run** as the recovery model; do **not** implement
saga/compensation/rollback in demo scope.

1. **Idempotency by business key.** Every write is keyed by a deterministic business key
   (`Alert.AlertReference`, `EvidenceItem.EvidenceId`, `BatchSignoff.BatchReference`, and one
   `DecisionRecord` per `AlertLink`). Because Data Fabric has no upsert, each insert is
   guarded in a `JsInvoke` step: **query-by-key first; insert only if absent**; otherwise emit
   `DUPLICATE_WRITE_SKIPPED` and continue. Re-running a step therefore never double-writes.
2. **Bounded failure surface per workflow.** Each API Workflow wraps its multi-entity write
   in `TryCatch`; on an uncaught error it returns a hard-fail `Response` with
   `markJobAsFailed` and a structured `WORKFLOW_STEP_FAILED` payload (`$error.title` /
   `$error.detail`). The BPMN service task surfaces this as a Maestro **incident**.
3. **Recovery = re-run the instance.** An operator re-runs the failed Maestro instance.
   Idempotent writes mean a re-run of `EvidenceGather` reconciles any partial write rather
   than duplicating it. The gate and audit-write run only after a successful gather, so a
   partial gather never produces a half-formed decision record.
4. **No auto-retry loop.** Agent/step failures raise an incident for manual re-run; there is
   no automatic retry (the missing-evidence loop-back that *would* re-fetch and re-triage is
   an explicitly deferred beat).
5. **Diagnosis** uses `uip maestro bpmn instance incidents <id> -f <folder>` and
   `uip maestro bpmn job traces <jobKey>`.

## Consequences

- **Positive:** Simple and demo-appropriate; no distributed transaction; the
  defensibility/replay story holds because re-runs are safe and the audit-write is
  single-shot per alert; failure is visible as an incident, not a silent partial state.
- **Negative / accepted:** A gather that fails after some inserts can leave orphan
  `EvidenceItem`s until the idempotent re-run reconciles them (tolerated; a cleanup query can
  remove orphans if needed). There is no automatic recovery — a human re-runs. Cross-step
  atomicity is not guaranteed, only per-alert audit-write single-shot.

## Alternatives considered

- **Saga / compensation across steps:** true rollback, but heavy to build and operate for a
  9-day solo demo with no real downstream side effects. Rejected (revisit post-submission).
- **Queue-based retry with a dead-letter:** robust at volume, but adds a queue component and
  retry tuning the demo doesn't need. Rejected.
