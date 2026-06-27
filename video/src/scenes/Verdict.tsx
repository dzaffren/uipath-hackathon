import React from "react";
import { C } from "../theme";
import {
  Stage,
  Kicker,
  Headline,
  Panel,
  Pill,
  ConfidenceBar,
} from "../components";

export const VerdictScene: React.FC = () => (
  <Stage>
    <Kicker delay={2}>First stop · the triage agent</Kicker>
    <Headline delay={8} size={78}>
      Medium risk — but only 62% sure.
    </Headline>
    <div
      style={{ display: "flex", gap: 40, marginTop: 40, alignItems: "stretch" }}
    >
      <Panel delay={20} style={{ padding: 44, flex: 1, maxWidth: 780 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 32,
            marginBottom: 28,
          }}
        >
          <span style={{ color: C.muted }}>risk_tier</span>
          <span style={{ fontWeight: 800, color: C.amber }}>MEDIUM</span>
        </div>
        <ConfidenceBar pct={62} delay={30} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            marginTop: 30,
            paddingTop: 26,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <span style={{ color: C.muted }}>golden-set accuracy</span>
          <span style={{ fontWeight: 800, color: C.green }}>8 / 8</span>
        </div>
      </Panel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          justifyContent: "center",
        }}
      >
        <Pill tone="green" delay={42}>
          ✓ Prompt-injection guardrail
        </Pill>
        <Pill tone="green" delay={50}>
          ✓ Citations validated · 4 / 4
        </Pill>
        <Pill tone="green" delay={58}>
          ✓ No hallucinated sources
        </Pill>
      </div>
    </div>
  </Stage>
);
