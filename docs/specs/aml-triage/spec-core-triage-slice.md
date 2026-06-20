# Core Triage Slice (Recommendation → Sign-off → Log)

**Ticket:** TBD

This feature takes a single medium-risk anti-money-laundering (AML) alert all the way
through: it gathers the full evidence picture into one case file, produces a reasoned
recommendation whose every citation is checked against real gathered evidence, lets an
investigator agree or override it, and writes a complete audit-ready record of the whole
trail. It is the working spine of the epic — the first alert that flows end-to-end — and it
delivers the headline promise that decisions are defensible by construction. The investigator
benefits: instead of starting from a blank case file, they start from a complete, cited
recommendation they can trust because any unverifiable claim has already been flagged.

## User Story

As an AML investigator, I want to open a medium-risk alert that already states the
recommended call, the risk tier, the agent's confidence, and the evidence behind it — with
any unverifiable citation flagged before I read it — so that I can confidently agree or
override in minutes and leave behind a record that holds up under audit.

## Background & Context

**Current state:**

- Investigators receive transaction-monitoring alerts and must decide whether to escalate
  (open an investigation / file a suspicious-activity report) or close them.
- The evidence needed to judge an alert — the customer profile, transaction history,
  sanctions and politically-exposed-person (PEP) screening results, and adverse-media
  indicators — is scattered across separate systems. Pulling it together by hand eats the
  time meant for judgement.
- When a decision is recorded, the rationale is usually a one- or two-sentence close reason.

**Problem:**

- A thin rationale does not survive a regulator or internal auditor reviewing the decision
  months or years later: the reasoning, the evidence relied on, and the approval trail are
  not captured in a way that holds up.
- A generated recommendation is only trustworthy if its supporting claims are real. A
  recommendation that cites evidence which was never actually gathered — a fabricated or
  mistaken reference — is worse than no recommendation, because it looks authoritative while
  being unfounded.
- Without one standard applied to every alert, the same alert can be handled differently
  depending on who is on shift.

## Target User & Persona

- **Who:** An AML investigator (for example, Priya) who triages transaction-monitoring
  alerts day to day and is personally accountable for the escalate/close decision.
- **Context:** Priya works a queue of alerts. For a medium-risk alert she needs to
  understand the case quickly, satisfy herself the recommendation is sound, and either back
  it or correct it — knowing her name and reasoning will be on the record if it is ever
  reviewed.
- **Current workaround:** She opens several systems, copies evidence into a working note,
  forms a judgement, and writes a short close/escalate reason that captures little of the
  reasoning.

## Goals

- For a medium-risk alert, present the investigator with a complete case file: the
  recommended call, the risk tier, the agent's confidence, and the list of cited evidence.
- Guarantee every citation points at evidence that was actually gathered into the case file,
  and flag any citation that cannot be traced to a real evidence item before the
  investigator reads the recommendation.
- Let the investigator sign (agree) or override (disagree), capturing the override reason
  when they disagree.
- Write a single audit-ready decision record that reconstructs the full alert → evidence →
  recommendation → decision → outcome trail.

## Non-Goals

- **Deterministic red-flag and high-risk routing.** Forcing an alert onto the high-risk
  route when a sanctions hit, PEP match, structuring pattern, high-risk jurisdiction, or
  watchlist match fires is handled by the "Red-flag override & conservative tiering" story.
  This story covers the medium-risk path.
- **Independent challenger review.** The second-opinion review on the high-risk path belongs
  to the "Maker–checker challenger" story.
- **Low-risk batch sign-off and sampling.** Bulk clearance of auto-dispositioned low-risk
  alerts belongs to the "Low-risk auto-disposition with batch sign-off & QA" story.
- **Re-fetching missing evidence and automatic re-triage.** A loop-back that gathers more
  evidence and triages again is a deferred backlog beat, not part of this slice.

## User Workflow

> The step-by-step experience from the investigator's perspective.

1. **An alert is waiting.** Priya sees a medium-risk alert in her queue — for example, an
   alert on Meridian Trading Ltd flagged for an unusual pattern of outbound payments. She
   opens it.
2. **The case file is already assembled.** Instead of a blank screen, she sees one case file
   that has pulled together Meridian Trading Ltd's customer profile, recent transaction
   history, the sanctions/PEP screening result, and any adverse-media indicators.
3. **The recommendation is stated up front.** The case file leads with the recommended call
   (escalate or close), the risk tier (medium), the agent's confidence, and a list of the
   specific evidence items the recommendation relied on, each pointing back to where it came
   from in the case file.
