---
name: bpmn-gateway-missing-route
description: Adding a new gateway condition without covering all compute_route return values causes a silent runtime stall
metadata:
  type: blocker
---

When a `Javascript_Compute_Route` (or equivalent) step gains a new return value (e.g. `high_challenger`), every possible return value must have a matching outgoing `<bpmn:sequenceFlow>` with a `<bpmn:conditionExpression>` from the exclusive gateway. Missing one leaves the gateway with no matching branch at runtime — the process instance stalls silently with no error message.

**Why:** The BPMN runtime does not validate exclusive gateway completeness at start-up. It only fails at execution time when the expression evaluates to a value with no corresponding outgoing flow. The failure mode is a silent stall — no exception is thrown, no log line is emitted — making it very hard to diagnose without tracing `Var_Route`. The `uip maestro bpmn validate` command does not catch this either (it passes with only a subset of conditions covered).

**How to apply:** Before committing any change to a step that computes a routing value, enumerate all possible output values of that step and cross-check them against the gateway's `<bpmn:outgoing>` elements. If a value has no matching flow, add a stub end event (`End_<RouteName>`) and sequence flow with the correct condition. See [[bpmn-binding-required-attributes]] for related BPMN structural constraints.
