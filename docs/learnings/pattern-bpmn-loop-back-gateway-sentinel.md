---
name: bpmn-loop-back-gateway-sentinel
description: Implement N-item sequential BPMN iteration as a loop-back exclusive gateway reading a sentinel variable; summary action sits on the exit branch
type: pattern
captured: 2026-06-26
source: /build session — low-risk-batch-signoff feature (PR #5); Gateway_ReviewLoop in TriageOrchestrationBpmn.bpmn
---

In UiPath Maestro BPMN (`ProcessOrchestration`), there is no native sub-process or multi-instance construct that blocks until all items are resolved and then triggers a single summary action. The runtime-idiomatic workaround is a loop-back exclusive gateway that doubles as both the merge point (returning iterations) and the split point (exit when done).

**Structure:**

1. A `scriptTask` initialises loop state: `{ current_index: 0, loop_done: pulled.length === 0 ? "yes" : "no", ... }`.
2. An `exclusiveGateway` (merge + split) reads the sentinel: `loop_done == "no"` → prepare-item task; `loop_done == "yes"` → summary HITL or final step.
3. A `scriptTask` prepares the current item from the array (`pulled[current_index]`).
4. A `userTask` (or service task) processes the item.
5. A `scriptTask` updates loop state: pushes result to `reviewed_items[]`, increments `current_index`, sets `loop_done = "yes"` when `current_index >= pulled.length`.
6. A sequence flow loops back to the gateway (step 2), routed through a lower y-coordinate row to avoid diagram overlap.
7. The summary HITL on the exit branch fires exactly once, after all iterations are exhausted.

**Why:** Maestro BPMN has no equivalent of Action Center's native per-item blocking construct within a BPMN sub-process. Using a separate gateway task per item would require knowing N at design time. The loop-back gateway with a sentinel variable is the only pattern that handles a runtime-determined array length with a guaranteed single summary action at the end. Putting the summary HITL inside the loop body would trigger it on every iteration.

**How to apply:** Use this pattern whenever a BPMN needs to iterate over a variable-length list (e.g. `pulled[]` from a partition API) and then perform one gated action after all items are handled. Name the sentinel something unambiguous (`loop_done`, not `done` or `complete` — avoid reserved-word collisions). Route the loop-back edge through a separate diagram row (higher y-value) so the BPMN editor does not render it as an overlapping straight line.
