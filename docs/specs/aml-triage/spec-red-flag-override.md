# Red-flag Override & Conservative Tiering

**Ticket:** TBD

This feature makes the triage process conservative by construction. A fixed list of
deterministic red-flag triggers forces an alert onto the high-risk route no matter what the
agent concludes, and a confidence floor sends anything the agent is not strongly confident
is low risk up to a human. The decision record then shows plainly that an override happened
and which trigger caused it, so an investigator, supervisor, or auditor can trust that a
dangerous alert can never be quietly down-graded.

## User Story

As an AML investigator (and the supervisor who answers for the decision later), I want
dangerous alerts to be forced onto the high-risk route — and any alert the agent is unsure
about to be sent to a person — regardless of what the agent recommends, so that a missed
red flag or an uncertain call can never be silently closed as low risk.

## Background & Context

**Current state:**

- Once the triage agent has gathered evidence, it produces a recommendation, a risk tier,
  and a confidence level (delivered by the Core triage slice).
- Today, whatever tier the agent lands on is the tier that stands. A confident-sounding
  "low risk, close it" goes straight toward closure.

**Problem:**

- A model can be wrong, and it can be confidently wrong. If the agent calls a sanctions-hit
  alert "low risk," nothing today stops that call from being acted on.
- The most catastrophic failure in AML is the false negative — a genuinely suspicious alert
  closed as routine. The cost of letting one through dwarfs the cost of a human glancing at
  a few extra alerts.
- Investigators and supervisors cannot fully trust an automated triage step unless they know,
  with certainty, that the known-dangerous patterns and the agent's own uncertainty always
  push a decision toward more scrutiny, never less.

## Target User & Persona

- **Who:** AML investigators who act on the triage outcome, and the supervisors / auditors
  accountable for every disposition.
- **Context:** They rely on the triage step to sort each alert to the right level of review.
  They need confidence that the sorting is safe before they trust it at volume.
- **Current workaround:** Manual re-checking of "easy" closes for obvious red flags — slow,
  inconsistent, and dependent on which analyst is on shift.

## Goals

- Force any alert that hits a deterministic red-flag trigger onto the high-risk route,
  overriding any lower tier the agent assigned.
- Send any alert the agent is not at least 85% confident is low risk up to a human instead
  of letting it auto-close.
- Make the override unmistakable in the decision record: show that the tier was forced and
  which trigger(s) caused it, so the override is visible to anyone reviewing later.

## Non-Goals

- **What the high-risk route does next** — the independent challenger review and senior /
  enhanced-due-diligence (EDD) sign-off are covered by the maker–checker challenger story,
  not here.
- **The agent's own reasoning and citation checks** — produced by the Core triage slice.
- **Low-risk batch sign-off and sampling QA** — covered by the low-risk auto-disposition
  story. This story only decides whether an alert is *allowed* to stay low risk.

## User Workflow

> The step-by-step experience from the investigator's and supervisor's perspective. The
> override happens automatically; what matters to the user is what they then see.

1. **An alert has been assessed** — The agent has gathered the evidence and produced a
   recommendation, a risk tier, and a confidence level.
2. **The safety check runs automatically** — The system checks the alert against the
   red-flag trigger list and against the confidence floor before the tier is allowed to stand.
3. **A red flag, if present, wins** — If any red-flag trigger fired, the alert is placed on
   the high-risk route even if the agent called it low or medium risk.
4. **Uncertainty is escalated** — If no red flag fired but the agent's confidence in a
   low-risk call is below 85%, the alert is routed to a human rather than auto-closed.
5. **The investigator opens the case** — They see the final route, and where an override
   happened they see a clear statement that the tier was forced, the original tier the agent
   proposed, and exactly which trigger(s) caused the override.
6. **The record stands up later** — A supervisor or auditor reviewing the decision can see
   the override happened, why, and that no dangerous or uncertain alert slipped through to
   closure.

## Acceptance Criteria

> Scenarios are written from the user's perspective. The red-flag list, the high-risk route,
> the 85% confidence floor, and the decision record are shared business rules from the epic
> overview.

### Scenario: A sanctions hit forces high risk even when the agent said low

```gherkin
Given an alert on customer "Mercer Trading Ltd" has been assessed
  And the agent recommended "close — low risk" with 88% confidence
  And screening returned a sanctions-list match on the counterparty "Volkov Holdings"
When the safety check runs on the alert
Then the alert is placed on the high-risk route
  And the alert is not allowed to be auto-dispositioned as low risk
  And the decision record states the tier was forced to high risk by a red-flag trigger
  And the decision record names the trigger as a sanctions-list match on "Volkov Holdings"
  And the decision record shows the agent's original recommendation of "close — low risk"
```

### Scenario: A structuring pattern forces high risk

```gherkin
Given an alert on customer "Dana Okonkwo" has been assessed
  And the agent recommended "close — low risk" with 90% confidence
  And the account shows three transfers within five days
    | Date         | Amount    |
    | 02 June 2026 | RM24,000  |
    | 04 June 2026 | RM24,500  |
    | 06 June 2026 | RM23,800  |
When the safety check runs on the alert
Then the alert is placed on the high-risk route
  And the alert is not allowed to be auto-dispositioned as low risk
  And the decision record states the tier was forced to high risk by a red-flag trigger
  And the decision record names the trigger as a structuring pattern of three transactions just under the RM25,000 cash-transaction-report threshold within a 7-day window
```

### Scenario: An agent low-risk call below the confidence floor is routed to a human

```gherkin
Given an alert on customer "Priya Anand" has been assessed
  And no red-flag trigger fired on the alert
  And the agent recommended "close — low risk" with 70% confidence
When the safety check runs on the alert
Then the alert is routed to a human for review
  And the alert is not auto-dispositioned as low risk
  And the decision record states the alert was escalated because the agent's confidence was below the 85% floor for auto-disposition
```

