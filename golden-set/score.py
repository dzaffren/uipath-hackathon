"""
golden-set/score.py — Aurora Verdict golden-set validation scorer.

Usage:
    python golden-set/score.py <eval_export.json>

Where <eval_export.json> is the output of:
    uip agent eval run results <run_id> --output json

Prints:
  - Per-scenario 3-point rubric table
  - Confusion matrix (low / medium / high)
  - Macro precision and recall (real numbers, no pass threshold)
  - PROCEED (>=6/8 passed) or HOLD -- FIX FIRST verdict

Exit codes:
  0 — PROCEED
  1 — HOLD (fewer than 6 of 8 passed)
  2 — Input validation error (authoring/configuration problem, not agent quality)

Dataset: SAML-D (berkanoztas/synthetic-transaction-monitoring-dataset-aml, MIT License)
"""

import json
import sys
import os

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TIERS = ("low", "medium", "high")
GRADED_COUNT = 8          # denominator is fixed; pool may hold up to 12
PASS_BAR = 6              # >= 6 of 8 => PROCEED

# Map scenario IDs to their assembled evidence bundle (loaded from scenario files
# alongside this script so score.py stays in sync with the authoritative source).
SCENARIO_DIR = os.path.join(os.path.dirname(__file__), "scenarios")

# The export format keys we depend on.  If any are missing the parse guard aborts.
REQUIRED_CASE_KEYS = {"name", "inputs", "expectedOutput", "actualOutput"}
REQUIRED_ACTUAL_KEYS = {"risk_tier", "confidence", "citations"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_scenarios():
    """Return {scenario_id: scenario_data} from golden-set/scenarios/*.json."""
    scenarios = {}
    if not os.path.isdir(SCENARIO_DIR):
        _abort(f"Scenario directory not found: {SCENARIO_DIR}")
    for fname in os.listdir(SCENARIO_DIR):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(SCENARIO_DIR, fname)
        with open(path, encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as exc:
                _abort(f"Invalid JSON in scenario file {fname}: {exc}")
        sid = data.get("scenario_id")
        if not sid:
            _abort(f"Scenario file {fname} has no 'scenario_id' field.")
        if sid in scenarios:
            _abort(f"Duplicate scenario_id '{sid}' in {fname}.")
        scenarios[sid] = data
    return scenarios


def _load_export(path):
    """Load and parse the eval export JSON, aborting loudly on format drift."""
    if not os.path.isfile(path):
        _abort(f"Export file not found: {path}")
    raw_bytes = open(path, "rb").read()
    if raw_bytes[:2] in (b"\xff\xfe", b"\xfe\xff"):
        encoding = "utf-16"
    elif raw_bytes[:3] == b"\xef\xbb\xbf":
        encoding = "utf-8-sig"
    else:
        encoding = "utf-8"
    try:
        raw = json.loads(raw_bytes.decode(encoding))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        _abort(f"Export file could not be parsed ({encoding}): {exc}")

    # The uip agent eval run results export is a list of case result objects,
    # OR an object with a top-level "items" / "results" / "data" list.
    # Try both shapes; abort if neither matches.
    if isinstance(raw, list):
        cases = raw
    elif isinstance(raw, dict):
        for key in ("items", "results", "data", "evaluations"):
            if key in raw and isinstance(raw[key], list):
                cases = raw[key]
                break
        else:
            _abort(
                "Export format unrecognised: expected a JSON array or an object "
                "with an 'items'/'results'/'data'/'evaluations' array. "
                "Re-check with: uip agent eval run results <run_id> --output json"
            )
    else:
        _abort("Export format unrecognised: top-level value is not an array or object.")

    # Parse-guard: every case must have the required keys.
    for i, case in enumerate(cases):
        missing = REQUIRED_CASE_KEYS - set(case.keys())
        if missing:
            _abort(
                f"Export case #{i} is missing required fields: {sorted(missing)}. "
                "Re-export with: uip agent eval run results <run_id> --output json"
            )
        actual = case.get("actualOutput") or {}
        missing_actual = REQUIRED_ACTUAL_KEYS - set(actual.keys())
        if missing_actual:
            _abort(
                f"Export case '{case.get('name', i)}' actualOutput is missing fields: "
                f"{sorted(missing_actual)}. Agent output contract may have drifted from "
                "the expected outputSchema. Check the agent's structured output."
            )

    return cases


def _abort(msg):
    print(f"\nERROR (exit 2): {msg}", file=sys.stderr)
    sys.exit(2)


def _validate_label_set(scenarios, graded_ids):
    """FR-5: validate the scenario label set before scoring."""
    errors = []

    # All scenario IDs in the graded set must have a matching scenario file.
    for sid in graded_ids:
        if sid not in scenarios:
            errors.append(f"Graded scenario '{sid}' has no matching file in scenarios/.")

    # All scenario files must be accounted for in the graded set (no orphans).
    for sid in scenarios:
        if sid not in graded_ids:
            errors.append(
                f"Scenario file '{sid}' exists in scenarios/ but is not in the graded set. "
                "Either add it to the graded set or remove the file."
            )

    # Exactly GRADED_COUNT scenarios in the graded set.
    if len(graded_ids) != GRADED_COUNT:
        errors.append(
            f"Graded set has {len(graded_ids)} scenarios; expected exactly {GRADED_COUNT}."
        )

    # Each graded scenario must have exactly one risk_tier label in {low, medium, high}.
    for sid in graded_ids:
        if sid not in scenarios:
            continue
        tier = scenarios[sid].get("risk_tier")
        if tier not in TIERS:
            errors.append(
                f"Scenario '{sid}' has invalid or missing risk_tier '{tier}'. "
                f"Must be one of: {TIERS}."
            )

    # At least one scenario per tier (so P/R is defined for every class).
    tier_counts = {t: 0 for t in TIERS}
    for sid in graded_ids:
        if sid in scenarios:
            t = scenarios[sid].get("risk_tier")
            if t in tier_counts:
                tier_counts[t] += 1
    for t, count in tier_counts.items():
        if count == 0:
            errors.append(
                f"No graded scenario has risk_tier='{t}'. "
                f"Precision/recall is undefined for class '{t}'. Add at least one."
            )

    # GS-03 (invented-citation catch) must be present — it is a required demo beat.
    invented_case = next(
        (sid for sid in graded_ids if "invented-citation" in sid), None
    )
    if not invented_case:
        errors.append(
            "No 'invented-citation' scenario found in the graded set. "
            "The catch-invented-citation demo beat requires a scenario with "
            "'invented-citation' in its scenario_id."
        )

    if errors:
        print("\nLabel set validation FAILED — these are authoring errors, "
              "not agent quality failures:\n", file=sys.stderr)
        for e in errors:
            print(f"  • {e}", file=sys.stderr)
        sys.exit(2)


# ---------------------------------------------------------------------------
# 3-point rubric
# ---------------------------------------------------------------------------


def _check_citations(cited_ids, bundle_ids):
    """
    Citation validator — same logic as the production DecisionGateApi.
    Returns (citations_ok, list_of_unverified_ids).
    """
    unverified = [cid for cid in cited_ids if cid not in bundle_ids]
    citations_ok = (len(unverified) == 0) and (len(cited_ids) > 0 or True)
    # Note: zero citations on a call that needs evidence fails the rubric.
    # We treat zero citations as citations_ok=False only when the risk_tier is
    # not 'low' on a trivially-clean case.  The simplest defensible rule:
    # if the agent cited nothing at all, that's not audit-survivable.
    if not cited_ids:
        citations_ok = False
    return citations_ok, unverified


def _score_scenario(case_name, scenario, actual):
    """
    Apply the 3-point rubric to one case.
    Returns a dict with keys: tier_ok, citations_ok, audit_ok, passed, details.
    """
    labeled_tier = scenario["risk_tier"]
    predicted_tier = (actual.get("risk_tier") or "").strip().lower()
    confidence = actual.get("confidence")
    rationale = (actual.get("rationale") or "").strip()
    cited_ids = actual.get("citations") or []

    # Build the set of valid evidence_ids from the scenario's evidence_bundle.
    bundle_ids = {ev["evidence_id"] for ev in scenario.get("evidence_bundle", [])}

    # --- tier_ok ---
    tier_ok = predicted_tier == labeled_tier

    # --- citations_ok ---
    citations_ok, unverified = _check_citations(cited_ids, bundle_ids)
    citation_detail = []
    for uid in unverified:
        citation_detail.append(f"CITATION_UNVERIFIED: '{uid}' not in bundle")

    # --- audit_ok ---
    # Conditions: non-empty rationale, confidence in [0,100], AND citations_ok.
    confidence_valid = isinstance(confidence, int) and 0 <= confidence <= 100
    audit_ok = bool(rationale) and confidence_valid and citations_ok

    passed = tier_ok and citations_ok and audit_ok

    details = {
        "predicted_tier": predicted_tier,
        "labeled_tier": labeled_tier,
        "confidence": confidence,
        "tier_ok": tier_ok,
        "citations_ok": citations_ok,
        "audit_ok": audit_ok,
        "passed": passed,
        "unverified_citations": citation_detail,
        "rationale_present": bool(rationale),
        "confidence_valid": confidence_valid,
    }
    return details


# ---------------------------------------------------------------------------
# Precision / recall
# ---------------------------------------------------------------------------


def _compute_precision_recall(results):
    """
    Build the 3x3 confusion matrix and compute macro-averaged P and R.
    Returns (per_class, macro_precision, macro_recall, confusion_matrix).
    """
    # confusion[labeled][predicted] = count
    cm = {t: {t2: 0 for t2 in TIERS} for t in TIERS}

    for r in results:
        labeled = r["labeled_tier"]
        predicted = r["predicted_tier"]
        if labeled in TIERS and predicted in TIERS:
            cm[labeled][predicted] += 1

    per_class = {}
    precisions = []
    recalls = []

    for t in TIERS:
        tp = cm[t][t]
        fp = sum(cm[other][t] for other in TIERS if other != t)
        fn = sum(cm[t][other] for other in TIERS if other != t)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        per_class[t] = {"precision": precision, "recall": recall, "tp": tp, "fp": fp, "fn": fn}
        precisions.append(precision)
        recalls.append(recall)

    macro_precision = sum(precisions) / len(precisions)
    macro_recall = sum(recalls) / len(recalls)

    return per_class, macro_precision, macro_recall, cm


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def _print_confusion_matrix(cm):
    print("\n  Confusion Matrix (rows = labeled, columns = predicted):")
    header = "              " + "".join(f"  pred {t:6s}" for t in TIERS)
    print(header)
    for labeled in TIERS:
        row = f"  label {labeled:6s}"
        for predicted in TIERS:
            row += f"  {cm[labeled][predicted]:10d}"
        print(row)


def _print_rubric_table(scored):
    print("\n  Scenario rubric table:")
    print(f"  {'Scenario':<38} {'Label':6} {'Pred':6} {'Tier':4} {'Cite':4} {'Audit':5} {'Pass':4}")
    print("  " + "-" * 72)
    for s in scored:
        name = s["name"][:37]
        print(
            f"  {name:<38} {s['labeled_tier']:6} {s['predicted_tier']:6} "
            f"{'Y' if s['tier_ok'] else 'N':4} "
            f"{'Y' if s['citations_ok'] else 'N':4} "
            f"{'Y' if s['audit_ok'] else 'N':5} "
            f"{'PASS' if s['passed'] else 'FAIL':4}"
        )
        for uc in s["unverified_citations"]:
            print(f"    → {uc}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        print(
            "Usage: python golden-set/score.py <eval_export.json>\n"
            "  <eval_export.json>: output of uip agent eval run results <run_id> --output json",
            file=sys.stderr,
        )
        sys.exit(2)

    export_path = sys.argv[1]

    # 1. Load scenario labels and evidence bundles.
    scenarios = _load_scenarios()

    # 2. Load eval export.
    cases = _load_export(export_path)

    # 3. Map export cases to scenario IDs.
    #    Convention: the eval case 'name' field matches the scenario_id.
    graded_ids = []
    case_map = {}
    for case in cases:
        name = case["name"]
        graded_ids.append(name)
        case_map[name] = case

    # 4. FR-5: validate label set.
    _validate_label_set(scenarios, graded_ids)

    # 5. Score each case.
    scored = []
    for sid in graded_ids:
        scenario = scenarios[sid]
        actual = case_map[sid]["actualOutput"]
        details = _score_scenario(sid, scenario, actual)
        details["name"] = sid
        details["labeled_tier"] = scenario["risk_tier"]
        scored.append(details)

    # 6. Compute P/R.
    per_class, macro_p, macro_r, cm = _compute_precision_recall(scored)

    # 7. Count passes.
    passed_count = sum(1 for s in scored if s["passed"])
    verdict = "PROCEED" if passed_count >= PASS_BAR else "HOLD — FIX FIRST"

    # ---------------------------------------------------------------------------
    # Output
    # ---------------------------------------------------------------------------
    print("\n" + "=" * 72)
    print("  AURORA VERDICT — Golden-Set Accuracy Validation")
    print("  Dataset: SAML-D (berkanoztas/synthetic-transaction-monitoring-dataset-aml, MIT)")
    print("=" * 72)

    _print_rubric_table(scored)
    _print_confusion_matrix(cm)

    print("\n  Per-class precision and recall:")
    for t in TIERS:
        pc = per_class[t]
        print(
            f"    {t:6s}: precision = {pc['precision']:.4f}  recall = {pc['recall']:.4f}"
            f"  (TP={pc['tp']}, FP={pc['fp']}, FN={pc['fn']})"
        )
    print(f"\n  Macro precision : {macro_p:.4f}")
    print(f"  Macro recall    : {macro_r:.4f}")
    print(
        f"\n  NOTE: these figures are reported as real numbers with no hard pass "
        f"threshold. They are not a target to be framed as met or missed."
    )

    print(f"\n  Passed : {passed_count} / {GRADED_COUNT} scenarios")
    print(f"  Bar    : {PASS_BAR} / {GRADED_COUNT} to PROCEED")
    print(f"\n  Verdict: {verdict}")

    if verdict == "PROCEED":
        print(
            f"\n  The agent's reasoning is sufficiently sound. "
            f"Proceed to build the triage orchestration."
        )
    else:
        print(f"\n  Issues to fix before building the orchestration:")
        for s in scored:
            if not s["passed"]:
                reasons = []
                if not s["tier_ok"]:
                    reasons.append(
                        f"tier_ok=False (predicted '{s['predicted_tier']}', "
                        f"labeled '{s['labeled_tier']}')"
                    )
                if not s["citations_ok"]:
                    reasons.append(
                        "citations_ok=False"
                        + (f" — {'; '.join(s['unverified_citations'])}" if s["unverified_citations"] else " — zero citations")
                    )
                if not s["audit_ok"]:
                    sub = []
                    if not s["rationale_present"]:
                        sub.append("empty rationale")
                    if not s["confidence_valid"]:
                        sub.append(f"confidence={s['confidence']} out of [0,100]")
                    if not s["citations_ok"]:
                        sub.append("unverifiable citations")
                    reasons.append("audit_ok=False" + (f" ({', '.join(sub)})" if sub else ""))
                print(f"    • {s['name']}: {'; '.join(reasons)}")

    print("\n" + "=" * 72)

    sys.exit(0 if verdict == "PROCEED" else 1)


if __name__ == "__main__":
    main()
