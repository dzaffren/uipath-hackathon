import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Stage } from "../components";
import { useFadeIn, useRise } from "../animations";

export const IntroScene: React.FC = () => {
  const o = useFadeIn(6);
  const y = useRise(6, 36);
  const tag = useFadeIn(24);
  const badges = useFadeIn(36);
  return (
    <Stage>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ opacity: o, transform: `translateY(${y}px)` }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 900,
              letterSpacing: -3,
              background: `linear-gradient(180deg, #FFFFFF, ${C.accent2})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Aurora Verdict
          </div>
        </div>
        <div
          style={{ opacity: tag, fontSize: 42, color: C.muted, marginTop: 20 }}
        >
          Defensible AML alert triage on UiPath Maestro
        </div>
        <div
          style={{ opacity: tag, fontSize: 25, color: C.faint, marginTop: 14 }}
        >
          Inspired by the BIS Project Aurora AML research
        </div>
        <div
          style={{ opacity: badges, marginTop: 44, display: "flex", gap: 18 }}
        >
          {["UiPath Maestro BPMN", "Claude agent", "Track 2"].map((b) => (
            <span
              key={b}
              style={{
                padding: "13px 24px",
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: C.panel,
                color: C.text,
                fontSize: 26,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};
