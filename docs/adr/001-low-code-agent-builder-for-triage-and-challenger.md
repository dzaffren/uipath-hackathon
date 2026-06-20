# ADR 001 — Low-code Agent Builder for the triage and challenger agents

**Status:** Accepted (2026-06-20)
**Deciders:** Solo build (Aurora Verdict)
**Affects:** All stories; primarily Golden-set validation, Core triage slice, Maker–checker challenger.

## Context

The epic needs two LLM reasoning steps: a **triage agent** (produces a risk tier,
confidence, recommendation, and ID-only evidence citations) and an independent
**challenger agent** on the high-risk path. We must choose how to build them. The two
realistic options on the UiPath platform are low-code **Agent Builder** (`agent.json`,
`type: "lowCode"`) or a **coded agent** (e.g. Python/LangGraph packed and published via
`uip`). Constraints: solo developer, ~9-day clock to 2026-06-29, the agents must wire
natively into a Maestro BPMN spine, and the deterministic red-flag / confidence-floor /
citation-validation logic will live **outside** the LLM regardless of this choice.

## Decision

Build both agents as **low-code Agent Builder agents** — two separate `agent.json`
projects (`TriageAgent`, `ChallengerAgent`) sharing one model and the shared
evidence-bundle / ID-only-citation contract. Structured output is enforced via each
agent's `outputSchema`. Two distinct projects (not one reused definition) are used so the
challenger has genuinely independent instructions and can, if needed, run a different
`settings.model` to reduce correlated errors.

## Consequences

- **Positive:** Fastest path to a working Maestro-wired agent for a solo build; structured
  output (`outputSchema`) and guardrails are first-class; native BPMN binding via
  `Orchestrator.StartAgentJob`; eval tooling (`uip agent eval`) available for the golden set.
- **Negative / accepted:** Low-code evaluators **cannot compute precision/recall** and have
  no built-in classification evaluator (that exists only for coded agents) — handled by
  [ADR 003](003-custom-precision-recall-scoring.md). `outputSchema` does not enforce numeric
  min/max, so the `confidence` 0–100 bound is prompt-enforced and validated downstream. The
  named "Built with Claude Code" bonus is unaffected — it is about the *coding* agent
  (Claude Code driving `uip`), not the in-flow agent runtime.

## Alternatives considered

- **Coded agent (Python/LangGraph):** maximum control over the citation contract and access
  to classification evaluators, but adds SDK wiring + a publish step and more solo
  maintenance surface. Rejected for the build-window risk; revisitable post-submission if
  precision/recall must be evaluator-native rather than script-computed.
- **One agent definition reused as both triage and challenger:** less to maintain, but a
  single shared system prompt/model gives weak independence — the opposite of what a
  defensible maker–checker design needs. Rejected.
