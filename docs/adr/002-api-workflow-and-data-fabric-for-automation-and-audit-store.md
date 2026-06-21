# ADR 002 — API Workflow + Data Fabric for the automation layer and audit store

**Status:** Accepted (2026-06-20)
**Deciders:** Solo build (Aurora Verdict)
**Affects:** All stories.

## Context

Three non-LLM jobs must be built: (1) **evidence gathering** — read the synthetic dataset,
assemble each alert's evidence into an ID'd bundle, and inject synthetic sanctions/PEP
indicators the raw data lacks; (2) the **deterministic gate** — citation validation
(every cited `evidence_id` must exist in the bundle), the red-flag trigger evaluation, and
the confidence floor; (3) **persistence** — write the audit-ready decision record and case
data. The candidate mechanisms are an **API Workflow** (CNCF Serverless Workflow DSL JSON,
run by `uip api-workflow run`), a **coded RPA workflow** (`.cs`), or a **visual RPA**
workflow (`.xaml`). The work is data-shaped (CSV parsing, arithmetic pattern detection,
structured writes) — there is no UI to automate.

## Decision

Use **API Workflows (JSON)** for evidence gathering, the deterministic gate, and the
record writes, persisting all case and audit data to **Data Fabric** entities. Arbitrary
logic (CSV parsing, the structuring-pattern detector, synthetic flag injection, the
citation validator) lives in `JsInvoke` (JavaScript) activities. Data Fabric is reached
from API Workflows through the Data Fabric Integration Service connector
(`uipath-uipath-dataservice`).

## Consequences

- **Positive:** Lightest fit for data-shaped work; the most Claude-Code-authorable artifact;
  `JsInvoke` gives full deterministic control over the gate so the LLM never decides a
  red flag or a citation's validity; cleanly occupies the "API Workflow" platform component
  for Platform Usage scoring; Data Fabric gives stable record IDs and relational links for a
  replayable audit trail.
- **Negative / accepted:** Data Fabric has **no native append-only/immutability primitive** —
  the decision-record entity is append-only **by convention** (insert only; never update or
  delete). Reserved field names (`Status`, `Type`, `Case`, `User`, `Role`, `Order`, and the
  `Id`/`CreateTime`/… system fields) are rejected, so the schema uses qualified names
  (`DispositionStatus`, `TriggerKind`, …). `FILE`-field upload via the CLI is currently
  broken, so evidence payloads are stored as `MULTILINE_TEXT` JSON rather than file
  attachments. API Workflows pack/publish only through the solution packager (no
  `uip api-workflow build`).

## Alternatives considered

- **Coded RPA workflow (`.cs`) + Data Fabric:** more control and a strong coded-RPA showcase,
  but heavier than an API Workflow for parsing and structured writes. Rejected as
  unnecessary weight for a solo build.
- **Visual RPA (`.xaml`) + Data Fabric:** strongest classic-RPA showcase but the most
  awkward fit for CSV parsing, arithmetic detection, and structured writes. Rejected.
