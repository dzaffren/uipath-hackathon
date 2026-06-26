---
name: foreach-js-invoke-variable-args
description: ForEach iteration variables ($alertItem etc.) must be passed explicitly in JsInvoke arguments to be visible in JS code
type: pattern
captured: 2026-06-26
source: /build session — low-risk-batch-signoff feature (PR #5)
---

In UiPath API Workflow DSL, ForEach iteration variables (`$alertItem`, `$alertItemIndex`, and any other DSL-scope loop variable) are resolved at the DSL binding layer and do **not** auto-inject into a JsInvoke step's JavaScript body. Without explicit threading, the variable is silently `undefined` — no error is thrown.

To make them available in JS code, declare them in the step's `arguments` object:

```json
"arguments": "${{ \"$context\": $context, \"$workflow\": $workflow, \"$input\": $input, \"$alertItem\": $alertItem, \"$alertItemIndex\": $alertItemIndex }}"
```

Then reference them in JS code as `$alertItem`, `$alertItemIndex` (the dollar prefix is preserved as a property name injected via the binding context).

**Why:** JsInvoke steps execute JavaScript in a separate runtime context. DSL-scope variables like `$alertItem` exist only while the DSL engine is resolving expressions (e.g. in `"Endpoint"`, `"QueryParameters"`, `"BodyParameters"` fields). They are not automatically hoisted into the JS function scope. Omitting them silently produces `undefined` rather than a parse or validation error, making this easy to miss.

**How to apply:** Whenever a JsInvoke step sits inside a `for`/`forEach` body and the JS code needs to read the current iteration item or index, add those loop variables to the step's `arguments` object alongside `$context`, `$workflow`, and `$input`. DSL expression fields (`"BodyParameters"`, `"QueryParameters"`, etc.) in the same body can reference `$alertItem` directly without this workaround — only JsInvoke JS code needs it.