### Scenario: An agent low-risk call above the confidence floor is allowed to stay low

```gherkin
Given an alert on customer "Thomas Bauer" has been assessed
  And no red-flag trigger fired on the alert
  And the agent recommended "close — low risk" with 92% confidence
When the safety check runs on the alert
Then the alert is allowed to remain on the low-risk route
  And the decision record states the alert met the 85% confidence floor for auto-disposition
  And the decision record records that no red-flag trigger fired
```

### Scenario: A low-risk call exactly at the confidence floor is allowed to stay low

```gherkin
Given an alert on customer "Lena Rossi" has been assessed
  And no red-flag trigger fired on the alert
  And the agent recommended "close — low risk" with exactly 85% confidence
When the safety check runs on the alert
Then the alert is allowed to remain on the low-risk route
  And the decision record states the alert met the 85% confidence floor for auto-disposition
```

### Scenario: A red flag overrides even a confident high-floor low-risk call

```gherkin
Given an alert on customer "Atlas Freight Co" has been assessed
  And the agent recommended "close — low risk" with 96% confidence
  And screening returned a politically-exposed-person match on the customer's beneficial owner "Hassan Farouk"
When the safety check runs on the alert
Then the alert is placed on the high-risk route
  And the high confidence does not keep the alert on the low-risk route
  And the decision record states the tier was forced to high risk by a red-flag trigger
  And the decision record names the trigger as a politically-exposed-person match on "Hassan Farouk"
```

### Scenario: Multiple red-flag triggers are all recorded

```gherkin
Given an alert on customer "Northwind Exports" has been assessed
  And the agent recommended "review — medium risk" with 60% confidence
  And screening returned a sanctions-list match on the counterparty "Sable Logistics"
  And the counterparty is registered in a jurisdiction on the international high-risk call-to-action list
When the safety check runs on the alert
Then the alert is placed on the high-risk route
  And the decision record lists every red-flag trigger that fired
    | Trigger fired                                                  |
    | Sanctions-list match on counterparty "Sable Logistics"         |
    | Counterparty in a high-risk call-to-action jurisdiction        |
```

### Scenario: A medium-risk call below the floor without a red flag stays on its route

```gherkin
Given an alert on customer "Greenfield Realty" has been assessed
  And no red-flag trigger fired on the alert
  And the agent recommended "review — medium risk" with 55% confidence
When the safety check runs on the alert
Then the alert is routed to a human on the medium-risk route
  And the alert is not forced onto the high-risk route by the confidence floor
  And the alert is not auto-dispositioned as low risk
```

### Scenario Outline: Each red-flag trigger type forces the high-risk route and is recorded

```gherkin
Given an alert on customer "<customer>" has been assessed
  And the agent recommended "close — low risk" with 91% confidence
  And the alert presents "<red flag condition>"
When the safety check runs on the alert
Then the alert is placed on the high-risk route
  And the alert is not allowed to be auto-dispositioned as low risk
  And the decision record names the trigger as "<recorded trigger>"

Examples:
  | customer            | red flag condition                                                                                 | recorded trigger                                          |
  | Mercer Trading Ltd  | a sanctions-list match on the customer                                                              | Sanctions-list match on the customer                      |
  | Atlas Freight Co    | a politically-exposed-person match on the beneficial owner                                          | Politically-exposed-person match                          |
  | Dana Okonkwo        | three transfers of RM24,000, RM24,500 and RM23,800 within a 7-day window                            | Structuring pattern under the RM25,000 cash-transaction-report threshold |
  | Northwind Exports   | a counterparty registered in a jurisdiction on the international high-risk call-to-action list      | Counterparty in a high-risk call-to-action jurisdiction   |
  | Greenfield Realty   | an internal watchlist match on the customer                                                         | Internal watchlist match                                  |
```

### Scenario Outline: The confidence floor decides whether a clean low-risk call may auto-dispose

```gherkin
Given an alert on customer "<customer>" has been assessed
  And no red-flag trigger fired on the alert
  And the agent recommended "close — low risk" with <confidence>% confidence
When the safety check runs on the alert
Then the alert is "<outcome>"

Examples:
  | customer       | confidence | outcome                                    |
  | Thomas Bauer   | 92         | allowed to remain on the low-risk route    |
  | Lena Rossi     | 85         | allowed to remain on the low-risk route    |
  | Sam Patel      | 84         | routed to a human for review               |
  | Priya Anand    | 70         | routed to a human for review               |
  | Omar Haddad    | 50         | routed to a human for review               |
```

## Business Rules & Constraints

- **Red-flag triggers force high risk.** If any one of the following fires, the alert goes
  to the high-risk route regardless of the agent's tier or confidence: a sanctions-list
  match on the customer or a counterparty; a politically-exposed-person (PEP) match; a
  structuring pattern (three or more transactions each just under the RM25,000
  cash-transaction-report threshold within a 7-day window); a counterparty in a jurisdiction on the international
  high-risk call-to-action list; or an internal watchlist match.
- **The confidence floor is 85%.** An alert may stay on the low-risk route and be
  auto-dispositioned only when the agent's confidence in a low-risk call is at least 85%.
  At exactly 85% it qualifies; below 85% it is routed to a human.
- **The two checks are independent, and the safer outcome always wins.** A red-flag trigger
  forces high risk even when confidence is well above the floor. The confidence floor only
  affects whether a clean (no red flag) low-risk call may auto-dispose; it never forces a
  medium-risk alert up to high risk.
- **Uncertainty never resolves downward.** No combination of inputs allows a red-flagged or
  below-floor alert to be quietly closed as low risk.
- **The override must be visible.** Whenever a red flag forces the tier, the decision record
  must state that the tier was forced, show the agent's original proposed tier, and name
  every trigger that fired. Whenever the confidence floor escalates a low-risk call, the
  record must say so.

## Success Metrics

