# Maker–Checker Challenger on the High-Risk Path

**Ticket:** TBD

On the high-risk route, before a senior reviewer signs off, an independent challenger reviews the original recommendation and either agrees with it or raises a documented disagreement that names exactly what it disputes and why, citing only evidence already gathered in the case. The senior / enhanced-due-diligence (EDD) reviewer sees both the original recommendation and the challenger's position side by side before making the final call, and the challenger's outcome becomes part of the permanent decision record. This gives the most consequential decisions a genuine second set of eyes without slowing them down with a full re-investigation.

## User Story

As a senior / enhanced-due-diligence (EDD) reviewer making the final call on a high-risk alert, I want an independent challenger to agree with or dispute the original recommendation — and to show me exactly what it disputes and why — so that I can sign off knowing the call has survived a second opinion, or knowingly decide against that opinion and have my reasoning recorded.

## Background & Context

**Current state:**

- High-risk alerts already reach a senior / EDD reviewer with an agent-produced recommendation: the proposed call (escalate, close, or send onward), the high-risk tier, the agent's confidence, and a list of cited evidence with each citation already checked against the gathered case file.
- The senior reviewer reads that single recommendation and signs it or overrides it. There is one line of reasoning in front of them and no structured second opinion.

**Problem:**

- A single recommendation, however well cited, is still one chain of reasoning. On the highest-consequence alerts — the ones most likely to be questioned by a regulator or internal auditor — there is no recorded evidence that anyone independently tested that chain before the final call.
- When a high-risk decision is reviewed months later, "a senior reviewer agreed with the recommendation" is weaker than "an independent challenger reviewed the recommendation, took a position, and the senior reviewer decided in full view of it." The defensibility gap is exactly on the cases that matter most.
- Without a structured challenge, a confident-sounding but flawed recommendation can pass to sign-off unexamined, and a reviewer who happens to disagree has nothing on the record showing the disagreement was considered.

## Target User & Persona

- **Who:** A senior investigator / enhanced-due-diligence (EDD) reviewer who owns the final disposition of high-risk AML alerts and personally answers for them on audit.
- **Context:** They are working a high-risk alert that has already been routed to the high-risk path and already carries an agent recommendation. They are at the sign-off step, deciding whether to escalate, close, or send the case onward.
- **Current workaround:** They mentally play devil's advocate against the single recommendation in front of them, or informally ask a colleague — neither of which leaves anything on the record.

## Goals

- Give every high-risk alert an independent agree/disagree review of its recommendation before senior sign-off.
- When the challenger disagrees, make the specific point of dispute and the reasoning behind it visible to the senior reviewer, grounded only in evidence already in the case.
- Let the senior reviewer make the final call in full view of both positions — including deciding against the challenger — and capture that choice and its reasoning in the record.
- Make the challenger's outcome a permanent, audit-visible part of every high-risk decision record.

## Non-Goals

- **Not a full re-investigation.** The challenger does not gather new evidence, run new screening, or build a parallel case. It reviews the existing recommendation against the existing case file only.
- **Does not decide anything.** The challenger only takes a position; the senior / EDD reviewer always makes the final call.
- **Does not apply to medium- or low-risk alerts.** The challenger runs only on the high-risk path. How alerts reach the high-risk path, the original recommendation itself, and low-risk handling are covered by other stories.
- **Does not loop or re-run.** A single challenger position is produced for the senior reviewer; there is no back-and-forth negotiation between the challenger and the original recommendation.

## User Workflow

> Step-by-step from the senior / EDD reviewer's perspective.

