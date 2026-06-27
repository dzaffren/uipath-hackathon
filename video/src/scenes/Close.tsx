import React from "react";
import { C } from "../theme";
import { Stage } from "../components";
import { useFadeIn, useRise } from "../animations";

const Line: React.FC<{
  children: React.ReactNode;
  delay: number;
  color: string;
}> = ({ children, delay, color }) => {
  const o = useFadeIn(delay);
  const y = useRise(delay, 18);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        fontSize: 54,
        fontWeight: 700,
        color,
      }}
    >
      {children}
    </div>
  );
};

export const CloseScene: React.FC = () => {
  const title = useFadeIn(72);
  return (
    <Stage>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Line delay={6} color={C.accent}>
          AI proposes.
        </Line>
        <Line delay={18} color={C.red}>
          Rules challenge.
        </Line>
        <Line delay={30} color={C.green}>
          A human signs.
        </Line>
        <Line delay={42} color={C.text}>
          The record is permanent.
        </Line>
      </div>
      <div style={{ opacity: title, marginTop: 66 }}>
        <div style={{ fontSize: 90, fontWeight: 900, letterSpacing: -2 }}>
          Aurora Verdict
        </div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 16 }}>
          Built with Claude Code · UiPath Maestro BPMN · AgentHack 2026
        </div>
      </div>
    </Stage>
  );
};