4. **Any unverifiable claim is already flagged.** If the recommendation referred to a piece
   of evidence that was not actually gathered into the case file, that reference is shown to
   Priya as flagged and unverified, with a clear warning — so she never has to take a hidden
   claim on faith.
5. **She decides.** Priya reviews the recommendation against the cited evidence and either
   signs (agrees) or overrides. If she overrides, she records her reason.
6. **The decision is logged.** As soon as she decides, a complete audit-ready record is
   written capturing the alert, the assembled evidence and each citation's check status, the
   recommendation and confidence, her decision (who, when, agreed or overridden, and any
   override reason), and the final disposition with its time. She moves on to the next alert.

## Acceptance Criteria

> From the investigator's perspective — what she sees, reviews, and decides.

### Scenario: Investigator reviews a complete recommendation and signs to agree

```gherkin
Given a medium-risk alert on Meridian Trading Ltd is waiting in my queue
  And the case file has gathered Meridian Trading Ltd's customer profile, its
      transaction history, its sanctions and PEP screening result, and its
      adverse-media indicators
  And the recommendation reads "Close — risk tier medium, confidence 78%"
  And every cited evidence item points back to an item actually gathered into the
      case file
When I open the alert
Then I see the recommended call, the risk tier, the confidence, and the list of
     cited evidence before any blank work area
  And I see no unverified-citation warnings
When I sign to agree with the recommendation
Then I see the alert recorded as closed with my name as the accountable decision-maker
  And I see confirmation that an audit-ready decision record has been written
```

### Scenario: Investigator overrides the recommendation and records a reason

```gherkin
Given a medium-risk alert on Northwind Logistics Inc is waiting in my queue
  And the recommendation reads "Close — risk tier medium, confidence 71%"
  And the cited evidence includes a sequence of seven outbound payments of
      RM24,000 each to the same counterparty over five days
When I open the alert and review the cited evidence
  And I disagree because the payment pattern looks like deliberate structuring
  And I choose to override the recommendation to "Escalate"
Then I am required to record an override reason before the override is accepted
When I enter the override reason "Repeated payments just under the reporting
     threshold to one counterparty — consistent with structuring; escalating for
     investigation"
Then I see the alert recorded as escalated with my name as the accountable
     decision-maker
  And I see that my override reason has been captured
  And I see confirmation that an audit-ready decision record has been written
```

### Scenario: An unverifiable citation is caught and flagged before the investigator reads the recommendation

```gherkin
Given a medium-risk alert on Cedar Imports Ltd is waiting in my queue
  And the case file has gathered Cedar Imports Ltd's customer profile, its
      transaction history, and its sanctions and PEP screening result
  And no adverse-media indicator was gathered for Cedar Imports Ltd
  And the recommendation cites "a 2024 news report alleging bribery by Cedar
      Imports Ltd" as supporting evidence
  And that cited news report cannot be traced to any evidence item in the case file
When I open the alert
Then I see the recommendation with the bribery-report citation clearly marked as
     unverified and not found in the gathered evidence
  And I see a warning that I should not rely on the flagged citation
  And I can still review every citation that was confirmed against the case file
When I decide on the alert
Then the decision record shows the bribery-report citation with a failed
     citation-check status alongside the citations that passed
```

### Scenario: An investigator cannot complete a decision without one valid, accountable action

```gherkin
Given a medium-risk alert on Meridian Trading Ltd is open in front of me
  And the recommendation and cited evidence are displayed
When I try to leave the alert without either signing or overriding
Then the alert stays undecided and open
  And no disposition and no decision record are written for it
```

### Scenario Outline: Whatever the outcome, a complete audit-ready record is written

```gherkin
Given a medium-risk alert on <customer> with recommendation "<recommendation>"
      and confidence <confidence> is open in front of me
When I <decision> the recommendation, with reason "<reason>"
Then a decision record is written that reconstructs the full trail from alert
     received, through the gathered evidence and each citation's check status, to
     the recommendation, my decision, and the final disposition
  And the record names me, Priya, as the accountable decision-maker with the date
      and time of my decision
  And the record states the final disposition as "<disposition>"

Examples:
  | customer              | recommendation | confidence | decision | reason                                                                 | disposition |
  | Meridian Trading Ltd  | Close          | 78%        | sign     | (none — agreed with recommendation)                                    | Closed      |
  | Northwind Logistics Inc | Close        | 71%        | override | Payments just under the reporting threshold suggest structuring        | Escalated   |
  | Harbour Freight Co    | Escalate       | 64%        | sign     | (none — agreed with recommendation)                                    | Escalated   |
```

