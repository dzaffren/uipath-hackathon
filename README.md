# Aurora Verdict — Defensible AML Alert Triage

An end-to-end AML (anti-money-laundering) alert triage system built on UiPath Maestro. It takes a transaction-monitoring alert, gathers the full evidence picture, produces a structured recommendation with verified citations, routes each alert to the right level of human review, and writes a complete audit record — so every escalate-or-close decision can survive regulatory scrutiny.

**Golden-set accuracy: 8/8 exact risk-tier matches** (run 2026-06-21, ~11.6 s per scenario)

---

## What it does

An AML investigator today manually assembles evidence from separate systems, then records a one-line close reason. That rationale doesn't hold up when a regulator asks for it a year later. Aurora Verdict replaces that with a structured, cited, human-accountable process:

1. **Gather evidence** — pulls customer profile, transaction history, sanctions/PEP screening, and adverse-media results into one bundle.
2. **Reason and recommend** — an LLM agent reads the bundle, produces a risk tier (low / medium / high), a confidence score, and a rationale with every claim cited against real evidence.
3. **Route to proportional human review:**
   - **Low risk** → auto-dispositioned; supervisor clears a batch in one sign-off after reviewing a sampled 5% and all high-value alerts (≥ RM 250,000) individually.
   - **Medium risk** → analyst signs or overrides the recommendation; override requires a written reason.
   - **High risk** → maker–checker: a second challenger agent disputes the call before the senior reviewer decides.
4. **Write the audit record** — every decision writes a `DecisionRecord` naming the accountable human, the route taken, the outcome, and any reviewer correction. Append-only by convention.

---

## Architecture

```
Alert arrives
      │
      ▼
EvidenceGatherApi ──── assembles evidence bundle (profile, transactions, screening, media)
      │
      ▼
TriageAgent ──────────── LLM reasons on bundle → { risk_tier, confidence, rationale, citations }
      │
      ▼
DecisionGateApi ─────── checks red flags + confidence floor
      │
   ┌──┴─────────────────────────────────┐
   │                                    │
low_batch                    medium_signoff          high_challenger
   │                                    │                    │
BatchPartitionApi            Analyst HITL           ChallengerAgent
(sample 5% + all            (sign / override)      (disputes the call)
 ≥ RM250k pulled)                │                    │
   │                             │               Senior HITL decides
   ├── pulled items: individual HITL (confirm / correct upward)
   └── summary HITL: supervisor signs off bulk
      │
      ▼
AuditWriteApi ─────────── writes DecisionRecord per alert
```

Six UiPath projects in one solution (`AuroraVerdict.uipx`):

| Project                   | Type         | Role                               |
| ------------------------- | ------------ | ---------------------------------- |
| `TriageOrchestrationBpmn` | Maestro BPMN | Orchestrates the full flow         |
| `TriageAgent`             | Agent        | LLM reasoning + evidence synthesis |
| `ChallengerAgent`         | Agent        | High-risk second opinion           |
| `EvidenceGatherApi`       | API Workflow | Evidence bundle assembly           |
| `DecisionGateApi`         | API Workflow | Red-flag check + confidence gate   |
| `AuditWriteApi`           | API Workflow | Audit record writer (append-only)  |
| `BatchPartitionApi`       | API Workflow | Low-risk sampling + batch sign-off |

**Agent type:** both `TriageAgent` and `ChallengerAgent` are **low-code agents built in UiPath Agent Builder** (not coded agents) — each configured with the `anthropic.claude-sonnet-4-6` model, a structured system prompt, and JSON input/output contracts.

Beyond these seven projects, the solution uses **Action Center** for the human sign-off / override / batch-approval tasks and **Data Fabric** for the append-only `DecisionRecord` audit store. Full UiPath component set: **Maestro (BPMN) · Agent Builder · API Workflows · Action Center · Data Fabric**.

---

## Evaluating the project

### Option A — Read the pre-run results (no credentials needed)

The golden-set has already been run against the deployed agent. Results are in the repo:

```
eval-results-2026-06-21T14-45-23-413Z.json   ← pass/fail per scenario
golden-set/agent-outputs/                     ← full agent output per scenario
```

Each agent-output file contains the agent's `risk_tier`, `confidence`, `rationale`, and `citations`. Example for scenario GS-01 (clean salary deposit, expected low risk):

```json
{
  "risk_tier": "low",
  "confidence": 96,
  "recommendation": "close",
  "rationale": "Risk tier is assessed as LOW. The evidence bundle presents a clean,
    consistent picture with no red flags across any category..."
}
```

All 8 scenarios returned exact risk-tier matches.

---

### Option B — Re-run the golden-set against the live agent

**Prerequisites:**

- Python 3.9+
- UiPath CLI: `npm install -g @uipath/uipath-cli` (or download from docs.uipath.com)
- An authenticated UiPath Automation Cloud tenant: `uip login`
- The Aurora Verdict solution deployed (see Option C)

**Run:**

```bash
# Fire all 8 scenarios against the deployed TriageAgent; writes to golden-set/agent-outputs/
python golden-set/run_agent.py

# Score the outputs: precision, recall, per-scenario rubric, PROCEED/HOLD verdict
python golden-set/score.py eval-results-<timestamp>.json
```

