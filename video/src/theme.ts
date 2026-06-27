import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily: FONT } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// Brand palette — dark, institutional, fintech.
export const C = {
  bg: "#0A0E1A",
  bg2: "#0E1426",
  panel: "#121A30",
  panelHi: "#16203A",
  border: "#243150",
  text: "#EAF0FA",
  muted: "#8C98B4",
  faint: "#5A6684",
  accent: "#5B8CFF",
  accent2: "#86A9FF",
  green: "#34D399",
  amber: "#F5B23D",
  red: "#FF6B6B",
  purple: "#A98BFF",
  cyan: "#46D6E6",
} as const;
