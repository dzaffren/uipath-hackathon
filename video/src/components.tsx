import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";
import { useFadeIn, useProgress, useRise, useSpringIn } from "./animations";

export const Stage: React.FC<{ children: React.ReactNode; pad?: number }> = ({
  children,
  pad = 130,
}) => {
  const f = useCurrentFrame();
  const glow = interpolate(f % 240, [0, 120, 240], [0.3, 0.5, 0.3]);
  return (
    <AbsoluteFill
      style={{ backgroundColor: C.bg, fontFamily: FONT, color: C.text }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(1300px 760px at 50% 12%, rgba(91,140,255,${glow * 0.22}), transparent 62%), radial-gradient(900px 620px at 88% 96%, rgba(169,139,255,0.10), transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "66px 66px",
          maskImage:
            "radial-gradient(circle at 50% 38%, black, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 38%, black, transparent 82%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: pad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{
  children: React.ReactNode;
  delay?: number;
  color?: string;
}> = ({ children, delay = 0, color = C.accent }) => {
  const o = useFadeIn(delay);
  const y = useRise(delay, 16);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 28,
      }}
    >
      <div
        style={{ width: 36, height: 3, background: color, borderRadius: 2 }}
      />
      <div
        style={{
          textTransform: "uppercase",
          letterSpacing: 6,
          fontSize: 23,
          fontWeight: 700,
          color,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Headline: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 4, size = 86 }) => {
  const o = useFadeIn(delay);
  const y = useRise(delay, 32);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.04,
        letterSpacing: -1.6,
        maxWidth: 1560,
      }}
    >
      {children}
    </div>
  );
};

export const Sub: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
}> = ({ children, delay = 16, size = 36 }) => {
  const o = useFadeIn(delay);
  const y = useRise(delay, 20);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        marginTop: 28,
        fontSize: size,
        color: C.muted,
        maxWidth: 1340,
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
};

export const Panel: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const s = useSpringIn(delay);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 26}px) scale(${0.975 + s * 0.025})`,
        background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        boxShadow: "0 34px 90px rgba(0,0,0,0.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

type Tone = "green" | "amber" | "red" | "accent" | "muted" | "purple";
const toneColor: Record<Tone, string> = {
  green: C.green,
  amber: C.amber,
  red: C.red,
  accent: C.accent,
  muted: C.muted,
  purple: C.purple,
};

export const Pill: React.FC<{
  children: React.ReactNode;
  tone?: Tone;
  delay?: number;
  size?: number;
}> = ({ children, tone = "muted", delay = 0, size = 27 }) => {
  const col = toneColor[tone];
  const s = useSpringIn(delay);
  return (
    <span
      style={{
        opacity: s,
        transform: `scale(${0.9 + s * 0.1})`,
        display: "inline-flex",
        alignItems: "center",
        gap: 11,
        padding: "12px 20px",
        borderRadius: 999,
        background: `${col}1A`,
        border: `1px solid ${col}55`,
        color: col,
        fontSize: size,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

export const ConfidenceBar: React.FC<{ pct: number; delay?: number }> = ({
  pct,
  delay = 0,
}) => {
  const p = useProgress(delay, delay + 34);
  const w = p * pct;
  const col = pct < 50 ? C.red : pct < 75 ? C.amber : C.green;
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: 24,
          borderRadius: 13,
          background: "#0A1124",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: `linear-gradient(90deg, ${col}, ${col}AA)`,
            borderRadius: 13,
          }}
        />
      </div>
      <div style={{ marginTop: 12, fontSize: 32, fontWeight: 800, color: col }}>
        {Math.round(w)}% confident
      </div>
    </div>
  );
};

export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  title?: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  title = "UiPath Orchestrator — AuroraVerdictRun",
  delay = 0,
  style,
}) => {
  const s = useSpringIn(delay);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 30}px) scale(${0.97 + s * 0.03})`,
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        background: C.panel,
        ...style,
      }}
    >
      <div
        style={{
          height: 56,
          background: "#0C1326",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#FF5F57",
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#FEBC2E",
          }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#28C840",
          }}
        />
        <div
          style={{
            marginLeft: 18,
            color: C.muted,
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

export const DetectorChip: React.FC<{
  label: string;
  index: number;
  baseDelay: number;
}> = ({ label, index, baseDelay }) => {
  const delay = baseDelay + index * 6;
  const s = useSpringIn(delay);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 20}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "20px 26px",
        borderRadius: 16,
        background: C.panel,
        border: `1px solid ${C.border}`,
        fontSize: 30,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: C.green,
          boxShadow: `0 0 16px ${C.green}`,
        }}
      />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ color: C.muted, fontSize: 24 }}>clear</span>
    </div>
  );
};

export const FlowNode: React.FC<{
  label: string;
  index: number;
  baseDelay: number;
  active?: boolean;
  color?: string;
}> = ({ label, index, baseDelay, color = C.accent }) => {
  const f = useCurrentFrame();
  const delay = baseDelay + index * 9;
  const s = useSpringIn(delay);
  const lit = interpolate(f, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: s,
        transform: `scale(${0.85 + s * 0.15})`,
        padding: "18px 22px",
        borderRadius: 14,
        background: `rgba(91,140,255,${0.06 + lit * 0.12})`,
        border: `1px solid ${color}${lit > 0.5 ? "99" : "44"}`,
        color: C.text,
        fontSize: 25,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: lit > 0.5 ? `0 0 26px rgba(91,140,255,0.25)` : "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

export const Arrow: React.FC<{ index: number; baseDelay: number }> = ({
  index,
  baseDelay,
}) => {
  const o = useFadeIn(baseDelay + index * 9 + 4, 8);
  return <div style={{ opacity: o, color: C.faint, fontSize: 30 }}>→</div>;
};
