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
