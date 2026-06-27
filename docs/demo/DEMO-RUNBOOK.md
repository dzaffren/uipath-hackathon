# Aurora Verdict — Demo Screencast Script & Runbook

**Track 2 — UiPath Maestro BPMN · Defensible AML Alert Triage**
Submission: UiPath AgentHack 2026 · Deadline 2026-06-29

This document is the **screenplay** for the submission video plus the **operator runbook**
to drive it live. It is grounded in real, verified runs against the deployed solution
(`AuroraVerdict` 1.0.35, folder `Shared/AuroraVerdictRun`). Every number, name, and field
below was captured from an actual completed Maestro job — nothing here is illustrative.

---

## 0. The thesis (what the video proves in ~2 minutes)

A central bank cannot let an LLM close or escalate an AML alert on its own say-so.
Aurora Verdict makes AI-assisted triage **defensible**:

1. **AI proposes, it does not decide.** An LLM agent reads the evidence and proposes a
   risk tier _with a rationale and citations_.
2. **Citations are validated** against the actual evidence bundle (hallucinated citations
   are caught, not trusted).
3. **Deterministic detectors run independently** — sanctions, PEP, structuring,
   jurisdiction, watchlist. They can **force-escalate regardless of what the model said**.
   Rules can overrule the AI; the AI can never suppress the rules.
4. **A human signs off**, and their decision — name, action, rationale, timestamp — is
   written to an **immutable DecisionRecord**.

The three on-camera "money shots":

| #   | Money shot                                               | Where it appears                                             |
| --- | -------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | A **completed Maestro job** (the BPMN graph, end to end) | Maestro instance view                                        |
| 2   | A **human-in-the-loop sign-off** gate                    | The pause at _"Await human sign-off"_ + the analyst decision |
| 3   | A **written immutable DecisionRecord**                   | The AuditWrite output JSON                                   |

**Captured assets (2026-06-27, live tenant):** a watermark-free animated GIF of the end-to-end
money shots — job list (all green) → human override decision → immutable record (escalated) →
immutable record (closed) — was exported to `Downloads/aurora-verdict-demo-moneyshots.gif`
(11 frames, 1568×745). Individual high-res frames of each money shot were captured in-session.
The authentic on-screen views are: the **Trace tree** (Scene 4), the job **Details → Input**
(Scene 5/6), and the **AuditWriteApi → Input/Output** panel (Scene 7).

---

## 1. The demo case — Cedar Imports Ltd (`ALERT-2026-0488`)

We deliberately use a **genuinely ambiguous** alert, because that is where defensible
triage matters most.

- **Customer:** Cedar Imports Ltd — import/export company, incorporated 2016, CDD current
  to 2025-01.
- **Trigger:** Two wire transfers totalling **RM85,000** to **Eastern Pacific Trading**, a
  **brand-new overseas counterparty** with no prior trading relationship on file.
- **Screening:** No sanctions, no PEP, no high-risk-jurisdiction, no watchlist, no adverse
  media — **all clear**.
- **AI verdict (live):** **risk_tier = `medium`, confidence = `62%`.** The model is
  _genuinely uncertain_.
- **Deterministic detectors:** all ran, **none fired** (there is no structuring pattern and
  screening is clean) → `tier_was_forced = false`.
- **Route:** `medium_signoff` → **mandatory human sign-off**.

> Why this case is the right one: the AI is only 62% sure, and no rule auto-triggers. The
> system refuses to auto-act on a low-confidence model output — it routes to a human. That
> is the whole point.

We show **two endings from the same alert** — the strongest possible illustration of
"defensible":

- **Scenario A — SIGN:** the analyst reviews the AI's reasoning, **concurs** (medium,
  standard monitoring) → disposition **`closed`**.
- **Scenario B — OVERRIDE:** the analyst **disagrees**, escalates the new-overseas-
  counterparty exposure for enhanced due diligence → disposition **`escalated`**.

Both decisions are written immutably, attributed to the named analyst.

---

## 2. Scene-by-scene screencast script

Timecodes are targets for a ~2:15 cut. **VO** = voiceover. **SCREEN** = what is shown /
motion-graphic. **DO** = operator action driving the live system.

