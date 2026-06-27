import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { Stage, Kicker, Headline, Pill, BrowserFrame } from "../components";

export const StudioScene: React.FC = () => (
  <Stage pad={100}>
    <Kicker delay={2}>Not a mock-up · UiPath Studio Web</Kicker>
    <Headline delay={8} size={62}>
      A real Maestro project — open, version, audit.
    </Headline>
    <div
      style={{ display: "flex", gap: 40, marginTop: 34, alignItems: "center" }}
    >
      <BrowserFrame
        delay={18}
        title="UiPath Studio — AuroraVerdict"
        style={{ flex: "0 0 1180px" }}
      >
        <OffthreadVideo
          src={staticFile("footage/uipath-studio-cfr.mp4")}
          playbackRate={9.5}
          muted
          style={{
            width: 1180,
            height: 601,
            objectFit: "cover",
            display: "block",
          }}
        />
      </BrowserFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Pill tone="accent" delay={42} size={26}>
          Triage agent
        </Pill>
        <Pill tone="red" delay={50} size={26}>
          Challenger detectors
        </Pill>
        <Pill tone="amber" delay={58} size={26}>
          Decision gate
        </Pill>
        <Pill tone="green" delay={66} size={26}>
          Audit writer
        </Pill>
      </div>
    </div>
  </Stage>
);
