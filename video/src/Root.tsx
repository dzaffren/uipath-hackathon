import React from "react";
import { Composition } from "remotion";
import { AuroraVerdict } from "./AuroraVerdict";
import { FPS, HEIGHT, totalDurationInFrames, WIDTH } from "./voiceover-config";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AuroraVerdict"
      component={AuroraVerdict}
      durationInFrames={totalDurationInFrames()}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
