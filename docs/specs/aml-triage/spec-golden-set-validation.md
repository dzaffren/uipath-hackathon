# Golden-Set Accuracy Validation

**Ticket:** TBD
**Type:** Technical — Validation

This is the de-risking experiment that runs before any of the triage orchestration is
built. It proves, on a realistic set of curated cases with known correct answers, that the
triage agent's reasoning is genuinely accurate and audit-defensible — not merely
plausible-sounding. The result gates whether the team commits to building the full process
or stops to fix the agent's reasoning and evidence design first.

## Motivation

The whole value of this initiative rests on one assumption: that the agent's cited
escalate-or-close recommendations are correct and would survive an audit. If that
assumption is wrong, every downstream piece of work — the orchestration, the human-review
steps, the audit record — is built on sand. Building all of that first and only then
discovering the reasoning is unreliable would waste most of the available build window.

**Current state:** No evidence yet exists that the agent reasons correctly about AML risk.
The team has a design intent (a structured rationale with a risk tier, a confidence level,
and evidence citations that are checked against gathered evidence) but no measured proof
that the agent produces correct tier calls or that its citations actually point at real
evidence rather than invented details.

**Desired state:** A curated set of realistic AML scenarios, each with a known correct
answer, has been run through the triage agent's reasoning on its own. Each scenario is
scored against a clear rubric, and the agent's accuracy on risk-tier calls is reported as a
real, computed number. The team can state with evidence whether the agent's reasoning is
sound enough to build on, or name exactly what must be fixed first.

**Trigger:** This is the first build step in the rollout plan. The discovery work named the
agent's accuracy and audit-defensibility as the single riskiest assumption, and the plan
calls for testing it before the orchestration is built. Nothing downstream should start
until this validation has run.

## Scope

- **In scope:**
  - Selecting a public synthetic AML dataset (SAML-D or the IBM Transactions for AML
    dataset) as the realistic source material, and attributing its license.
  - Curating 8 to 12 golden-set scenarios drawn from that dataset, each engineered to
    exercise a specific decision route and demonstration moment — for example: a clean
    close, a red-flag override, a caught invented citation, a maker–checker disagreement,
    and an ambiguous escalation.
  - Building an engineered evidence layer that assembles each scenario's evidence picture
    and adds synthetic sanctions and politically-exposed-person (PEP) indicators, because
    the raw dataset contains none.
  - Recording, for each scenario, the known correct risk tier (the answer the agent is
    being measured against).
  - Running each scenario through the triage agent's reasoning on its own, before any
    orchestration exists.
  - Scoring each scenario on the three-point rubric: correct risk-tier call; relevant
    evidence cited with every citation confirmed against the gathered evidence; and whether
    the result would survive an audit.
  - Computing and reporting the precision and recall of the agent's tier calls against the
    known answers, as real numbers.
  - Writing up the outcome as a clear pass-or-fix verdict that gates the rest of the work.

- **Out of scope:**
  - Building the orchestration, the human-review steps, or the audit store (later stories).
  - Any use of real or anonymized-real customer data.
  - Wiring genuine external evidence sources; the evidence layer is engineered for this
    validation only.
  - Setting a hard numeric pass threshold on precision and recall — reporting them as real
    numbers is the bar, not clearing a specific value.

## Goals

- Curate a golden set of 8 to 12 scenarios, each tied to a specific decision route and
  demonstration moment, each with a recorded known-correct risk tier.
- Score every scenario on the three-point rubric and have at least 6 of 8 scenarios pass
  all three points.
- Report the agent's precision and recall on its risk-tier calls as real, computed numbers
  measured against the known answers.
- Produce a clear go-or-fix verdict: either the reasoning is sound enough to build on, or a
  named list of reasoning and evidence-design problems to fix before building.

## Non-Goals

- Tuning the agent to hit any specific precision or recall figure. The figures are reported
  honestly; they are not a target to be gamed.
- Validating the human-review, batch sign-off, or challenger behaviour — those belong to
  later stories and are not exercised here.
- Proving the orchestration's end-to-end timing, routing, or audit-record completeness.

## Success Criteria

- At least 6 of the 8 golden-set scenarios pass all three rubric points (correct tier call;
  relevant, fully-validated citations; would survive an audit).
- The agent's precision and recall on risk-tier calls are reported as real numbers against
  the dataset's known answers. There is no hard pass threshold on these figures — reporting
  them is the requirement.
- The dataset is named and its license is attributed.
- Every invented or untraceable citation produced by the agent during the run is detected
  and recorded as a rubric failure for that scenario — none passes unnoticed.
- The run concludes with an explicit verdict: proceed to build, or fix named reasoning and
  evidence-design problems first.

## Acceptance Criteria

> Operational scenarios describing the observable behaviour of the validation run, from the
> point of view of someone watching the results.

### Scenario: A clean low-risk case is called correctly with grounded citations

```gherkin
Given a golden-set scenario for customer Mariam Hassan whose known correct answer is "low risk — close"
  And her evidence picture shows a RM3,500 salary deposit, no sanctions match, no PEP match, and no structuring pattern
When the scenario is run through the triage agent's reasoning on its own
Then the agent calls the risk tier "low"
  And the agent cites only evidence items present in the gathered evidence picture
  And every cited item is confirmed to trace back to a real gathered item
  And the scenario is scored as passing all three rubric points
```

