---
name: bpmn-binding-required-attributes
description: BPMN binding elements and bindings_v2.json require fixture-conformant format or solution pack fails
metadata:
  type: blocker
---

Two related failures at `uip solution pack` time: (a) `<uipath:binding>` elements in BPMN XML require all four attributes — `type="process"`, `elementId="<taskId>"`, `resource="process"`, `resourceKey="<packageId>"` — missing any one causes misleading "must target Agent name" or similar errors even when `resourceSubType` and `propertyAttribute` are present; (b) `bindings_v2.json` must use `"kind"` (not `"type"`), include a `"resource"` field, and carry a `"metadata"` block (`BindingsVersion`, `DisplayLabel`, `SolutionsSupport`, `SubType`, `PropertyAttribute`). The incorrect field name `"type": "Process"` (capitalized) is silently malformed.

**Why:** `uip solution pack` validates bindings strictly against a schema; the fixture-conformant format is not prominently documented; wrong field names produce misleading error messages that point at the wrong root cause.

**How to apply:** When authoring BPMN binding elements, use the fixture at `~/.uipath/.skills/skills/uipath-maestro-bpmn/fixtures/validation/agent-invocation/` as the authoritative template. Mirror that structure for both the BPMN XML and `bindings_v2.json`. The `resourceKey` value should be the deployed package ID (e.g. `AuroraVerdict.Agent.TriageAgent`).
