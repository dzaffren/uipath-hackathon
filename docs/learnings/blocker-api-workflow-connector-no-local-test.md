---
name: api-workflow-connector-no-local-test
description: uip api-workflow run cannot execute Data Service connector steps locally — use a Node.js harness for JS logic instead
metadata:
  type: blocker
---

`uip api-workflow run` fails with "Connection is required for this task: `CreateEntityRecordCurated_*`" whenever the workflow contains a UiPath.IntSvc (Data Service) connector step. The local serverless executor has no offline mock for Data Service connections; it requires a live platform session for any `CreateEntityRecordCurated` or `QueryEntityRecordsCurated` action. There is no `--mock-connectors` flag.

**Why:** The local executor supports pure `JsInvoke` steps and basic control flow, but connector steps (`call: "UiPath.IntSvc"`) resolve against a live Orchestrator connection. Even when authenticated via `uip login`, the local run still fails because the connection resource ID must resolve to a live Integration Service connection — it cannot simulate or stub the Data Service API.

**How to apply:** Verification strategy for API workflows with connector steps:
1. **Pure JS logic** (detectors, routing, validation) — extract the JS code from each `JsInvoke` step into a standalone Node.js script and run `node <harness>.js` with crafted JSON inputs. This covers all acceptance criteria that are pure logic.
2. **Connector steps** — test only against a deployed solution instance (pack → publish → deploy, then invoke the deployed workflow via Orchestrator UI or API).
3. **Schema/binding validity** — use `uip api-workflow validate` (works offline) and `uip solution pack --dry-run` as the local gates before deploying.

See [[api-workflow-missing-entry-points]] for the related pre-creation requirement for entry-points.json.