### Scenario: A structuring pattern is escalated correctly

```gherkin
Given a golden-set scenario for customer Daniel Okoro whose known correct answer is "high risk — escalate"
  And his evidence picture shows three cash deposits of RM24,800, RM24,200, and RM24,500 within five days
When the scenario is run through the triage agent's reasoning on its own
Then the agent calls the risk tier "high"
  And the agent cites the three near-threshold deposits as the basis for the call
  And every cited item is confirmed to trace back to a real gathered item
  And the scenario is scored as passing all three rubric points
```

### Scenario: An invented citation is caught and recorded as a failure

```gherkin
Given a golden-set scenario engineered to tempt the agent into citing evidence that was never gathered
  And the gathered evidence picture contains no adverse-media report about the customer
When the scenario is run through the triage agent's reasoning on its own
  And the agent cites "an adverse-media report linking the customer to fraud" that does not exist in the gathered evidence
Then the citation is flagged as untraceable to any gathered evidence item
  And the scenario is scored as failing the citation rubric point
  And the invented citation is recorded in the run results rather than passing unnoticed
```

### Scenario: An ambiguous, low-confidence case is handled conservatively

```gherkin
Given a golden-set scenario for customer Priya Nair whose known correct answer is "medium risk — send to a human"
  And her evidence picture is deliberately mixed: a RM15,000 transfer to a new counterparty with thin customer history and no clear red flag
When the scenario is run through the triage agent's reasoning on its own
Then the agent does not call the case "low risk" with high confidence
  And the agent reports a confidence level below the threshold that would allow an automatic low-risk disposition
  And the scenario is scored against the known "medium risk" answer
```

### Scenario: Precision and recall are computed and reported as real numbers

```gherkin
Given all 8 golden-set scenarios have been run through the agent's reasoning
  And each scenario has a recorded known-correct risk tier
When the run is complete
Then the agent's precision on its risk-tier calls is computed against the known answers and reported as a real number
  And the agent's recall on its risk-tier calls is computed against the known answers and reported as a real number
  And these figures are reported regardless of whether they clear any particular value
```

### Scenario: At least six of eight scenarios pass and the build is cleared to proceed

```gherkin
Given all 8 golden-set scenarios have been scored on the three-point rubric
When 6 or more scenarios pass all three rubric points
Then the validation verdict is "proceed to build the orchestration"
  And the passing and failing scenarios are listed with their scores
```

### Scenario: The agent fails to clear the bar and the build is held

```gherkin
Given all 8 golden-set scenarios have been scored on the three-point rubric
When only 4 scenarios pass all three rubric points
Then the validation verdict is "do not build yet — fix the agent's reasoning and evidence design first"
  And the specific reasons each failing scenario fell short are recorded
  And the named problems are the input to revising the agent before this validation is re-run
```

### Scenario: The dataset and its license are attributed in the results

```gherkin
Given the golden-set scenarios are drawn from a public synthetic AML dataset
When the validation results are written up
Then the dataset is named
  And its license is attributed
  And no real or anonymized-real customer data appears anywhere in the scenarios
```

## Constraints

- **Data:** Only a public synthetic AML dataset may be used as the source material — SAML-D
  or the IBM Transactions for AML dataset. No real or anonymized-real customer data is
  permitted anywhere in the scenarios or the engineered evidence layer.
- **License attribution:** The chosen dataset's license must be attributed in the results.
  The IBM Transactions for AML dataset is licensed CDLA-Sharing-1.0; SAML-D's license is
  stated on its Kaggle license tab and must be confirmed and attributed before use.
- **Gating:** This validation gates the agent's design. A failure to clear the bar means the
  agent's reasoning and evidence design are fixed before any orchestration work begins, and
  the validation is re-run.
- **Reporting honesty:** Precision and recall are reported as the real computed numbers.
  There is no hard pass threshold on these figures and they must not be presented as if a
  target had been met.
- **Rollback:** N/A — this is a one-off measurement that produces a verdict, not a change to
  a running system.

## Dependencies

- Access to a public synthetic AML dataset (SAML-D or the IBM Transactions for AML dataset)
  and confirmation of its license.
- The triage agent's reasoning design (its instructions and the rubric it writes to) being
  defined well enough to run on its own, ahead of any orchestration.
- The engineered evidence layer that assembles each scenario's evidence picture and injects
  the synthetic sanctions and PEP indicators the raw data lacks.

## Open Questions

> Resolve all questions before implementation. Non-blocking questions may be deferred with
> rationale.

- [x] ~~What accuracy bar must the agent clear?~~ — **Resolved:** at least 6 of 8 golden-set
  scenarios pass all three rubric points; precision and recall are reported as real numbers
  with no hard pass threshold.
- [x] ~~May real or anonymized-real data be used?~~ — **Resolved:** no. A public synthetic
  dataset only, with its license attributed, plus an engineered evidence layer.
- [x] ~~What does the scoring rubric measure?~~ — **Resolved:** three points per scenario —
  correct risk-tier call; relevant evidence cited with every citation validated against the
  gathered evidence; and whether the result would survive an audit.
- [ ] Which of the two candidate datasets (SAML-D or IBM Transactions for AML) is the better
  fit for engineering the chosen demonstration moments — **Deferred (non-blocking):** either
  satisfies the synthetic-data and license-attribution constraints; the choice can be made
  during curation without blocking the start of the work.
