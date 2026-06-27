import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, staticFile } from "remotion";
import { FPS, SCENES, sceneFrames } from "./voiceover-config";
import { C, FONT } from "./theme";
import { IntroScene } from "./scenes/Intro";
import { ProblemScene } from "./scenes/Problem";
import { BatchScene } from "./scenes/Batch";
import { CaseScene } from "./scenes/Case";
import { OrchestrationScene } from "./scenes/Orchestration";
import { StudioScene } from "./scenes/Studio";
import { VerdictScene } from "./scenes/Verdict";
import { ChallengerScene } from "./scenes/Challenger";
import { GateScene } from "./scenes/Gate";
import { OutcomesScene } from "./scenes/Outcomes";
import { ClaudeCodeScene } from "./scenes/ClaudeCode";
import { CloseScene } from "./scenes/Close";

const MAP: Record<string, React.FC> = {
  intro: IntroScene,
  problem: ProblemScene,
  batch: BatchScene,
  case: CaseScene,
  orchestration: OrchestrationScene,
  studio: StudioScene,
  verdict: VerdictScene,
  challenger: ChallengerScene,
  gate: GateScene,
  outcomes: OutcomesScene,
  claudecode: ClaudeCodeScene,
  close: CloseScene,
};

export const AuroraVerdict: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
      <Series>
        {SCENES.map((s) => {
          const Comp = MAP[s.id];
          const frames = sceneFrames(s);
          const delay = Math.round(s.audioDelay * FPS);
          return (
            <Series.Sequence durationInFrames={frames} key={s.id}>
              <Comp />
              <Sequence from={delay} name={`vo-${s.id}`}>
                <Audio src={staticFile(`voiceover/${s.id}.mp3`)} />
              </Sequence>
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
