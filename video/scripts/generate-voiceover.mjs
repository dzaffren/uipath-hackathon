// Generates per-scene narration and refines scene durations to the measured audio.
// Engine: ElevenLabs if video/.env has ELEVENLABS_API_KEY, else edge-tts (free, no key).
// The .env file is read ONLY here, and its contents are never printed.
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {parseFile} from 'music-metadata';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const scriptPath = join(root, 'src', 'script.json');
const outDir = join(root, 'public', 'voiceover');
if (!existsSync(outDir)) mkdirSync(outDir, {recursive: true});

const scenes = JSON.parse(readFileSync(scriptPath, 'utf8'));

// Resolve TTS engine.
let elevenKey = null;
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  const m = readFileSync(envPath, 'utf8').match(/ELEVENLABS_API_KEY\s*=\s*["']?([^"'\s]+)/);
  if (m && m[1] && !m[1].includes('your_free_key')) elevenKey = m[1].trim();
}
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9'; // "Daniel" - authoritative British male
const EDGE_VOICE = process.env.EDGE_VOICE || 'en-US-GuyNeural';
const engine = elevenKey ? 'elevenlabs' : 'edge-tts';
const TAIL_PAD = 0.9; // seconds of breathing room after narration

console.log(`TTS engine: ${engine}${engine === 'elevenlabs' ? ` (voice ${ELEVEN_VOICE})` : ` (voice ${EDGE_VOICE})`}`);

function synthEdge(text, outFile) {
  // shell:true is needed on Windows to resolve the edge-tts shim; build one command
  // string with the (quote-free) narration in double quotes to keep it a single arg.
  const safe = text.replace(/"/g, '');
  const cmd = `edge-tts --voice ${EDGE_VOICE} --text "${safe}" --write-media "${outFile}"`;
  const r = spawnSync(cmd, {stdio: ['ignore', 'ignore', 'inherit'], shell: true});
  if (r.status !== 0) throw new Error('edge-tts failed for ' + outFile);
}

async function synthEleven(text, outFile) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {'xi-api-key': elevenKey, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {stability: 0.5, similarity_boost: 0.7, style: 0.15, use_speaker_boost: true, speed: 1.06},
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
}

let total = 0;
for (const s of scenes) {
  const outFile = join(outDir, `${s.id}.mp3`);
  if (engine === 'elevenlabs') await synthEleven(s.text, outFile);
  else synthEdge(s.text, outFile);
  const meta = await parseFile(outFile);
  const len = meta.format.duration || 0;
  s.durationSeconds = Math.round((s.audioDelay + len + TAIL_PAD) * 100) / 100;
  total += s.durationSeconds;
  console.log(`  ${s.id.padEnd(13)} audio ${len.toFixed(2)}s  -> slot ${s.durationSeconds}s`);
}

writeFileSync(scriptPath, JSON.stringify(scenes, null, 2) + '\n');
console.log(`\nUpdated ${scriptPath}`);
console.log(`Total video length: ${total.toFixed(1)}s (${Math.floor(total / 60)}m ${Math.round(total % 60)}s)`);
