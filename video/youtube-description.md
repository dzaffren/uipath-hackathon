# YouTube description — paste into the video's description box

---

Aurora Verdict — Defensible AML alert triage on UiPath Maestro
UiPath AgentHack 2026 · Track 2 (Maestro BPMN)

AI can triage a money-laundering alert in seconds. It can never be accountable
for the decision. Aurora Verdict is a UiPath Maestro BPMN agent that keeps the
speed of automation while putting a human signature — and an immutable record —
behind every verdict.

What you're seeing:
• A real alert (Cedar Imports, RM 85,000 to a brand-new overseas counterparty)
that is genuinely ambiguous — no rule fires, so it must be adjudicated.
• A Claude agent that triages the evidence, returns a MEDIUM / 62%-confidence
verdict, validates its own citations, and is guarded against prompt injection.
• A deterministic challenger (sanctions, PEP, structuring, jurisdiction,
watchlist) that can overrule the model and force-escalate.
• A human-in-the-loop sign-off gate — the orchestration stops and waits.
• The same alert resolved two ways (sign-off → closed, override → escalated),
each written to an immutable DecisionRecord.

How it's built:
• UiPath Maestro BPMN orchestration
• Claude agent for triage and reasoning
• Deterministic rule detectors as a challenger layer
• Append-only DecisionRecord audit store

Built with Claude Code — the agent, the BPMN orchestration, and even this demo
video (rendered with Remotion) were authored with Claude Code.

#UiPath #AgentHack #Maestro #AML #Claude #AgenticAI
