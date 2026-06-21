---
name: guardrails-enabled-for-evals
description: Agent guardrails must have enabledForEvals:true so eval runs reflect production fidelity
metadata:
  type: convention
---

All guardrails in `agent.json` for this project are set with `"enabledForEvals": true`.

**Why:** Disabling guardrails during evals produces optimistic accuracy scores — the agent sees inputs in evals that it would reject in production (prompt injection, adversarial bundles). Keeping guardrails live during evals means the golden-set score measures what actually ships.

**How to apply:** When adding new guardrails to `TriageAgent/agent.json` or any future agent in this solution, always include `"enabledForEvals": true` in the guardrail block. Do not set it to `false` for convenience during eval development.
