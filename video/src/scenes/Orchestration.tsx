import React from "react";
import { Stage, Kicker, Headline, FlowNode, Arrow } from "../components";

const STEPS = [
  "Gather Evidence",
  "Triage Agent",
  "Decision Gate",
  "Route",
  "Human Sign-off",
  "Build Audit",
  "Decision Record",
];

export const OrchestrationScene: React.FC = () => (
  <Stage>
    <Kicker delay={2}>UiPath Maestro · BPMN</Kicker>
    <Headline delay={8} size={76}>
      A real orchestration.
      <br />
      Every step is an auditable node.
    </Headline>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginTop: 64,
        flexWrap: "wrap",
      }}
    >
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <FlowNode label={s} index={i} baseDelay={28} />
          {i < STEPS.length - 1 && <Arrow index={i} baseDelay={28} />}
        </React.Fragment>
      ))}
    </div>
  </Stage>
);