- **Zero quiet down-grades:** 100% of alerts that hit a red-flag trigger are placed on the
  high-risk route, regardless of the agent's recommendation.
- **Uncertainty escalation:** 100% of low-risk calls below 85% confidence are routed to a
  human rather than auto-dispositioned.
- **Override visibility:** 100% of forced-tier decisions show, in the record, that the tier
  was forced and which trigger(s) fired — verifiable by an auditor without help from the
  team.

## Dependencies

- **Core triage slice** — supplies each alert's recommendation, risk tier, and confidence
  level, and writes the decision record this story adds the override details to.
- **Screening and pattern indicators** — the sanctions, PEP, structuring, jurisdiction, and
  watchlist signals that the red-flag triggers read (engineered / synthetic for the
  demonstration, per the epic's data plan).
- **The high-risk route** — the destination this story sends forced alerts to; what that
  route then does is owned by the maker–checker challenger story.

## Open Questions

- [x] ~~What is the red-flag trigger list and the confidence-floor threshold?~~ —
  **Resolved:** the five triggers and the 85% floor are fixed in the epic's Shared Business
  Rules; demonstration defaults, tunable later.
- [x] ~~Does a tier exactly at the floor (85%) qualify for auto-disposition?~~ —
  **Resolved:** yes — "at least 85%" includes exactly 85%.
- [x] ~~Can the confidence floor force an alert all the way to high risk?~~ — **Resolved:**
  no — the floor only stops a clean low-risk call from auto-disposing and routes it to a
  human; only red-flag triggers force the high-risk route.

---

> **Technical sections (appended by `prd-refine`).** Everything above this line is the
> product-owner-approved business content and is unchanged. Everything below is the
> implementation contract for a developer or a `/build` subagent. This story **extends the
> deterministic gate built by the Core triage slice**
> ([spec-core-triage-slice.md](spec-core-triage-slice.md)): the core slice already built
> `DecisionGateApi/DecisionGate.json` with the citation validator + confidence floor (always
> routing `medium_signoff`); this story adds the **five red-flag detectors** and the
> **conservative-tiering / tier-override routing** into that same workflow, creates the
> `RedFlagTrigger` entity, sets the `DecisionRecord.TierWasForced` / `OriginalProposedTier`
> override fields, and wires the **high-risk branch** into the BPMN gateway. All shared
> entities, schemas, the deterministic gate rules, the error/outcome catalogue, the threat
> model, and the global negative constraints live in the epic overview's **# Technical
> Architecture (Shared)** section ([spec.md](spec.md)) and are referenced — never redefined —
> here. Platform decisions are fixed by
> [ADR 001](../../adr/001-low-code-agent-builder-for-triage-and-challenger.md)–[004](../../adr/004-batch-signoff-modeling.md);
> the deterministic-gate-outside-the-LLM choice is
> [ADR 002](../../adr/002-api-workflow-and-data-fabric-for-automation-and-audit-store.md).

## Functional Requirements

| # | Requirement | Detail | Maps to AC |
| - | ----------- | ------ | ---------- |
| FR-1 | **Five deterministic red-flag detectors** | `DecisionGate.json` evaluates all five triggers over the assembled bundle + the agent's `{risk_tier, confidence, recommendation, citations}`, with **no LLM**: (1) **sanctions** — a `screening` `EvidenceItem` whose `PayloadJson` carries a sanctions match on the customer or any counterparty; (2) **PEP** — a `screening` item carrying a politically-exposed-person match; (3) **structuring** — `≥3` transactions in `transaction_history` each with amount in the band `[22500, 25000)` MYR ("just under" the RM25,000 CTR threshold) within **any rolling 7-day window**; (4) **jurisdiction** — a `screening` item flagging a counterparty registered in a high-risk call-to-action jurisdiction; (5) **watchlist** — a `screening` item carrying an internal watchlist match. | Business Rules §1; Scenario Outline "Each red-flag trigger type…" |
| FR-2 | **Any one trigger forces high** | If **one or more** detectors fire, `final_risk_tier = "high"`, `tier_was_forced = true`, `route = "high_challenger"`, **overriding** the agent's tier and confidence — regardless of how confident or low the agent's call was (Mercer 88%, Atlas 96%). | Business Rules §1; "sanctions hit forces high"; "red flag overrides even a confident high-floor low-risk call" |
| FR-3 | **Every fired trigger is recorded** | One `RedFlagTrigger` row per detector that fires (`TriggerKind` + `TriggerDetail`); the gate response returns `red_flags[]` listing **all** of them. No fired trigger is dropped, even when another already forced high (Northwind: sanctions **and** jurisdiction → two rows, both in `red_flags[]`). | Business Rules "override must be visible"; "Multiple red-flag triggers are all recorded" |
| FR-4 | **Confidence floor (unchanged from core slice), red-flag check independent** | The floor still applies: a `low` call stays `low` only if `confidence ≥ 85` (exactly 85 qualifies); a clean (no red flag) `low` call `< 85` routes to a human on the **medium** path (`route = "medium_signoff"`, `CONFIDENCE_BELOW_FLOOR`). The floor **never forces high** and **never pushes a medium call up**. The two checks run **independently**; the **safer (more-scrutiny) outcome wins** (any red flag ⇒ high regardless of confidence). | Business Rules §2–3; "below the floor → human"; "exactly 85 stays low"; "medium below floor stays on its route" |
| FR-5 | **Uncertainty never resolves downward** | No combination of inputs lets a red-flagged or below-floor alert auto-dispose as low. Detectors and the floor can only **raise** scrutiny; the gate has no branch that lowers a tier. | Business Rules "uncertainty never resolves downward"; Success Metric "zero quiet down-grades" |
| FR-6 | **Override visibility on the record** | `AuditWrite` sets `DecisionRecord.TierWasForced` (true when any trigger fired), `OriginalProposedTier` (the agent's pre-override tier), `FinalRiskTier`, `RouteTaken`, and persists every `RedFlagTrigger` row — so an auditor sees the override, the original tier, and which trigger(s) caused it without help from the team. | Business Rules "override must be visible"; Success Metric "override visibility" |
| FR-7 | **Determinism (no LLM)** | All five detectors and the floor are pure `JsInvoke` JavaScript over structured inputs — string/number comparisons and the rolling-window scan. The agent never decides a red flag, the floor, or the final tier. | Overview Global Negative Constraints; ADR 002 |
| FR-8 | **Idempotency (re-run = same result, no duplicate rows)** | Re-running `DecisionGate` on identical inputs yields the identical `{red_flags, final_risk_tier, tier_was_forced, original_proposed_tier, route}` (pure function of inputs). `AuditWrite` is idempotent on `RedFlagTrigger` too: before inserting, it queries existing `RedFlagTrigger` rows for the alert and inserts only kinds not already present (re-runs do not double-write); `DecisionRecord` stays append-only (one row per alert, set by the core slice's existence query). | Determinism; overview append-only convention; idempotency in core slice §FR-6 |

## System Design

This story **edits the existing `DecisionGate.json`** (do not create a new workflow). The core
slice's `do[]` is `WorkflowStart → input guard → citation validator (`JsInvoke`) → insert
`CitationCheck` rows → confidence-floor route (`JsInvoke`, always `medium_signoff`) → `Response``.
This story inserts the red-flag detection between the citation validator and the routing step,
and **replaces the routing `JsInvoke`** with one that combines the red-flag result with the
confidence floor (safer-outcome-wins) and computes the override fields. The extended `do[]`:

| Step (new/edited) | Node | Type | What it does |
| ----------------- | ---- | ---- | ------------ |
| (core) | `Guard_ValidateInput` | `JsInvoke` | Unchanged — validates `evidence_bundle[]` + `agent_output` present and well-formed. |
| (core) | `Validate_Citations` | `JsInvoke` | Unchanged — citation validity; emits `validated_citations[]`. |
| **new** | `Detect_Sanctions` | `JsInvoke` | Scan `screening` items' `PayloadJson` for `sanctions_match` on customer/counterparty → push `{kind:"sanctions", detail}` if found. |
| **new** | `Detect_Pep` | `JsInvoke` | Scan `screening` items for `pep_match` → push `{kind:"pep", detail}`. |
| **new** | `Detect_Structuring` | `JsInvoke` | Rolling-window algorithm (below) over `transaction_history` amounts → push `{kind:"structuring", detail}` if a 7-day window holds `≥3` amounts in `[22500,25000)`. |
| **new** | `Detect_Jurisdiction` | `JsInvoke` | Scan `screening` items for `high_risk_jurisdiction` on a counterparty → push `{kind:"jurisdiction", detail}`. |
| **new** | `Detect_Watchlist` | `JsInvoke` | Scan `screening` items for `watchlist_match` → push `{kind:"watchlist", detail}`. |
| **edited** | `Compute_Route` | `JsInvoke` | Combine: `original_proposed_tier = agent.risk_tier`; if `red_flags.length > 0` ⇒ `final_risk_tier="high"`, `tier_was_forced=true`, `route="high_challenger"`; else apply the floor — `low` & `confidence<85` ⇒ `route="medium_signoff"` (`CONFIDENCE_BELOW_FLOOR`), `low` & `confidence≥85` ⇒ `route="low_batch"`, `medium`/`high` ⇒ their own routes; `final_risk_tier` = agent tier (floor never changes it). |
| (core) | `Response` | `Response` | Returns `{validated_citations[], has_unverified, red_flags[], final_risk_tier, tier_was_forced, original_proposed_tier, route}`. |

The five detectors run as independent `JsInvoke` steps, each appending to a `vars.Var_RedFlags`
array (a `Sequence`/`Assign` accumulator); they can be ordered in any sequence because firing is
order-independent (all fired triggers are recorded). `AuditWrite.json` then persists one
`RedFlagTrigger` per entry in `red_flags[]` and sets the override fields on `DecisionRecord`.
The BPMN `exclusiveGateway` on `=vars.Var_Route` (the core slice already added the
`medium_signoff` branch) gains a **`high_challenger` branch** so a forced alert lands on the
high-risk route; the high route's downstream behaviour (challenger, EDD sign-off) is owned by the
maker–checker story and is out of scope here.

**Structuring rolling-window algorithm (deterministic, in `Detect_Structuring`):** parse each
`transaction_history` entry to `{date, amountMYR}`; keep only amounts in the band
`amountMYR >= 22500 && amountMYR < 25000` (so RM24,999 counts, RM25,000 does **not**); sort the
kept transactions by date ascending; with a two-pointer sliding window, for each start index `i`
advance an end index `j` while `date[j] - date[i] <= 7 days`; if any window holds `≥3` kept
transactions (`j - i + 1 >= 3` inclusive), the trigger fires. "Within 7 days" is inclusive: 3
transactions spanning exactly 7 days fire; spanning 8 days do not.

```mermaid
flowchart TD
    A[DecisionGate input:<br/>evidence_bundle + agent_output] --> B[Validate_Citations<br/>JsInvoke - unchanged]
    B --> C{Run 5 detectors over bundle<br/>JsInvoke x5 - no LLM}
    C --> D[Detect_Sanctions]
    C --> E[Detect_Pep]
    C --> F["Detect_Structuring<br/>(rolling 7-day window,<br/>amount in [22500,25000))"]
    C --> G[Detect_Jurisdiction]
    C --> H[Detect_Watchlist]
    D --> I[Compute_Route<br/>JsInvoke]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J{any red_flag fired?}
    J -- yes --> K["final=high, tier_was_forced=true,<br/>route=high_challenger<br/>(TIER_FORCED_HIGH)"]
    J -- no --> L{agent tier == low?}
    L -- no --> M["route = tier's own route<br/>(medium_signoff)<br/>floor never pushes medium up"]
    L -- yes --> N{confidence >= 85?}
    N -- yes --> O[route = low_batch<br/>stays low]
    N -- no --> P["route = medium_signoff<br/>(CONFIDENCE_BELOW_FLOOR)"]
    K --> Q[Response: red_flags[], final_risk_tier,<br/>tier_was_forced, original_proposed_tier, route]
    M --> Q
    O --> Q
    P --> Q
    Q --> R["AuditWrite: insert RedFlagTrigger rows +<br/>set DecisionRecord.TierWasForced /<br/>OriginalProposedTier / FinalRiskTier / RouteTaken"]
```

**Tradeoffs.** The red-flag evaluation and the confidence floor live in a deterministic
`JsInvoke`-based API Workflow **outside** the LLM, per
[ADR 002](../../adr/002-api-workflow-and-data-fabric-for-automation-and-audit-store.md). The
rejected alternative is **letting the triage agent self-tier** — i.e. trusting the agent's own
`risk_tier`/`confidence` (and a prompt instruction "escalate on sanctions") to be the final word.
Rejected because: (a) an LLM can be **confidently wrong** (the exact failure this story exists to
catch — Mercer 88%, Atlas 96% on a sanctions/PEP hit); (b) it is **non-deterministic and
unauditable** — a regulator cannot be shown a fixed rule, only a probability; (c) it is
**vulnerable to prompt injection** in synthetic evidence text, which could coax the agent to
under-tier; and (d) the structuring rule is a precise arithmetic threshold (`≥3` in
`[22500,25000)` within 7 days) that an LLM cannot apply reliably. The deterministic gate is the
**hard backstop**: it only ever raises scrutiny, never lowers it.

## Threat Model Checklist

| Dimension | This story's delta |
| --------- | ------------------ |
| **Data classification** | N/A — see overview. Synthetic sanctions/PEP/jurisdiction/watchlist names (Volkov Holdings, Hassan Farouk, Sable Logistics) come from the engineered `data/evidence-overlay.json`; no PII, no real/anonymized-real data. |
| **Attack surface** | No new public routes and no new HITL form (the high route's form belongs to the challenger story). Adds five deterministic detector `JsInvoke` steps to an existing API Workflow; the only attacker-influenced input is the synthetic `screening`/`transaction_history` evidence text — which the detectors read structurally, not as free-form LLM input. |
| **Authn/authz** | N/A — see overview. |
| **Prompt injection / LLM tampering** | **This story is the named hard backstop** against a confidently-wrong or prompt-injected agent output. Even if injection coaxes the agent to return `risk_tier:"low", confidence:99` on a sanctions hit, the deterministic detectors force `high`/`high_challenger` and record the trigger — the manipulated tier cannot survive the gate. The gate only ever escalates; it has no downward branch (FR-5). |
| **Dependencies** | N/A — see overview, plus this story reads the engineered `data/evidence-overlay.json` overlay surfaced as `screening` `EvidenceItem`s; no new third-party packages. |

## API Design

> Extends `DecisionGateApi/DecisionGate.json` (do not create a new workflow). Request adds the
> bundle fields the detectors read (`category`, `payload`, transaction amounts/dates) and the
> agent's full `agent_output`; response adds `red_flags[]`, `tier_was_forced`,
> `original_proposed_tier`, and the `high_challenger` route value. Run/validate with
> `uip api-workflow run AuroraVerdict/DecisionGateApi/DecisionGate.json --input-arguments '{...}'`
> / `uip api-workflow validate AuroraVerdict/DecisionGateApi/DecisionGate.json`.

### Extended request shape

```json
{
  "alert_id": "<alert Id UUID>",
  "evidence_bundle": [
    { "evidence_id": "ALERT-2026-0150#EV-001", "category": "screening",
      "summary": "Sanctions screening", "payload": "{\"sanctions_match\":{\"entity\":\"Volkov Holdings\",\"role\":\"counterparty\"}}" },
    { "evidence_id": "ALERT-2026-0150#EV-002", "category": "transaction_history",
      "summary": "Recent transfers",
      "payload": "{\"transactions\":[{\"date\":\"2026-06-02\",\"amount_myr\":24000},{\"date\":\"2026-06-04\",\"amount_myr\":24500},{\"date\":\"2026-06-06\",\"amount_myr\":23800}]}" }
  ],
  "agent_output": { "risk_tier": "low", "confidence": 88, "recommendation": "close",
    "citations": ["ALERT-2026-0150#EV-001"] }
}
```

### Example 1 — sanctions force-high (Mercer Trading Ltd, agent said low @ 88%)

Request `agent_output`: `{ "risk_tier":"low", "confidence":88, ... }`; bundle has a `screening`
item with `sanctions_match` on counterparty `Volkov Holdings`. Response:
```json
{
  "validated_citations": [ { "evidence_id": "ALERT-2026-0150#EV-001", "outcome": "verified" } ],
  "has_unverified": false,
  "red_flags": [ { "kind": "sanctions", "detail": "Sanctions-list match on counterparty Volkov Holdings" } ],
  "final_risk_tier": "high",
  "tier_was_forced": true,
  "original_proposed_tier": "low",
  "route": "high_challenger"
}
```

### Example 2 — structuring force-high (Dana Okonkwo, agent said low @ 90%)

Bundle `transaction_history`: RM24,000 (02 Jun), RM24,500 (04 Jun), RM23,800 (06 Jun) — three
amounts in `[22500,25000)` within a 5-day (≤7-day) window. Response:
```json
{
  "validated_citations": [ ],
  "has_unverified": false,
  "red_flags": [ { "kind": "structuring", "detail": "3 transactions in [RM22,500, RM25,000) within a 7-day rolling window (2026-06-02..2026-06-06)" } ],
  "final_risk_tier": "high",
  "tier_was_forced": true,
  "original_proposed_tier": "low",
  "route": "high_challenger"
}
```

### Example 3 — below-floor route-to-human (Sam Patel, low @ 84%, no red flag)

`agent_output`: `{ "risk_tier":"low", "confidence":84, ... }`; no detector fires. Response:
```json
{
  "validated_citations": [ ],
  "has_unverified": false,
  "red_flags": [ ],
  "final_risk_tier": "low",
  "tier_was_forced": false,
  "original_proposed_tier": "low",
  "route": "medium_signoff"
}
```
> `route = "medium_signoff"` carries `CONFIDENCE_BELOW_FLOOR`: a clean low call below 85 goes to a
> human on the medium path. `final_risk_tier` stays `low` — the floor never forces high.

### Example 4 — at-floor stays-low (Lena Rossi, low @ exactly 85, no red flag)

`agent_output`: `{ "risk_tier":"low", "confidence":85, ... }`; no detector fires. Response:
```json
{
  "validated_citations": [ ],
  "has_unverified": false,
  "red_flags": [ ],
  "final_risk_tier": "low",
  "tier_was_forced": false,
  "original_proposed_tier": "low",
  "route": "low_batch"
}
```

### Example 5 — multiple triggers all recorded (Northwind Exports, agent said medium @ 60%)

Bundle has a `screening` item with `sanctions_match` on counterparty `Sable Logistics` **and** a
`high_risk_jurisdiction` flag on that counterparty. Response:
```json
{
  "validated_citations": [ ],
  "has_unverified": false,
  "red_flags": [
    { "kind": "sanctions", "detail": "Sanctions-list match on counterparty Sable Logistics" },
    { "kind": "jurisdiction", "detail": "Counterparty Sable Logistics registered in a high-risk call-to-action jurisdiction" }
  ],
  "final_risk_tier": "high",
  "tier_was_forced": true,
  "original_proposed_tier": "medium",
  "route": "high_challenger"
}
```
> Both triggers are returned and both become `RedFlagTrigger` rows; neither is dropped because the
> other already forced high.

### Error / outcome table (this story's additions; reuses shared codes)

| Code | Surfaced where | Meaning |
| ---- | -------------- | ------- |
| `TIER_FORCED_HIGH` | `DecisionGate` response `tier_was_forced=true` → `DecisionRecord.TierWasForced=true` | One or more red-flag detectors fired; the gate overrode the agent's tier to `high` and routed `high_challenger`. The fired triggers are in `red_flags[]` / `RedFlagTrigger` rows. |
| `CONFIDENCE_BELOW_FLOOR` | `DecisionGate` routing (`route=medium_signoff` on a clean `low` call) | A `low` call with `confidence < 85` and no red flag was routed to a human on the medium path; never forces high. |

## Data Model & Migrations

> Delta only. This story creates the **`RedFlagTrigger`** entity (defined in the overview's
> **## Shared Data Model**) and **sets** two `DecisionRecord` fields that the core slice created
> but left at defaults (`TierWasForced`, `OriginalProposedTier`). It does **not** create or alter
> any other entity. Create with `uip df entities create "RedFlagTrigger" --body '{...}' --output json`.

```jsonc
// RedFlagTrigger — one row per trigger that fired (overview ## Shared Data Model)
{ "displayName": "RedFlagTrigger", "fields": [
  { "name": "AlertLink", "dataType": "RELATIONSHIP", "referenceEntity": "Alert" },
  { "name": "TriggerKind", "dataType": "CHOICE_SET_SINGLE",
    "choiceSet": ["sanctions", "pep", "structuring", "jurisdiction", "watchlist"] },
  { "name": "TriggerDetail", "dataType": "STRING" } ] }
```

`DecisionRecord` fields this story populates (already created by the core slice — **do not
re-create the entity**): `TierWasForced` (BOOLEAN — true when `red_flags[].length > 0`),
`OriginalProposedTier` (CHOICE_SET_SINGLE `low`/`medium`/`high` — the agent's pre-override tier),
plus `FinalRiskTier` and `RouteTaken` set to the gate's `final_risk_tier` / `route`
(`high_challenger` when forced).

Notes:
- **CHOICE_SET value-by-NumberId (`TriggerKind`).** Like all `CHOICE_SET_SINGLE` fields,
  `RedFlagTrigger.TriggerKind` is written by the integer `NumberId` assigned to each value at
  create time — **not** the string label. After `entities create`, run
  `uip df entities get "RedFlagTrigger" --output json` to capture the mapping
  (`sanctions`→NumberId, `pep`→NumberId, `structuring`→NumberId, `jurisdiction`→NumberId,
  `watchlist`→NumberId) and have `AuditWrite` insert the matching `NumberId`. Same applies to the
  `DecisionRecord.OriginalProposedTier` / `FinalRiskTier` / `RouteTaken` choice values.
- **Relationships** (`AlertLink`) store the parent `Alert`'s `Id` UUID.
- **No update/delete of `DecisionRecord`** (append-only). The override fields are set on the single
  insert the core slice's existence query controls; this story passes them in rather than updating
  an existing row.

## Architecture Notes

- **Extends `DecisionGate.json`, does not replace it.** The five detector `JsInvoke` steps and the
  combined routing step are added to the **existing** `AuroraVerdict/DecisionGateApi/DecisionGate.json`
  authored by the core slice; the citation validator and `CitationCheck` writes are untouched.
- **Signals are sourced from the engineered overlay.** Sanctions / PEP / jurisdiction / watchlist
  indicators originate in `data/evidence-overlay.json`, injected by `EvidenceGather` as `screening`
  `EvidenceItem`s (`PayloadJson` carries the structured match); the structuring detector computes
  over the `transaction_history` `EvidenceItem`. The detectors read the assembled bundle — they do
  not call any external screening service.
- **The gate runs post-assessment.** The safety check runs **after** the agent has assessed,
  reading the assembled bundle plus the agent's `{risk_tier, confidence, recommendation,
  citations}`. (The discovery brief's "red-flag gateway first" sketch is superseded — sanctions /
  PEP / structuring all need the gathered bundle, so the gate runs after the agent in the BPMN
  spine, exactly where the core slice placed it.)
- **CLI-derived files are not hand-edited** (`bindings_v2.json`, `entry-points.json`,
  `operate.json`, `package-descriptor.json`, the `.uipx` manifest) — reconciled by
  `uip … refresh` / `uip solution resources refresh` (overview Global Negative Constraints).

## Implementation Plan

> Sizes: S ≤ ~2h, M ≈ half-day, L ≈ full day. INDEPENDENT tasks can be built in parallel once
> their inputs exist; tasks editing the same file or wiring downstream of others are SEQUENTIAL.
> All file paths are under the `AuroraVerdict/` solution root.

| # | Sub-task | Files / commands | Size | Dependency |
| - | -------- | ---------------- | ---- | ---------- |
| 1 | Create the `RedFlagTrigger` entity | `uip df entities create "RedFlagTrigger" --body '{...}' --output json` (body above); then `uip df entities get "RedFlagTrigger" --output json` to capture `TriggerKind` NumberIds | S | INDEPENDENT (after core slice's `Alert` entity exists) |
| 2 | Implement the 5 detector `JsInvoke` steps | `AuroraVerdict/DecisionGateApi/DecisionGate.json` — add `Detect_Sanctions`, `Detect_Pep`, `Detect_Jurisdiction`, `Detect_Watchlist` (scan `screening` `payload` for `sanctions_match`/`pep_match`/`high_risk_jurisdiction`/`watchlist_match`) and `Detect_Structuring` (rolling 7-day window over `transaction_history`, band `[22500,25000)`), each appending to `vars.Var_RedFlags` | L | SEQUENTIAL (after the core slice's `DecisionGate.json` exists; edits that file) |
| 3 | Implement routing + override-field computation | `AuroraVerdict/DecisionGateApi/DecisionGate.json` — replace `Compute_Route` to combine red-flag result with the confidence floor (safer-outcome-wins), set `final_risk_tier`/`tier_was_forced`/`original_proposed_tier`/`route`; extend the final `Response` to return `red_flags[]` and the override fields | M | SEQUENTIAL (after 2; same file) |
| 4 | Extend `AuditWrite.json` to persist triggers + override fields | `AuroraVerdict/AuditWriteApi/AuditWrite.json` — for each entry in `red_flags[]` insert a `RedFlagTrigger` row (idempotent: skip kinds already present for the alert; `TriggerKind` by NumberId); set `DecisionRecord.TierWasForced`/`OriginalProposedTier`/`FinalRiskTier`/`RouteTaken` on the single insert | M | SEQUENTIAL (after 1 and 3) |
| 5 | Wire the `high_challenger` branch into the BPMN gateway | `AuroraVerdict/TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn` — add an outgoing `bpmn:sequenceFlow` from the existing `=vars.Var_Route` `exclusiveGateway` with `bpmn:conditionExpression` `=vars.Var_Route == "high_challenger"` to the high-route entry node (a stub/placeholder node owned by the challenger story); leave the `medium_signoff` branch from the core slice intact | M | SEQUENTIAL (after 3; gateway exists from core slice) |
| 6 | Reconcile + validate + repackage | `uip solution resources refresh`; `uip api-workflow validate AuroraVerdict/DecisionGateApi/DecisionGate.json`; `uip api-workflow validate AuroraVerdict/AuditWriteApi/AuditWrite.json`; `uip maestro bpmn validate AuroraVerdict/TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn`; `uip solution pack ./AuroraVerdict ./output -v <ver>`; `uip solution publish`; `uip solution deploy run …` | M | SEQUENTIAL (last) |

## Negative Constraints

- Do **not** let the LLM decide tiers, red flags, or the confidence floor — all five detectors and
  the floor are deterministic `JsInvoke` logic in `DecisionGate.json` (overview Global Negative
  Constraints; ADR 002). The agent's `risk_tier`/`confidence` are **inputs** to the gate, never the
  final word.
- Do **not** let the confidence floor force high or push a medium call up. The floor only stops a
  clean `low` call below 85 from auto-disposing (→ `medium_signoff`); only red-flag triggers force
  `high`/`high_challenger`. `final_risk_tier` from the floor branch equals the agent's tier.
- Do **not** silently drop any fired trigger. **Every** detector that fires produces a `red_flags[]`
  entry **and** a `RedFlagTrigger` row — including when another trigger already forced high
  (Northwind: both sanctions and jurisdiction recorded).
- Do **not** change the core slice's citation-validation behaviour. `Validate_Citations` and the
  `CitationCheck` writes are untouched; this story only **adds** the red-flag steps and the combined
  routing, and **extends** the `Response`.
- Do **not** count an amount of exactly RM25,000 (or above) toward structuring — the band is
  `[22500, 25000)`, half-open at the top (RM24,999 counts, RM25,000 does not). Do **not** treat the
  7-day window as exclusive — exactly 7 days apart still counts.
- Do **not** create or re-create the `DecisionRecord` entity (core slice owns it) and do **not**
  `update`/`delete` it — append-only; the override fields are set on the controlled insert.
- Do **not** hand-edit CLI-derived files; do **not** use real or anonymized-real data; do **not**
  auto-file a regulatory report.

## Test Scenarios

> Implementation-level boundary checks against `DecisionGate.json` output and the written records,
> using this story's own customers/values. Each lists the crafted input and the expected gate output.

1. **Structuring window edge — exactly 7 days vs 8 days.** Run `Detect_Structuring` with three
   in-band amounts (RM24,000 / RM24,500 / RM23,800).
   - **Spans exactly 7 days** (2026-06-01, 2026-06-04, 2026-06-08): window `2026-06-01..2026-06-08`
     = 7 days inclusive → **fires**. Expected: `red_flags:[{"kind":"structuring",...}]`,
     `final_risk_tier:"high"`, `tier_was_forced:true`, `route:"high_challenger"`.
   - **Spans 8 days** (2026-06-01, 2026-06-05, 2026-06-09): no 7-day window holds all three →
     **does not fire**. Expected (agent low @ 90): `red_flags:[]`, `final_risk_tier:"low"`,
     `tier_was_forced:false`, `route:"low_batch"`.
2. **Structuring amount boundary — RM25,000 NOT counted, RM24,999 counted.** Three transactions
   within 3 days valued RM24,999 / RM24,999 / RM25,000.
   - Only the two RM24,999 are in-band (`< 25000`); RM25,000 is excluded → **2 in band, does not
     fire**. Expected: `red_flags:[]`.
   - Change the RM25,000 to RM24,999 → **3 in band, fires**. Expected:
     `red_flags:[{"kind":"structuring",...}]`, `route:"high_challenger"`, `tier_was_forced:true`.
3. **Confidence floor 84 vs 85 vs 92 (clean low call, no red flag).**
   - **84** (Sam Patel): `route:"medium_signoff"`, `final_risk_tier:"low"`, `tier_was_forced:false`
     (`CONFIDENCE_BELOW_FLOOR`).
   - **85** (Lena Rossi): `route:"low_batch"`, `final_risk_tier:"low"`, `tier_was_forced:false`.
   - **92** (Thomas Bauer): `route:"low_batch"`, `final_risk_tier:"low"`, `tier_was_forced:false`.
4. **Sanctions forces high despite 96%.** Agent `{risk_tier:"low", confidence:96}` with a
   `screening` `sanctions_match` on the customer (Mercer Trading Ltd). Expected:
   `red_flags:[{"kind":"sanctions",...}]`, `final_risk_tier:"high"`, `tier_was_forced:true`,
   `original_proposed_tier:"low"`, `route:"high_challenger"` — the high confidence does **not** keep
   it low.
5. **Multiple triggers all recorded.** Northwind Exports — `screening` carries `sanctions_match` on
   `Sable Logistics` **and** `high_risk_jurisdiction` on the same counterparty; agent
   `{risk_tier:"medium", confidence:60}`. Expected `red_flags[]` has **both** entries
   (`sanctions` + `jurisdiction`), `final_risk_tier:"high"`, `tier_was_forced:true`,
   `original_proposed_tier:"medium"`, `route:"high_challenger"`; after `AuditWrite`, two
   `RedFlagTrigger` rows exist for the alert.
6. **Idempotent re-run.** Re-run `DecisionGate` with the Northwind input — identical output JSON;
   re-run `AuditWrite` with the same `red_flags[]` — `RedFlagTrigger` row count for the alert stays
   at 2 (no duplicates), `DecisionRecord` row count stays at 1.

## Verification

> No web E2E framework. Verify with the `uip` CLI against the running solution, exercising each
> detector and each boundary.

- **Sanctions force-high (Mercer):**
  `uip api-workflow run AuroraVerdict/DecisionGateApi/DecisionGate.json --input-arguments '{"alert_id":"<mercer-id>","evidence_bundle":[{"evidence_id":"ALERT-2026-0150#EV-001","category":"screening","payload":"{\"sanctions_match\":{\"entity\":\"Volkov Holdings\",\"role\":\"counterparty\"}}"}],"agent_output":{"risk_tier":"low","confidence":88,"recommendation":"close","citations":[]}}'`
  — expect `final_risk_tier:"high"`, `tier_was_forced:true`, `route:"high_challenger"`, one
  `sanctions` entry in `red_flags`.
- **Structuring force-high (Dana, ≤7-day window):** run with `transaction_history` payload holding
  RM24,000 (02 Jun) / RM24,500 (04 Jun) / RM23,800 (06 Jun), agent low @ 90 — expect a `structuring`
  red flag and `route:"high_challenger"`.
- **Structuring boundary (does NOT fire):** rerun with dates 8 days apart, or one amount RM25,000 —
  expect `red_flags:[]`, `route:"low_batch"`.
- **Confidence floor boundaries:** run the clean-low input with `confidence` 84, 85, 92 in turn —
  expect `medium_signoff` (84), `low_batch` (85), `low_batch` (92), all `final_risk_tier:"low"`,
  `tier_was_forced:false`.
- **Multiple triggers (Northwind):** run with both `sanctions_match` and `high_risk_jurisdiction` in
  the `screening` payload — expect two entries in `red_flags[]`.
- **BPMN lands on the high route:**
  `uip maestro bpmn debug AuroraVerdict/TriageOrchestrationBpmn/TriageOrchestrationBpmn.bpmn --inputs @inputs-mercer.json`
  (a Mercer alert that hits sanctions) — confirm the `=vars.Var_Route` gateway takes the
  `high_challenger` branch (not `medium_signoff`).
- **Record assertions:**
  `uip df records query "RedFlagTrigger" --filter "AlertLink eq <northwind-id>"` — expect exactly
  two rows (`TriggerKind` = `sanctions` and `jurisdiction`);
  `uip df records query "RedFlagTrigger" --filter "AlertLink eq <mercer-id>"` — one `sanctions` row;
  `uip df records query "DecisionRecord" --filter "AlertLink eq <mercer-id>"` — one row with
  `TierWasForced = true`, `OriginalProposedTier = low`, `FinalRiskTier = high`,
  `RouteTaken = high_challenger`;
  `uip df records query "DecisionRecord" --filter "AlertLink eq <lena-id>"` — `TierWasForced = false`,
  `FinalRiskTier = low`, `RouteTaken = low_batch`;
  `uip df records query "RedFlagTrigger" --filter "AlertLink eq <lena-id>"` — zero rows. Re-run the
  Northwind `AuditWrite` and re-query `RedFlagTrigger` — still exactly two rows (idempotency).