### Scenario Outline: The citation-check status is shown for each cited item

```gherkin
Given a medium-risk alert on Cedar Imports Ltd is open in front of me
  And the recommendation cites the evidence item "<cited item>"
When the citation is checked against the gathered case file
Then I see the cited item marked as "<check status>"

Examples:
  | cited item                                              | check status        |
  | Sanctions and PEP screening returned no match           | Verified            |
  | Three large cash deposits in the past 30 days           | Verified            |
  | A 2024 news report alleging bribery (not in case file)  | Unverified / flagged |
```

## Business Rules & Constraints

- **The case file is assembled before the investigator sees the alert.** Every medium-risk
  alert presented to the investigator already contains the four evidence categories that
  could be gathered — customer profile, transaction history, sanctions/PEP screening result,
  and adverse-media indicators — so the investigator never starts from a blank file. Where a
  category genuinely returned nothing (for example, no adverse media found), that is shown as
  an explicit "no result" rather than left missing.
- **A recommendation may cite only gathered evidence.** The recommendation may reference only
  evidence items that were actually assembled into the case file. Every citation is checked
  against the gathered evidence.
- **Unverifiable citations are flagged, never silent.** Any citation that cannot be traced to
  a real gathered evidence item is shown to the investigator as flagged and unverified,
  before she reads the recommendation as trustworthy. No unverifiable citation reaches the
  investigator unflagged, and the failed check status is preserved in the decision record.
- **A human is accountable for every disposition.** A medium-risk alert is dispositioned only
  when the investigator signs or overrides. The investigator's name, the date and time, and
  whether she agreed or overrode are recorded. No medium-risk alert is closed or escalated
  with no human in the chain.
- **An override always carries a reason.** The investigator cannot override the
  recommendation without recording why; signing to agree needs no reason.
- **One decision record per alert, with the full field set.** Each dispositioned alert
  produces a single audit-ready record containing: the alert reference and date; the
  customer/account reference; the risk tier and the agent's confidence; the recommendation
  (escalate or close); the list of cited evidence with each item's source and citation-check
  status; the human decision (who, when, agreed or overridden, and the override reason); and
  the final disposition with its time. The record reconstructs the full alert → evidence →
  recommendation → decision → outcome trail.

## Success Metrics

- **Audit-readiness:** the medium-risk alert produces a full cited narrative — the call, the
  risk tier, and validated evidence citations — that passes the audit-readiness rubric,
  versus today's one-line close reason.
- **Citation integrity:** zero unverifiable citations reach the investigator unflagged; every
  flagged citation is preserved with its failed check status in the decision record.
- **Defensibility coverage:** every dispositioned medium-risk alert has a named human
  accountable in its record.
- **Time-to-defensible-decision:** the investigator starts from a complete, reasoned
  recommendation rather than a blank case file (demonstrated qualitatively on the slice).

## Dependencies

- **Golden-set accuracy validation** — the agent's recommendations must be scored against a
  realistic dataset with known answers, so the team trusts the reasoning is accurate before
  routing it to an investigator. This story builds on that proof.
- **A realistic synthetic alert with an assembled evidence bundle** — including synthetic
  sanctions/PEP and adverse-media indicators — so a medium-risk alert can be taken
  end-to-end. No real or anonymized-real customer data is used.

## Open Questions

- [x] ~~What fields make the decision record audit-ready?~~ — **Resolved:** the field set is
  fixed by the epic's shared business rules (alert reference and date; customer/account
  reference; risk tier and confidence; recommendation; cited evidence with source and
  check status; human decision with override reason; final disposition and time). For this
  medium-risk story the challenger-outcome and red-flag-trigger fields are present but not
  exercised — they belong to the high-risk and red-flag stories.
- [x] ~~When an evidence category returns nothing, is that a gap or a result?~~ —
  **Resolved:** a category that genuinely returns nothing (for example, no adverse media) is
  shown as an explicit "no result," not a missing item. Re-fetching genuinely incomplete
  evidence is a deferred backlog beat outside this slice.
- [x] ~~Does signing to agree require a written reason like an override does?~~ —
  **Resolved:** no. Overriding requires a recorded reason; signing to agree does not.