1. **A high-risk alert reaches final review.** The senior reviewer opens a high-risk case that already carries the original recommendation — the proposed call, the high-risk tier, the confidence, and the cited evidence.
2. **An independent challenger has already weighed in.** Before the reviewer is asked to decide, the challenger has reviewed the recommendation and recorded a position: either it agrees, or it disagrees and states exactly what it disputes and why.
3. **The reviewer sees both positions.** The case shows the original recommendation and, alongside it, the challenger's position — a clear concurrence, or the specific disagreement with its reasoning and the evidence it relies on.
4. **The reviewer decides.** The reviewer makes the final call. When the challenger agreed, they can confirm and sign off. When the challenger disagreed, they weigh the dispute and either side with the challenger or decide against it, recording why.
5. **The decision is recorded.** The final disposition is logged together with the challenger's outcome (agreed or the specific disagreement) and the reviewer's decision and reasoning, so a later reader can reconstruct that the call was independently challenged before it was made.

## Acceptance Criteria

> Written from the senior / EDD reviewer's perspective. All examples use a high-risk alert. Realistic dataset values are used; no system identifiers appear.

### Scenario: Challenger agrees and the reviewer signs off

```gherkin
Given the alert for "Northwind Logistics" is on the high-risk path
  And the original recommendation is to escalate the alert, citing a RM2,000,000 transfer chain layered through three intermediary accounts and a sanctions-list match on a counterparty
  And the challenger has independently reviewed the recommendation and agreed with it
When David, the senior reviewer, opens the case on 18 March 2026
Then he sees the original recommendation to escalate alongside the challenger's position of agreement
  And he can confirm the escalation and sign off
  And the record shows the challenger agreed and that David made the final call to escalate on 18 March 2026
```

### Scenario: Challenger disagrees with a documented reason and the reviewer sides with it

```gherkin
Given the alert for "Northwind Logistics" is on the high-risk path
  And the original recommendation is to close the alert as the layered transfers appear to be normal trade settlement
  And the challenger has independently reviewed the recommendation and disagreed, disputing the close because the RM2,000,000 was moved through three intermediary accounts within four days in a pattern the cited evidence does not explain
When David, the senior reviewer, opens the case on 18 March 2026
Then he sees the original recommendation to close alongside the challenger's documented disagreement and the evidence it relies on
  And he decides to escalate the alert instead of closing it, recording that he agrees with the challenger's concern about the unexplained layering
  And the record shows the challenger disagreed, the specific point disputed, and that David escalated against the original recommendation on 18 March 2026
```

### Scenario: Reviewer overrides the challenger and records why

```gherkin
Given the alert for "Cedar Grove Imports" is on the high-risk path
  And the original recommendation is to escalate the alert because of a politically-exposed-person match on the account holder
  And the challenger has independently reviewed the recommendation and disagreed, disputing the escalation because the cited politically-exposed-person match refers to a different individual with the same name
When Priya, the senior reviewer, opens the case on 22 March 2026
Then she sees the original recommendation to escalate alongside the challenger's documented disagreement
  And she decides to escalate anyway, recording that she is escalating conservatively because the name match cannot be ruled out from the evidence in the case
  And the record shows the challenger disagreed, that Priya overrode the challenger's position, her reason, and that the final call was to escalate on 22 March 2026
```

### Scenario: Challenger's position cites only evidence already in the case

```gherkin
Given the alert for "Harbor Point Trading" is on the high-risk path
  And the case file contains a customer profile, a 90-day transaction history, sanctions and politically-exposed-person screening results, and adverse-media findings
  And the original recommendation is to escalate the alert
When the challenger records its position before the senior reviewer opens the case
Then every point the challenger raises refers only to evidence already gathered in the case file
  And any reference that cannot be traced to a real gathered evidence item is flagged for the reviewer before they decide
  And the reviewer never sees a challenger reason backed by evidence that is not in the case
```

### Scenario Outline: The challenger outcome and the final call appear in the record

