import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { C } from "../theme";
import { Stage, Kicker, Headline, BrowserFrame } from "../components";

export const ClaudeCodeScene: React.FC = () => (
  <Stage pad={100}>
    <Kicker delay={2} color={C.purple}>
      Built with Claude Code
    </Kicker>
    <Headline delay={8} size={60}>
      The agent, the orchestration — and this video.
    </Headline>
    <BrowserFrame
      delay={18}
      title="Claude Code — building Aurora Verdict"
      style={{ width: 1280, marginTop: 34 }}
    >
      <OffthreadVideo
        src={staticFile("footage/claude-code-cfr.mp4")}
        playbackRate={23}
        muted
        style={{
          width: 1280,
          height: 647,
          objectFit: "cover",
          display: "block",
        }}
      />
    </BrowserFrame>
  </Stage>
);
