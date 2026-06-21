---
name: confidence-unit-normalisation
description: Normalize agent confidence to 0–100 before threshold comparisons — agents can return decimal fractions or integers
metadata:
  type: pattern
---

Before comparing `confidence >= <threshold>` in any routing or tiering step, normalize the raw value: if `confidenceRaw > 0 && confidenceRaw <= 1`, multiply by 100. This guards against agent implementations that emit confidence as a 0–1 float rather than a 0–100 integer.

```js
const confidenceRaw = typeof agentOutput.confidence === 'number'
  ? agentOutput.confidence
  : parseFloat(agentOutput.confidence) || 0;
const confidence = (confidenceRaw > 0 && confidenceRaw <= 1)
  ? confidenceRaw * 100
  : confidenceRaw;
```

**Why:** UiPath agents (and underlying LLMs) can return confidence in either unit depending on model version or invocation style. Without normalisation, a `0.92` float reads as 92 % to a human reviewer but evaluates as `0.92 >= 85` (false) in the routing code — silently routing a high-confidence auto-close case to human review. The bug is invisible without a boundary test case using a decimal input.

**How to apply:** Apply this normalisation in every `JsInvoke` step that reads `agent_output.confidence` for routing decisions. Add test cases in the Node.js harness for both integer (e.g. `84`, `85`, `88`) and decimal (e.g. `0.84`, `0.85`) inputs to confirm the threshold boundary is correct in both units.