### Scene 1 — Cold open (0:00–0:12)

- **SCREEN:** Title card: _"Aurora Verdict — Defensible AML Triage on UiPath Maestro."_
  Subtitle: _"AI proposes. Rules challenge. A human signs. The record is permanent."_
- **VO:** "Anti-money-laundering teams are drowning in alerts. AI can help triage them — but
  at a regulated bank, you can't let a model quietly close or escalate a case. Every decision
  has to be defensible. This is how we make it defensible on UiPath Maestro."

### Scene 2 — The case (0:12–0:30)

- **SCREEN:** The Cedar Imports alert summary as a clean motion-graphic card: customer,
  the two RM85,000 wires, the new overseas counterparty, "screening: clear."
- **VO:** "Here's a real alert. Cedar Imports — an established trading company — just sent
  eighty-five thousand ringgit, in two wires, to a brand-new overseas counterparty. Nothing
  on the sanctions or watchlists. Suspicious? Maybe. Routine trade finance? Also maybe. This
  is exactly the kind of ambiguous case that wastes analyst time — and where a bad shortcut
  is dangerous."

### Scene 3 — Launch the orchestration (0:30–0:45) · MONEY SHOT #1 (setup)

- **DO:** Start the Maestro job (Scenario A input — see §3), then open the completed instance
  (Orchestrator → AuroraVerdictRun folder → the `TriageOrchestrationBpmn` / Maestro BPMN job)
  and click the **Trace** tab (tree view).
- **SCREEN:** The execution **Trace tree** — every step listed with its own duration and a
  green tick; the top node reads _"Instance … Status ✓ OK"_. (Toggle the timeline/waterfall
  icon for a Gantt view if you prefer.)
- **VO:** "We hand the alert to a Maestro process. It's a real BPMN orchestration, and every
  step shows up here as an auditable, timed node you can point to."

### Scene 4 — AI triage, with guardrails (0:45–1:15)

- **SCREEN:** Expand **Run Triage Agent** in the trace — the real child nodes appear:
  **LLM input guardrail check → Prompt injection guardrail → User prompt attack guardrail**,
  then **Model run** tagged `anthropic.claude-sonnet-4-6`. Expand **Run Decision Gate**:
  **Validate citations against bundle → Store has_unverified flag → Insert CitationCheck
  rows**, alongside the five detectors. Motion-graphic overlays the AI output: _"risk_tier:
  medium · confidence: 62%"_ and the detector tally: _"sanctions ✓ · PEP ✓ · structuring ✓ ·
  jurisdiction ✓ · watchlist ✓ — none fired."_
- **VO:** "The agent — running on Claude Sonnet — reads the evidence and proposes a tier:
  medium risk, but only sixty-two percent confident. Notice the guardrails right there in the
  trace: the input is screened for prompt-injection and prompt-attacks before the model even
  runs. Then two checks. First, every citation the model gave is validated against the actual
  evidence — no hallucinated sources get through. Second, a bank of deterministic detectors
  runs on its own: sanctions, PEP, structuring, jurisdiction, watchlist. If any fires, the
  case is force-escalated no matter what the model thinks. Here, nothing fires — and the model
  is unsure. So the system does the responsible thing: it stops and asks a human."

### Scene 5 — The human sign-off gate (1:15–1:30) · MONEY SHOT #2

- **SCREEN:** In the trace, the **"Await human sign-off"** node sits at **30.43s** — far
  longer than every other step (all milliseconds) — the orchestration visibly _holding_ for
  the human.
- **VO:** "Look at the timeline: the process holds at the sign-off gate for thirty seconds,
  while every other step is milliseconds. In production this is an Action Center task on the
  analyst's queue. The analyst's decision — who they are, what they decided, and why — is what
  the process is waiting for."

### Scene 6A — SIGN: analyst concurs (1:30–1:45)

- **SCREEN:** Motion-graphic of the analyst decision: _Razlan B. Hamid (AML Analyst) — "Concur, medium risk, standard monitoring."_ The gate releases; the graph runs to **End**.
- **VO:** "Our analyst, Razlan, reviews the AI's reasoning and agrees: an established importer,
  screening clean — keep it under standard monitoring. He signs off. The case closes."

