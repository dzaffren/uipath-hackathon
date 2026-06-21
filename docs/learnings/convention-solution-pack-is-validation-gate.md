---
name: solution-pack-is-validation-gate
description: Individual project pack succeeds with malformed bindings; uip solution pack is the strict gate — always use it to validate
metadata:
  type: convention
---

`uip maestro bpmn pack <project> <output>` succeeds even when BPMN bindings are malformed (wrong attributes, wrong bindings_v2.json format). `uip solution pack` is strict and performs solution-level binding validation. Individual project pack success gives false confidence.

**Why:** The individual packager skips cross-project and binding-schema validation that the solution packager enforces. A successful individual pack only proves the project is structurally well-formed as a standalone unit.

**How to apply:** During BPMN development, always run `uip solution pack . <output>` (not just `uip maestro bpmn pack`) as the final validation step before declaring the BPMN integration complete. Treat individual pack as a quick structural check only.
