# Learnings Index

Captured during build sessions. Entries here inform future `/build` runs via Phase 0 (prior learnings).

## Blockers

- [uip-agent-migrate-not-refresh](blocker-uip-agent-migrate-not-refresh.md) — `uip agent refresh` doesn't exist; use `uip agent migrate --output json` from the agent directory
- [worktree-isolation-requires-git-remote](blocker-worktree-isolation-requires-git-remote.md) — `forge:feature-builder` worktree isolation fails without a git remote; use sequential inline execution
- [no-git-remote-configured](blocker-no-git-remote-configured.md) — repo has no origin remote; `git push` fails until `git remote add origin <url>` is run
- [api-workflow-missing-entry-points](blocker-api-workflow-missing-entry-points.md) — `uip api-workflow pack` does not generate entry-points.json or bindings_v2.json; create them manually before packing
- [bpmn-binding-required-attributes](blocker-bpmn-binding-required-attributes.md) — BPMN `<uipath:binding>` needs all 4 attributes and bindings_v2.json must use `"kind"` not `"type"` or solution pack fails
- [failed-deploy-blocks-redeploy](blocker-failed-deploy-blocks-redeploy.md) — failed solution deploy blocks re-deploy with same name (4004/4007 errors); use a new `--name` to retry

## Conventions

- [guardrails-enabled-for-evals](convention-guardrails-enabled-for-evals.md) — agent guardrails must have `enabledForEvals:true` so eval scores reflect production behaviour
- [solution-pack-is-validation-gate](convention-solution-pack-is-validation-gate.md) — individual project pack skips binding validation; always run `uip solution pack` as the final gate before declaring BPMN integration complete