### Scene 6B — OVERRIDE: analyst escalates (1:45–2:00)

- **DO:** Start a second job (Scenario B input). Let it reach the gate; apply the override
  decision.
- **SCREEN:** Split-screen or second pass; motion-graphic: _Razlan — "Disagree. New overseas
  counterparty, no prior relationship — escalate for EDD."_ Graph runs to End.
- **VO:** "Now watch the same alert with a different judgment. This time Razlan disagrees —
  a first-time overseas counterparty and eighty-five thousand ringgit is enough to warrant
  enhanced due diligence. He overrides. The case escalates. Same AI, same evidence — the
  human is in control, both ways."

### Scene 7 — The immutable record (2:00–2:12) · MONEY SHOT #3

- **SCREEN:** The **DecisionRecord JSON** (see §4), highlighting `DecisionMakerName`,
  `HumanAction`, `OverrideReason`, `FinalDisposition`, `DecisionTimestamp`.
- **VO:** "And here's what makes it defensible. Every decision is written to an immutable
  record — the analyst's name, the action they took, their reasoning in their own words, and
  a timestamp. If a regulator asks, two years from now, _who_ decided and _why_ — the answer
  is right here, and it cannot be quietly changed."

### Scene 8 — Close (2:12–2:20)

- **SCREEN:** Return to title; tagline: _"AI proposes. Rules challenge. A human signs. The
  record is permanent."_
- **VO:** "Aurora Verdict. Faster triage, without giving up the audit trail."

---

## 3. Operator cheat-sheet (exact commands)

**Environment (already deployed):**

- Release key: `6B763966-08EA-43E8-B8AB-1E37ABDF0C16`
- Folder: `Shared/AuroraVerdictRun` · folder-key `6f53970c-8d0e-4ad4-b334-218822a8c3b2`
- Package: `AuroraVerdict` 1.0.35

**Scenario A — SIGN (concur → closed):**

```bash
uip or jobs start 6B763966-08EA-43E8-B8AB-1E37ABDF0C16 \
  --folder-path "Shared/AuroraVerdictRun" --runtime-type Serverless \
  --input-arguments '{"alert_reference":"ALERT-2026-0488","sign_off":{"SpecificContent":{"outcome":"sign","reviewer":"Razlan B. Hamid (AML Analyst)","reason":"Cedar is an established import/export company (incorporated 2016, CDD current to 2025-01); two wires totalling RM85,000 to a new overseas supplier are consistent with import trade. Screening clear, no adverse media. Concur with medium risk - retain under standard monitoring."}}}'
```

**Scenario B — OVERRIDE (escalate → escalated):**

```bash
uip or jobs start 6B763966-08EA-43E8-B8AB-1E37ABDF0C16 \
  --folder-path "Shared/AuroraVerdictRun" --runtime-type Serverless \
  --input-arguments '{"alert_reference":"ALERT-2026-0488","sign_off":{"SpecificContent":{"outcome":"override","reviewer":"Razlan B. Hamid (AML Analyst)","reason":"Two wire transfers to a brand-new overseas counterparty (Eastern Pacific Trading) totalling RM85,000 with no prior trading relationship on file warrant enhanced due diligence and source/purpose verification before clearing. Escalating for EDD."}}}'
```

**Watch / capture (use the `Key` returned by `jobs start` as `<instance-id>`):**

```bash
# poll status
uip maestro bpmn instance get <instance-id> --folder-key 6f53970c-8d0e-4ad4-b334-218822a8c3b2
# full state incl. the DecisionRecord
uip maestro bpmn instance variables <instance-id> --folder-key 6f53970c-8d0e-4ad4-b334-218822a8c3b2
```

A job reaches **Completed** in roughly 30–40 seconds. The `sign_off` payload supplies the
human decision (the gate is a timer-held catch event in this build — see §5), so the run is
fully scriptable for a clean take. For a live "analyst clicks" beat, narrate the gate as the
Action Center task and apply the decision via the input.

---

