# Aurora Verdict — Defensible AML Alert Triage

> UiPath AgentHack 2026 · Track 2 (Maestro BPMN) · Enterprise / central-bank supervision
> Grounded in the BIS Innovation Hub's **Project Aurora** (AML) research.

---

## Inspiration

In anti-money-laundering (AML) operations, an investigator manually assembles
evidence from separate systems — KYC, transaction history, sanctions/PEP
screening, adverse media — and then records a **one-line close reason**. A year
later, when a regulator or auditor asks _"why was this closed?"_, that one line
doesn't hold up. The decision isn't defensible.

Regulators and auditors don't reward throughput — they reward decisions that
survive review years later. We set out to make every escalate-or-close decision
**defensible by construction**: each one carries a structured, evidence-cited
rationale and a complete, replayable trail from `alert → evidence → recommendation
→ human decision → logged outcome`.

## The problem

- **Thin rationale.** The recorded reason is a sentence or two — not enough to
  defend the call later.
- **Scattered evidence.** Gathering the full picture eats the time meant for
  judgment.
- **Inconsistent calls.** Outcomes vary by which analyst is on shift; no reliable
  second set of eyes.

## What it does

**Aurora Verdict** is a real BPMN process (not a linear pipe) that triages each
AML alert and routes it to the _right level_ of human review:

1. **Gather evidence** — a robot assembles customer profile, transaction history,
   sanctions/PEP screening, and adverse-media results into one structured bundle,
   where every item has a **stable ID**.
2. **Reason and recommend** — an LLM agent reads the bundle and produces a **risk
   tier** (low / medium / high), a **confidence score**, and a **rationale where
   every claim is cited by evidence ID**.
3. **Validate before a human sees it** — a citation validator confirms every cited
   ID actually exists in the bundle. **An agent that invents a citation is flagged,
   not trusted.** A confidence floor sends anything the agent isn't strongly
   confident is low _up_ to a human.
4. **Route proportionally:**
   - **Low risk** → auto-dispositioned, but a named supervisor clears the batch in
     **one sign-off** after individually reviewing a sampled 5% **and** all
     high-value alerts (≥ RM 250,000). No alert is ever silently auto-closed.
   - **Medium risk** → an analyst **signs or overrides** the recommendation;
     overriding requires a written reason.
   - **High risk** → **maker–checker**: a second _challenger_ agent disputes the
     call before a senior reviewer decides.
5. **Write the audit record** — every decision writes an append-only
   `DecisionRecord` naming the accountable human, the route taken, the outcome,
   and any reviewer correction.

**Conservative by construction:** deterministic red-flag triggers (any
sanctions/PEP hit, structuring pattern, or watchlist/high-risk jurisdiction)
force the high-risk route **regardless of what the agent says**. Doubt always
resolves _upward_ — protecting against the catastrophic false negative.

## How we built it

Six load-bearing UiPath components, packaged as one deployable solution
(`AuroraVerdict.uipx`):

| Component                              | UiPath product    | Role                                                                          |
| -------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `TriageOrchestrationBpmn`              | **Maestro BPMN**  | The spine — orchestrates the whole flow, gateways, loop-back, and human tasks |
| `TriageAgent`                          | **Agent Builder** | LLM reasoning + evidence synthesis with ID-only citations                     |
| `ChallengerAgent`                      | **Agent Builder** | High-risk second opinion (maker–checker)                                      |
| `EvidenceGatherApi`                    | **API Workflow**  | Assembles the IDed evidence bundle                                            |
| `DecisionGateApi`                      | **API Workflow**  | Deterministic red-flag check + confidence floor                               |
| `AuditWriteApi`                        | **API Workflow**  | Append-only `DecisionRecord` writer                                           |
| `BatchPartitionApi`                    | **API Workflow**  | Low-risk sampling (5% + all high-value) for batch sign-off                    |
| Human sign / override / batch sign-off | **Action Center** | Human-in-the-loop tasks                                                       |
| Audit log + case records               | **Data Fabric**   | The defensible record store                                                   |

```
Alert ▸ EvidenceGather ▸ TriageAgent ▸ DecisionGate ┬─ low  ▸ BatchPartition ▸ batch sign-off ─┐
                                                     ├─ med  ▸ analyst sign / override ──────────┤▸ AuditWrite
                                                     └─ high ▸ Challenger ▸ senior review ───────┘
```

The entire project was **built with Claude Code driving the `uip` CLI** — the
named "UiPath for Coding Agents" path — to scaffold, pack, and publish the
solution onto UiPath Automation Cloud.

## How we validated it (the riskiest assumption first)

Before building the full orchestration, we tested the one assumption everything
rests on: _are the agent's cited recommendations actually accurate and
audit-defensible — not plausible-sounding mush?_

We curated **8 synthetic golden-set scenarios** from the public **SAML-D**
dataset (MIT License), each engineered to exercise a specific decision path —
clean close, structuring escalation, **hallucinated-citation catch**, ambiguous
escalation, sanctions+PEP, high-risk jurisdiction, and watchlist match — and ran
each through the agent, scoring on a 3-point rubric (correct call? citations
validated? would it survive an audit?) **plus** precision/recall against
ground-truth labels.

**Result: 8/8 exact risk-tier matches** (~11.6 s per scenario). The evaluation is
fully self-contained in the repo — a judge can read the pre-run outputs with **no
credentials required**.

## Challenges we ran into

- **Grounding citations structurally.** Letting an LLM "cite evidence" invites
  hallucination. We solved it with ID-only references into a structured bundle
  plus a validator that flags any unverifiable citation _before_ a human sees it.
- **Modeling N-item batch review in BPMN.** Sequential per-item iteration with a
  summary sign-off on the exit branch required a loop-back exclusive gateway with
  a sentinel variable — a non-obvious BPMN pattern we captured as a build learning.
- **Passing ForEach iteration variables into JavaScript activities** and
  accumulating per-iteration results — both required explicit argument wiring that
  isn't obvious from the designer.
- **Solution-pack binding validity.** We learned to treat `uip solution pack` as
  the binding-validity gate and pre-create entry-points/bindings for API projects.

## Accomplishments we're proud of

- A **genuine BPMN process** with a risk-tier gateway, missing-evidence loop-back,
  maker–checker gateway, and SLA escalation — not a linear pipeline.
- **Hallucination-resistant by design:** invented citations fail the rubric (see
  scenario GS-03).
- **No decision closed with no human in the chain** — even the high-volume
  low-risk bucket has a named, accountable signer.
- A **hard accuracy number** (8/8, with precision/recall) instead of an eyeballed
  demo.

## What we learned

That the defensibility angle is exactly where Maestro and Claude are each
strongest: Maestro for human-in-the-loop orchestration with a full trace, and the
agent for structured reasoning with verifiable citations. The guardrails
(validated citations, conservative tiering, append-only audit) matter more in a
regulated context than raw speed.

## What's next

- Wire real external sources via **Integration Service** (adverse-media /
  notification connectors) as a layered beat.
- A standalone **consistency metric** across analysts.
- Expand the golden set and report precision/recall at larger scale.

## Data & ethics

All scenarios use **synthetic data only** — drawn from the public SAML-D dataset
(MIT License) with an engineered evidence layer that injects synthetic
sanctions/PEP hits. **No real or anonymized-real customer data** is used anywhere.

## Built with

UiPath Maestro (BPMN) · UiPath Agent Builder · UiPath API Workflows · UiPath
Action Center · UiPath Data Fabric · UiPath Automation Cloud · Claude (Anthropic)
· Claude Code + `uip` CLI · Python (evaluation harness) · SAML-D dataset
