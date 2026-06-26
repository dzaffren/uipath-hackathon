---
name: foreach-results-accumulation
description: Accumulate ForEach per-iteration results into a growing array via $context?.outputs read-back on each iteration
type: pattern
captured: 2026-06-26
source: /build session — low-risk-batch-signoff feature (PR #5); also present in pre-existing RedFlagTrigger ForEach in AuditWrite.json
---

UiPath API Workflow ForEach steps have no native accumulator variable. Each iteration sees only its own outputs; prior-iteration state must be re-read from `$context.outputs` explicitly.

The established pattern to build a growing `results[]` array across iterations is in the body-level `export`:

```json
"export": {
  "as": "{ ...$context, outputs: { ...$context?.outputs, \"For_Each_MyKey\": { ...$context?.outputs?.For_Each_MyKey, results: [ ...($myItemIndex == 0 ? [] : ($context?.outputs?.For_Each_MyKey?.results ?? [])), ...([$output] ?? []) ] } } }"
}
```

- `$myItemIndex == 0` → start fresh (avoids reading a non-existent prior state on the first iteration)
- `$context?.outputs?.For_Each_MyKey?.results ?? []` → the accumulated array from all previous iterations
- `[$output]` → the current iteration's return value (what the last step in the body returned)

After the ForEach completes, read `$context.outputs.For_Each_MyKey.results` in a subsequent JS step to process the full array.

**Why:** The DSL has no mutable variable that persists across loop iterations. The `$context.outputs` object is the only cross-iteration state store — each iteration's body export writes to it, and the next iteration reads it back. Without the index guard on `== 0`, the first iteration would attempt to spread `undefined` and fail silently.

**How to apply:** Use this pattern any time a ForEach body needs to collect per-iteration results (counts, IDs, success/failure flags) that must be summarised after the loop. The body's last step should return a plain object (e.g. `{written: 1, skipped: 0}`); the body-level export accumulates these into `results[]`; a JS step after the ForEach sums or filters the array. This pattern is confirmed by two independent usages in `AuditWriteApi/AuditWrite.json` (RedFlagTrigger ForEach and BatchAlerts ForEach).
