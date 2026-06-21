# Learnings Index

Captured during build sessions. Entries here inform future `/build` runs via Phase 0 (prior learnings).

## Blockers

- [uip-agent-migrate-not-refresh](blocker-uip-agent-migrate-not-refresh.md) — `uip agent refresh` doesn't exist; use `uip agent migrate --output json` from the agent directory
- [worktree-isolation-requires-git-remote](blocker-worktree-isolation-requires-git-remote.md) — `forge:feature-builder` worktree isolation fails without a git remote; use sequential inline execution
- [no-git-remote-configured](blocker-no-git-remote-configured.md) — repo has no origin remote; `git push` fails until `git remote add origin <url>` is run

## Conventions

- [guardrails-enabled-for-evals](convention-guardrails-enabled-for-evals.md) — agent guardrails must have `enabledForEvals:true` so eval scores reflect production behaviour
