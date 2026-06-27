import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const useFadeIn = (delay = 0, dur = 16): number => {
  const f = useCurrentFrame();
  return interpolate(f, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const useSpringIn = (delay = 0, damping = 200, mass = 0.9): number => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping, mass } });
};

export const useRise = (delay = 0, dist = 40): number => {
  const s = useSpringIn(delay);
  return (1 - s) * dist;
};

export const useFloat = (speed = 1, amp = 8, phase = 0): number => {
  const f = useCurrentFrame();
  return Math.sin(f / (30 / speed) + phase) * amp;
};

export const useProgress = (start: number, end: number): number => {
  const f = useCurrentFrame();
  return interpolate(f, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};