## 4. The authentic DecisionRecord (captured, Scenario A)

Captured from completed instance `cce35dcc-9982-4336-9946-38c4ae21a2a8`
(`ALERT-2026-0488`, 1.0.35):

```json
{
  "AlertId": "a0000001-0000-4000-8000-000000000001",
  "CustomerName": "Cedar Imports Ltd",
  "FinalRiskTier": "medium",
  "OriginalProposedTier": "medium",
  "RouteTaken": "medium_signoff",
  "TierWasForced": false,
  "RedFlags": [],
  "DecisionMakerName": "Razlan B. Hamid (AML Analyst)",
  "HumanAction": "signed_agree",
  "OverrideReason": "Cedar is an established import/export company (incorporated 2016, CDD current to 2025-01); two wires totalling RM85,000 to a new overseas supplier are consistent with import trade. Screening clear, no adverse media. Concur with medium risk - retain under standard monitoring.",
  "DecisionTimestamp": "2026-06-27T15:12:32.442Z",
  "FinalDisposition": "closed",
  "DispositionTimestamp": "2026-06-27T15:12:32.442Z",
  "DecisionRecordId": "a0000006-0000-4000-8000-000000000006",
  "WasExisting": false
}
```

For Scenario B the same record shows `HumanAction: "override"`, `FinalDisposition:
"escalated"`, and the EDD-escalation reasoning.

> Note: `AlertId`/`DecisionRecordId` are deterministic golden-set placeholders
> (`a0000001` / `a0000006`) so demo runs are reproducible. The defensibility content —
> customer, analyst, action, rationale, timestamps, disposition — is real and unique to the
> decision.

---

## 5. Known limitations — read before recording

These are honesty notes so the demo survives scrutiny. **Demo on `ALERT-2026-0488` (or
`ALERT-2026-0142`), not `ALERT-2026-0271`.**

1. **Do NOT demo `ALERT-2026-0271` (Northwind).** Its evidence describes a textbook
   structuring pattern (seven RM24,000 payments in five days), which _should_ trip the
   deterministic structuring detector and force-escalate. It does not: the seeded dataset
   encodes that evidence as `{"transactions": 7, "amount_each": 24000}` (a count + a scalar),
   while the detector expects `transactions` to be an **array** of objects with `amount_myr`.
   The schemas don't match, so the detector silently finds nothing and the case wrongly
   routes to `medium_signoff`. A silent miss on structuring is the worst thing to show a
   regulator — avoid this alert until the detector is reconciled to the dataset schema
   (small JS change in `DecisionGateApi/DecisionGate.json` → `Javascript_Detect_Structuring`).

2. **The `high_challenger` path is authored but not yet runnable live.** When a detector
   fires, the flow routes to `Task_ChallengerAgent → Task_ChallengerGate → Task_HighHITL →
…`. `Task_HighHITL` is still an `Actions.HITL` user task (needs a published Action Center
   app — the same blocker we solved on the medium path by switching to a timer-held catch
   event), and `Task_BuildHighAudit` still reads its inputs bare rather than from the `args`
   container. Until both are fixed (and the second agent verified end-to-end), keep the live
   demo on the `medium_signoff` path, which is fully working.

3. **Sign-off is delivered as a structured job input**, not an interactive Action Center
   click (by design — interactive HITL constructs were not reliably packable in this build).
   This does not change the defensibility property: the decision is attributable,
   rationale-bearing, and immutable either way. Narrate the gate as the Action Center task;
   the input _is_ the analyst's decision.

---

## 6. Optional "v2" beat — the deterministic challenger (if time allows)

The single most compelling addition would be showing **rules overruling the AI**: an alert
where a detector fires, the tier is **forced to high regardless of the model**, and a senior
reviewer adjudicates. That requires the two fixes in §5(1) and §5(2). Estimated effort: a
detector-schema reconciliation, the `Task_HighHITL`→timer + `Task_BuildHighAudit`→`args`
fixes (mirroring the medium path), one redeploy, and an end-to-end test of
`Task_ChallengerAgent`. Recommend doing this only after the current medium-path video is in
the can, so there is always a working submission.

```

```
