---
name: worktree-isolation-requires-git-remote
description: forge:feature-builder worktree isolation fails when the repo has no git remote — fall back to sequential inline execution
metadata:
  type: blocker
---

`forge:feature-builder` with `isolation: "worktree"` throws "Cannot create agent worktree: not in a git repository and no WorktreeCreate hooks are configured" when the repo has no git remote.

**Why:** Worktree isolation requires a properly initialised git repository with a remote (or WorktreeCreate hooks). This project has no remote until the user runs `git remote add origin <url>`, so the parallel execution plan cannot be used.

**How to apply:** Until a remote is added, replace any parallel `feature-builder` launch plan with sequential inline implementation. After the remote is configured and the first push succeeds, re-test whether worktree isolation becomes available.
