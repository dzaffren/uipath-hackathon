---
name: no-git-remote-configured
description: This repo has no git remote — git push -u origin fails until git remote add origin <url> is run
metadata:
  type: blocker
---

`git push -u origin <branch>` fails with "fatal: 'origin' does not appear to be a git repository" because no remote has been added to this local repo.

**Why:** The repo was initialised locally (`git init`) without being connected to GitHub. Every `/ship` run will block at the push step until the user runs:
```
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin <branch>
```

**How to apply:** Before any future `/ship`, verify `git remote -v` returns a valid origin. If empty, remind the user to add the remote first.
