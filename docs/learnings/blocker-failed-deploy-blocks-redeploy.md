---
name: failed-deploy-blocks-redeploy
description: A failed solution deployment blocks re-deploy with the same name; use a different name as workaround
metadata:
  type: blocker
---

`uip solution deploy run` failure leaves a stuck deployment. Re-deploying with the same `--name` returns HTTP 400 "Deployment with key '...' was not installed successfully" (error code 4004). `uip solution deploy uninstall <name>` also fails on failed deployments (error code 4007 "cannot be uninstalled"). Workaround: use a different `--name` for the retry (e.g. increment a suffix: `AuroraVerdict` → `AuroraVerdict-1` → `AuroraVerdict-v2`).

**Why:** The platform does not auto-clean failed deployments, and the uninstall command only operates on successful ones.

**How to apply:** When a deploy fails, do NOT retry with the same `--name`. Choose a new name for the next attempt. Keep a naming convention that indicates the attempt number or version so Orchestrator stays navigable.