The scorer applies a 3-point rubric per scenario: correct risk-tier call, citations confirmed against the evidence bundle, audit-defensible rationale. Pass bar: ≥ 6 of 8 → PROCEED.

---

### Option C — Deploy and run a live triage

**Pack and publish:**

```bash
uip login
uip solution pack AuroraVerdict ./out
uip solution publish ./out/<package>.zip
uip solution deploy config get AuroraVerdict --destination config.json
uip solution deploy run \
  --name AuroraVerdict-v1 \
  --package-name AuroraVerdict \
  --folder-name AuroraVerdict \
  --parent-folder-path Shared \
  --config-file config.json
```

**Trigger a triage run** by starting the `TriageOrchestrationBpmn` process with one of the golden-set scenarios as input. The BPMN will route through Evidence Gather → Triage Agent → Decision Gate → the appropriate human-review path → Audit Write.

**Inspect the BPMN** — open `AuroraVerdict/TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn` in UiPath Studio or any BPMN 2.0 viewer to see the full orchestration flow.

---

## Golden-set scenarios

Eight synthetic scenarios drawn from the SAML-D dataset (MIT License, berkanoztas/synthetic-transaction-monitoring-dataset-aml), each engineered to exercise a specific decision path:

| ID    | Customer            | Amount (MYR) | Expected tier | Demo beat                                     |
| ----- | ------------------- | ------------ | ------------- | --------------------------------------------- |
| GS-01 | Mariam Hassan       | 3,500        | low           | Clean salary deposit — close                  |
| GS-02 | Okoro Chukwuemeka   | 47,000       | high          | Structuring pattern — escalate                |
| GS-03 | (invented citation) | —            | medium        | Agent must not cite evidence that isn't there |
| GS-04 | Priya Sharma        | 18,000       | medium        | Ambiguous — human review needed               |
| GS-05 | (sanctions + PEP)   | 120,000      | high          | Sanctions hit + PEP indicator                 |
| GS-06 | (jurisdiction)      | 95,000       | high          | FATF high-risk jurisdiction counterparty      |
| GS-07 | Lee Wei Ming        | 2,800        | low           | Clean trade payment — close                   |
| GS-08 | Razlan Mahmud       | 35,000       | high          | Watchlist match                               |

Each scenario file (`golden-set/scenarios/GS-XX-*.json`) contains the full evidence bundle the agent reads — customer profile, transaction history, screening results, and adverse media — so the evaluation is fully self-contained and reproducible.

---

## Features built

| Feature                                                        | Spec                             | Status   |
| -------------------------------------------------------------- | -------------------------------- | -------- |
| Golden-set accuracy validation                                 | spec-golden-set-validation.md    | ✅ 8/8   |
| Core triage slice (evidence → recommendation → sign-off → log) | spec-core-triage-slice.md        | ✅       |
| Red-flag override & conservative tiering                       | spec-red-flag-override.md        | ✅       |
| Maker–checker challenger (high-risk path)                      | spec-maker-checker-challenger.md | ✅       |
| Low-risk batch sign-off with sampling QA                       | spec-low-risk-batch-signoff.md   | ✅ PR #5 |

---

## Key design decisions

- **Cited evidence is verified, not trusted.** Every citation the agent produces is checked against the gathered evidence bundle (`CitationCheck`). An agent that invents a citation fails the rubric — this is the most important guard against hallucination in an audit context (see GS-03).
- **No decision is closed with no human in the chain.** Low-risk alerts are auto-dispositioned but a named supervisor signs the batch. Medium-risk alerts require a human sign or override. High-risk alerts require maker–checker agreement.
- **Append-only audit records.** `DecisionRecord` rows are never updated or deleted. Every disposition has a named `DecisionMakerName`, a `RouteTaken`, and a `BatchSignoffLink` where applicable.
- **Conservative by design.** The red-flag gate resolves doubt upward: a structuring flag or a sanctions hit moves an alert to a higher tier, never lower.

Full architecture decisions: `docs/adr/`

---

## Repository layout

```
AuroraVerdict/              UiPath solution (pack with: uip solution pack AuroraVerdict ./out)
  TriageOrchestrationBpmn/    Maestro BPMN orchestrator
  TriageAgent/                LLM triage agent
  ChallengerAgent/            High-risk challenger agent
  EvidenceGatherApi/          Evidence assembly API Workflow
  DecisionGateApi/            Red-flag + confidence gate API Workflow
  AuditWriteApi/              Audit record writer API Workflow
  BatchPartitionApi/          Low-risk batch partitioner API Workflow

golden-set/
  scenarios/                  8 synthetic AML scenarios (JSON)
  agent-outputs/              Agent responses from last eval run
  run_agent.py                Harness: fires scenarios against deployed agent
  score.py                    Scorer: 3-point rubric, precision/recall, PROCEED/HOLD

docs/
  specs/aml-triage/           Feature specs (one per story)
  adr/                        Architecture decision records
  learnings/                  Build learnings (indexed)
```

---

## Data

All scenarios use **synthetic data only** — drawn from the SAML-D public dataset (MIT License) with an engineered evidence layer. No real or anonymized-real customer data is used anywhere in this project.
