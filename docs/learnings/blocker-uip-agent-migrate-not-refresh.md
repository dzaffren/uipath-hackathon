---
name: uip-agent-migrate-not-refresh
description: uip agent refresh does not exist in CLI v1.195.0 — use uip agent migrate to regenerate .agent-builder/ files
metadata:
  type: blocker
---

Use `uip agent migrate --output json` (run from the agent project directory, e.g. `AuroraVerdict/TriageAgent/`) to regenerate `.agent-builder/` scaffolding.

**Why:** CLI v1.195.0 has no `refresh` verb on the `agent` group. `migrate` is the correct command; it regenerates `.agent-builder/agent.json`, `bindings.json`, and `entry-points.json` from the local `agent.json`.

**How to apply:** Any time a step calls for refreshing or regenerating agent builder files, substitute `uip agent migrate --output json` (from inside the agent directory) for any `uip agent refresh` call.
