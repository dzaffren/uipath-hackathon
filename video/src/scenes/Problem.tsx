import React from "react";
import { C } from "../theme";
import { Stage, Kicker, Headline, Pill } from "../components";

export const ProblemScene: React.FC = () => (
  <Stage>
    <Kicker delay={2}>The temptation</Kicker>
    <Headline delay={8}>
      AI can triage alerts.
      <br />
      It can never be accountable.
    </Headline>
    <div style={{ display: "flex", gap: 18, marginTop: 48 }}>
      <Pill tone="accent" delay={28}>
        ⚡ The speed of automation
      </Pill>
      <Pill tone="green" delay={36}>
        ⚖ A human decision, on the record
      </Pill>
    </div>
    <div
      style={{
        marginTop: 40,
        fontSize: 34,
        color: C.muted,
        maxWidth: 1320,
        lineHeight: 1.4,
      }}
    >
      Auto-closing or auto-escalating on a model’s say-so is exactly what a
      central-bank examiner will punish.
    </div>
  </Stage>
);
