# pattern: bpmn-shared-api-binding

## Rule

Reuse an existing API-Workflow binding entry for multiple BPMN service tasks
that invoke the same resource — do not create duplicate binding entries. The
BPMN task ID (`elementId`) scopes each invocation; the binding entry is just a
resource pointer and can be shared safely.

## Why

Duplicate binding entries for the same resource cause `uip solution pack
--dry-run` to fail with a binding-conflict error. Sharing one entry keeps
`bindings_v2.json` minimal, avoids that failure, and makes the mapping between
BPMN tasks and API workflows easier to audit.

## Example

`Task_ChallengerGate` and `Task_DecisionGate` in
`AuroraVerdict/TriageOrchestrationBpmn` both reference the same
`Binding_DecisionGate_Name` / `Binding_DecisionGate_Folder` binding entry.
Each task uses its own `elementId` in the BPMN XML; the single shared binding
entry passes `uip solution pack --dry-run` without errors.

## Source

Observed during the `feature/red-flag-override` build session when wiring the
high-challenger and low-batch gateway branches.
