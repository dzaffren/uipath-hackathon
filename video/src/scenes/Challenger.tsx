import React from "react";
import { C } from "../theme";
import { Stage, Kicker, Headline, DetectorChip, Pill } from "../components";

const DETECTORS = [
  "Sanctions",
  "Politically-exposed persons",
  "Structuring",
  "High-risk jurisdiction",
  "Watchlist",
];

export const ChallengerScene: React.FC = () => (
  <Stage>
    <Kicker delay={2} color={C.red}>
      Deterministic challenger
    </Kicker>
    <Headline delay={8}>Rules can overrule the AI.</Headline>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
        marginTop: 44,
        maxWidth: 1320,
      }}
    >
      {DETECTORS.map((d, i) => (
        <DetectorChip key={d} label={d} index={i} baseDelay={26} />
      ))}
    </div>
    <div style={{ marginTop: 40 }}>
      <Pill tone="red" delay={64} size={30}>
        Any hit → force-escalate to HIGH, whatever the model said
      </Pill>
    </div>
  </Stage>
);
