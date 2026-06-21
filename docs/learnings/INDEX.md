# Learnings Index

Captured during build sessions. Entries here inform future `/build` runs via Phase 0 (prior learnings).

## Blockers

- [uip-agent-migrate-not-refresh](blocker-uip-agent-migrate-not-refresh.md) — `uip agent refresh` doesn't exist; use `uip agent migrate --output json` from the agent directory
- [worktree-isolation-requires-git-remote](blocker-worktree-isolation-requires-git-remote.md) — `forge:feature-builder` worktree isolation fails without a git remote; use sequential inline execution
- [no-git-remote-configured](blocker-no-git-remote-configured.md) — repo has no origin remote; `git push` fails until `git remote add origin <url>` is run
- [api-workflow-missing-entry-points](blocker-api-workflow-missing-entry-points.md) — `uip api-workflow pack` does not generate entry-points.json or bindings_v2.json; create them manually before packing
- [bpmn-binding-required-attributes](blocker-bpmn-binding-required-attributes.md) — BPMN `<uipath:binding>` needs all 4 attributes and bindings_v2.json must use `"kind"` not `"type"` or solution pack fails
- [failed-deploy-blocks-redeploy](blocker-failed-deploy-blocks-redeploy.md) — failed solution deploy blocks re-deploy with same name (4004/4007 errors); use a new `--name` to retry
- [bpmn-gateway-missing-route](blocker-bpmn-gateway-missing-route.md) — adding a new gateway condition without covering all compute_route return values causes a silent runtime stall (no error, process stops)
- [api-workflow-connector-no-local-test](blocker-api-workflow-connector-no-local-test.md) — `uip api-workflow run` cannot execute Data Service connector steps locally; use a Node.js harness for JS logic and deploy to test connector steps
- [incremental-bpmn-branch-dependency](blocker-incremental-bpmn-branch-dependency.md) — when a spec depends on gateway stubs added in a prior feature branch, branch off that feature branch (not master); check spec gateway references against master before branching

## Conventions

- [guardrails-enabled-for-evals](convention-guardrails-enabled-for-evals.md) — agent guardrails must have `enabledForEvals:true` so eval scores reflect production behaviour
- [solution-pack-is-validation-gate](convention-solution-pack-is-validation-gate.md) — individual project pack skips binding validation; always run `uip solution pack` as the final gate before declaring BPMN integration complete

## Patterns

- [confidence-unit-normalisation](pattern-confidence-unit-normalisation.md) — normalize agent confidence from 0–1 float to 0–100 before threshold comparisons; agents can return either unit
- [bpmn-shared-api-binding](pattern-bpmn-shared-api-binding.md) — reuse one binding entry for multiple BPMN service tasks invoking the same API-Workflow resource; the elementId scopes each invocation, sharing one entry passes solution pack validation
