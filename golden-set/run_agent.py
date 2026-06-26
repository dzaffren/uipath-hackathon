"""
golden-set/run_agent.py — invoke the deployed TriageAgent over the golden set.

Why this exists:
    `uip agent eval run results` only exports the EVALUATOR verdict (e.g. Exact
    Match on risk_tier) plus run metadata — it does NOT export the agent's actual
    output (citations / confidence / rationale).  The 3-point rubric in score.py
    needs that output to compute `citations_ok` and `audit_ok`.  So we capture the
    agent's structured output directly by running the deployed agent as an
    Orchestrator job, one job per scenario, and persist the normalized result.

What it does:
    1. Discovers the latest deployed TriageAgent release via `uip agent run list`.
    2. For each golden-set/scenarios/*.json, builds the agent input
       {alert_reference, customer_name, evidence_bundle} from the SAME scenario
       file that score.py validates citations against (single source of truth).
    3. Starts an agent job, polls until terminal, and writes the normalized output
       to golden-set/agent-outputs/<scenario_id>.json.

Usage:
    python golden-set/run_agent.py [--release-key KEY --folder-id ID]

    Auth: requires an authenticated `uip` session (uip login).  Release/folder are
    auto-discovered by default; override with the flags for a specific deployment.

Output shape (one file per scenario, consumed by score.py):
    {
      "scenario_id": "...", "job_id": 123, "state": "Successful",
      "risk_tier": "low", "confidence": 96, "recommendation": "close",
      "rationale": "...", "citations": ["...#EV-001", ...],
      "raw_output": { ...the agent's raw Output object... }
    }
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(__file__)
SCENARIO_DIR = os.path.join(HERE, "scenarios")
OUTPUT_DIR = os.path.join(HERE, "agent-outputs")

AGENT_NAME = "TriageAgent"
POLL_INTERVAL_S = 3
JOB_TIMEOUT_S = 180
TERMINAL_STATES = {"Successful", "Faulted", "Stopped"}

UIP = shutil.which("uip") or shutil.which("uip.cmd")


def _fail(msg, code=1):
    print(f"\nERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def _uip(args):
    """Run a `uip` command, returning the parsed JSON envelope (Data on success)."""
    if not UIP:
        _fail("`uip` CLI not found on PATH. Run `uip login` and ensure it is installed.")
    proc = subprocess.run(
        [UIP, *args, "--output", "json"],
        capture_output=True, text=True, shell=False,
    )
    out = proc.stdout.strip()
    if not out:
        _fail(f"`uip {' '.join(args)}` produced no stdout. stderr:\n{proc.stderr.strip()}")
    try:
        env = json.loads(out)
    except json.JSONDecodeError:
        # Some commands stream multiple JSON objects / status lines; take the last full object.
        env = None
        for line in reversed(out.splitlines()):
            line = line.strip()
            if line.startswith("{"):
                try:
                    env = json.loads(line)
                    break
                except json.JSONDecodeError:
                    continue
        if env is None:
            _fail(f"Could not parse JSON from `uip {' '.join(args)}`:\n{out[:2000]}")
    if env.get("Result") not in ("Success", None):
        _fail(f"`uip {' '.join(args)}` failed: {env.get('Message')} | {env.get('Instructions')}")
    return env


def _cmd_safe_json(obj):
    """
    Serialize JSON so it survives the Windows cmd.exe shim that `uip.cmd` runs under.

    `uip` resolves to a .cmd, so subprocess routes the args through cmd.exe, which
    interprets `< > & | ^ ( ) % !` as shell metacharacters (e.g. GS-04's text
    "Account is <6 months old" / ">RM5,000" caused redirection errors).  We encode
    those characters — which only ever appear inside JSON string *values* here — as
    JSON \\uXXXX escapes.  uip's JSON parser decodes them back to the original
    characters, but the command line itself contains no cmd metacharacters.
    ensure_ascii=True additionally keeps the whole arg pure ASCII (no console
    code-page ambiguity on non-ASCII text such as em-dashes).
    """
    s = json.dumps(obj, ensure_ascii=True)
    repl = {
        "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", "|": "\\u007c",
        "^": "\\u005e", "(": "\\u0028", ")": "\\u0029", "%": "\\u0025",
        "!": "\\u0021",
    }
    for ch, esc in repl.items():
        s = s.replace(ch, esc)
    return s


def _semver_key(v):
    parts = []
    for p in str(v).split("."):
        try:
            parts.append(int(p))
        except ValueError:
            parts.append(0)
    return parts


def discover_release():
    """Return (release_key, folder_id) of the latest deployed TriageAgent."""
    env = _uip(["agent", "run", "list"])
    releases = [r for r in env.get("Data", []) if r.get("Name") == AGENT_NAME]
    if not releases:
        _fail(f"No deployed '{AGENT_NAME}' release found via `uip agent run list`.")
    latest = max(releases, key=lambda r: _semver_key(r.get("Version", "0")))
    print(f"  Using {AGENT_NAME} v{latest['Version']} "
          f"(folder {latest['FolderId']}, release {latest['ReleaseKey']})")
    return latest["ReleaseKey"], str(latest["FolderId"])


def load_scenarios():
    if not os.path.isdir(SCENARIO_DIR):
        _fail(f"Scenario directory not found: {SCENARIO_DIR}")
    scenarios = []
    for fname in sorted(os.listdir(SCENARIO_DIR)):
        if not fname.endswith(".json"):
            continue
        data = json.load(open(os.path.join(SCENARIO_DIR, fname), encoding="utf-8"))
        for field in ("scenario_id", "alert_reference", "customer_name", "evidence_bundle"):
            if field not in data:
                _fail(f"Scenario {fname} missing required field '{field}'.")
        scenarios.append(data)
    return scenarios


def run_scenario(scenario, release_key, folder_id):
    sid = scenario["scenario_id"]
    agent_input = {
        "alert_reference": scenario["alert_reference"],
        "customer_name": scenario["customer_name"],
        "evidence_bundle": scenario["evidence_bundle"],
    }
    start = _uip([
        "agent", "run", "start", release_key,
        "-i", _cmd_safe_json(agent_input),
        "--folder-id", folder_id,
    ])
    job_id = start["Data"]["JobId"]
    print(f"  {sid}: job {job_id} started", end="", flush=True)

    waited = 0
    state = start["Data"].get("State", "Pending")
    status = None
    while state not in TERMINAL_STATES and waited < JOB_TIMEOUT_S:
        time.sleep(POLL_INTERVAL_S)
        waited += POLL_INTERVAL_S
        status = _uip(["agent", "run", "status", str(job_id), "--folder-id", folder_id])
        state = status["Data"].get("State", "Unknown")
        print(".", end="", flush=True)
    print(f" {state} ({waited}s)")

    out = (status or start)["Data"].get("Output") or {}
    return {
        "scenario_id": sid,
        "job_id": job_id,
        "state": state,
        "risk_tier": (out.get("RiskTier") or "").strip().lower() or None,
        "confidence": out.get("Confidence"),
        "recommendation": out.get("Recommendation"),
        "rationale": out.get("Rationale") or "",
        "citations": out.get("Citations") or [],
        "raw_output": out,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--release-key")
    ap.add_argument("--folder-id")
    args = ap.parse_args()

    print("=" * 72)
    print("  Golden-set agent invocation harness")
    print("=" * 72)

    if args.release_key and args.folder_id:
        release_key, folder_id = args.release_key, str(args.folder_id)
        print(f"  Using release {release_key} (folder {folder_id})")
    else:
        release_key, folder_id = discover_release()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    scenarios = load_scenarios()
    print(f"  {len(scenarios)} scenarios\n")

    results = []
    for s in scenarios:
        res = run_scenario(s, release_key, folder_id)
        path = os.path.join(OUTPUT_DIR, res["scenario_id"] + ".json")
        json.dump(res, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        results.append(res)

    ok = sum(1 for r in results if r["state"] == "Successful")
    print(f"\n  {ok}/{len(results)} jobs Successful. Outputs in {OUTPUT_DIR}/")
    if ok != len(results):
        for r in results:
            if r["state"] != "Successful":
                print(f"    ! {r['scenario_id']}: {r['state']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
