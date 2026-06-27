# Aurora Verdict — submission video

A ~2m40s motion-graphics demo for the UiPath AgentHack 2026 submission (Track 2,
Maestro BPMN). Built code-first with **Remotion** (React → MP4), narrated with
neural TTS, and featuring **real footage** of the deployed Maestro job and the
immutable DecisionRecord.

- Output: `out/aurora-verdict.mp4` (1920×1080, H.264, with voiceover)
- Source of truth for narration + timing: `src/script.json`
- The "functioning footage" judges require: `public/moneyshots.gif`
  (real UiPath Orchestrator — sign-off → closed, and override → escalated)

## Scenes (9)

intro → problem → case (ALERT-2026-0488, Cedar Imports) → orchestration (BPMN
pipeline) → verdict (Claude, MEDIUM / 62%) → challenger (deterministic
detectors) → gate (human sign-off, 30s wait) → outcomes (the real GIF + two
immutable records) → close.

## Voiceover

The draft renders with a free **edge-tts** placeholder voice (no key needed).
For the final, swap in **ElevenLabs** (free tier, far better quality):

1. Create a free account at elevenlabs.io and copy your API key (starts `sk_`).
2. Put it in `video/.env` (this file is git-ignored, never committed):
   ```
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Optionally set `ELEVENLABS_VOICE_ID=...` to pick a specific voice.
3. Regenerate the narration — the generator auto-detects the key and switches
   engines, then re-measures each clip and rewrites the scene timings:
   ```
   node scripts/generate-voiceover.mjs
   ```
4. Re-render (see below).

> The free tier (~10k credits/mo) is enough for ~25 full re-renders of this script.

## Render

```
npm install                 # first time only
npm run render              # → out/aurora-verdict.mp4
```

Live-preview while editing scenes:

```
npm run studio
```

## Built with Claude Code

This entire video pipeline — the Remotion composition, the 9 scene components,
the dual-engine TTS generator, and the timing/sync logic — was authored with
**Claude Code**, the same way the Aurora Verdict agent and its UiPath Maestro
BPMN orchestration were built. (Documented Claude Code use is a judging bonus.)

## Upload checklist (you do this — I can't post to your account)

1. Watch `out/aurora-verdict.mp4` end to end; confirm audio + captions sync.
2. Upload to **YouTube** (or Vimeo) as **Public** or **Unlisted** (must be
   publicly viewable by judges).
3. Title: `Aurora Verdict — Defensible AML Triage on UiPath Maestro`
4. Paste the description from `youtube-description.md`.
5. Put the watch URL in the Devpost / submission form video field.

Rules check: < 5 min ✓ · English ✓ · shows the project functioning ✓ ·
no copyrighted music ✓.
