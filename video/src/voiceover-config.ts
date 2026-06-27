import script from "./script.json";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export type Scene = {
  id: string;
  durationSeconds: number;
  audioDelay: number;
  text: string;
};

// Single source of truth (src/script.json). Durations are refined to measured
// audio length by scripts/generate-voiceover.mjs.
export const SCENES: Scene[] = script as Scene[];

export const sceneFrames = (s: Scene): number =>
  Math.round(s.durationSeconds * FPS);

export const totalDurationInFrames = (): number =>
  SCENES.reduce((sum, s) => sum + sceneFrames(s), 0);
