// Generates a YouTube-ready .srt sidecar from script.json, timed to the render.
// One cue per sentence, distributed across each scene's narration window.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const scenes = JSON.parse(
  readFileSync(join(root, "src", "script.json"), "utf8"),
);

const FPS = 30;
const TAIL_PAD = 0.9; // matches generate-voiceover: duration = delay + audio + 0.9

const pad = (n, w = 2) => String(n).padStart(w, "0");
function fmt(t) {
  if (t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ms = Math.round((t - Math.floor(t)) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function sentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [text];
  return parts.map((s) => s.trim()).filter(Boolean);
}

const cues = [];
let tf = 0; // elapsed frames
for (const sc of scenes) {
  const sceneFrames = Math.round(sc.durationSeconds * FPS);
  const delayFrames = Math.round(sc.audioDelay * FPS);
  const start = (tf + delayFrames) / FPS;
  const span = Math.max(0.8, sc.durationSeconds - sc.audioDelay - TAIL_PAD);
  const ss = sentences(sc.text);
  const totalChars = ss.reduce((a, s) => a + s.length, 0) || 1;
  let cur = start;
  for (const s of ss) {
    const cueEnd = cur + span * (s.length / totalChars);
    cues.push({ start: cur, end: cueEnd, text: s });
    cur = cueEnd;
  }
  tf += sceneFrames;
}

let srt = "";
cues.forEach((c, i) => {
  srt += `${i + 1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n\n`;
});

const outPath = join(root, "out", "aurora-verdict.srt");
writeFileSync(outPath, srt);
console.log(`Wrote ${cues.length} cues to ${outPath}`);
console.log(`Total: ${(tf / FPS).toFixed(1)}s`);
