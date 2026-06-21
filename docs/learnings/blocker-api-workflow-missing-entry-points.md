---
name: api-workflow-missing-entry-points
description: API workflow projects require manually created entry-points.json and bindings_v2.json before packing
metadata:
  type: blocker
---

`uip api-workflow pack` generates `package-descriptor.json` referencing `content/entry-points.json` and `content/bindings_v2.json` but does NOT generate these files. Orchestrator rejects the installed package with "Entry points configuration is missing or corrupted." Create both files in the project directory before running pack; the tool then picks them up. `entry-points.json` `type` must be `"api"` (not `"processorchestration"` which is BPMN). `bindings_v2.json` can start as `{"version":"2.0","resources":[]}`.

**Why:** The CLI's pack step assumes these files pre-exist; no command generates them for API workflow projects (unlike agent projects which use `uip agent migrate`).

**How to apply:** When creating a new API workflow project (`ProjectType: "Api"`), create `entry-points.json` and `bindings_v2.json` in the project directory as part of scaffolding, before any pack attempt.
