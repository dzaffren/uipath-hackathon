// Re-measures the existing voiceover MP3s and rewrites scene durations in
// script.json. Use after post-processing the clips (e.g. atempo) — no TTS calls.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { parseFile } from "music-metadata";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const scriptPath = join(root, "src", "script.json");
const scenes = JSON.parse(readFileSync(scriptPath, "utf8"));
const TAIL_PAD = 0.9;

let total = 0;
for (const s of scenes) {
  const f = join(root, "public", "voiceover", `${s.id}.mp3`);
  const meta = await parseFile(f);
  const len = meta.format.duration || 0;
  s.durationSeconds = Math.round((s.audioDelay + len + TAIL_PAD) * 100) / 100;
  total += s.durationSeconds;
  console.log(`  ${s.id.padEnd(13)} ${len.toFixed(2)}s -> ${s.durationSeconds}s`);
}

writeFileSync(scriptPath, JSON.stringify(scenes, null, 2) + "\n");
console.log(
  `Total: ${total.toFixed(1)}s (${Math.floor(total / 60)}m ${Math.round(total % 60)}s)`,
);