```gherkin
Given the alert for "<customer>" is on the high-risk path
  And the original recommendation is to <recommendation>
  And the challenger has independently reviewed it with a position of "<challenger position>"
When <reviewer> makes the final call of "<final call>" on <date>
Then the record shows the original recommendation, the challenger's position, the reviewer's name, the final call, and the reviewer's reason
  And a later reader can reconstruct that the recommendation was independently challenged before the decision was made

Examples:
  | customer            | recommendation | challenger position                                   | reviewer | final call | date          |
  | Northwind Logistics | escalate       | agreed                                                | David    | escalate   | 18 March 2026 |
  | Cedar Grove Imports | escalate       | disagreed: cited politically-exposed-person mismatch  | Priya    | escalate   | 22 March 2026 |
  | Harbor Point Trading| close          | disagreed: unexplained RM2,000,000 layering pattern      | David    | escalate   | 25 March 2026 |
```

### Scenario: Challenger runs only on the high-risk path

```gherkin
Given an alert has been assigned the medium-risk tier and is not on the high-risk path
When the original recommendation is produced for that alert
Then no challenger review is performed for it
  And the case is presented for the standard single sign-off without a challenger position
```

## Business Rules & Constraints

- **The challenger runs only on the high-risk path.** Medium- and low-risk alerts never receive a challenger review.
- **The challenger is independent of the original recommendation.** It forms its own view of whether the recommendation holds, rather than restating or summarizing it.
- **The challenger takes exactly one of two positions:** it agrees with the recommendation, or it disagrees. A disagreement must name the specific point disputed and the reason for disputing it.
- **The challenger is bound by the same citation rule as the original recommendation.** It may rely only on evidence actually gathered into the case file. Any reason it raises that cannot be traced to a real gathered evidence item is flagged for the reviewer before they decide — an untraceable basis never passes silently.
- **The challenger is a review, not a re-investigation.** It does not gather new evidence, request new screening, or build a parallel case; it works from the existing case file only.
- **The senior / EDD reviewer always makes the final call.** The challenger never disposes of an alert. The reviewer may agree with the original recommendation, side with the challenger, or decide against the challenger; whenever the reviewer's final call differs from the original recommendation or from the challenger's position, the reviewer records why.
- **The challenger outcome is part of the decision record.** Every high-risk decision record carries the challenger's position (agreed, or the specific disagreement and its reasoning) alongside the original recommendation and the reviewer's final decision, so the full challenge-then-decide trail can be reconstructed later.

## Success Metrics

- **Challenge coverage:** 100% of high-risk alerts reaching senior / EDD sign-off carry a recorded challenger position before the final call is made.
- **Defensibility on the high-risk path:** 100% of high-risk decision records show the challenger's position, the reviewer's final call, and — where they differ — the reviewer's recorded reason.
- **Grounded challenges:** zero challenger reasons backed by evidence not in the case file reach the senior reviewer unflagged.
- **Caught disagreements demonstrated:** at least one golden-set high-risk scenario shows the challenger raising a documented disagreement that the senior reviewer acts on (qualitative, demonstrated).

## Dependencies

- **Core triage slice** — the original recommendation, its cited and checked evidence, the senior sign-off step, and the audit decision record that the challenger outcome is added to.
- **Red-flag override & conservative tiering** — the high-risk route the challenger runs on must already exist; this story does not decide which alerts become high risk.
- **The shared grounded-citation standard** — the challenger relies on the same rule that limits citations to evidence actually gathered into the case file.

## Open Questions

- [x] ~~What is the minimum-viable challenger?~~ — **Resolved:** an independent agree/disagree-with-reasons review of the original recommendation on the high-risk path before senior / EDD sign-off — not a full re-investigation, with the outcome recorded in the decision record.
- [x] ~~May the challenger introduce its own evidence?~~ — **Resolved:** no; the challenger is bound by the shared grounded-citation rule and works only from evidence already gathered into the case file.
- [x] ~~Who makes the final call when the challenger and the original recommendation disagree?~~ — **Resolved:** the senior / EDD reviewer always decides, in full view of both positions, and records a reason whenever their final call differs from the recommendation or the challenger.
