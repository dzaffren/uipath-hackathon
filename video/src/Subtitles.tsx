import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";

export const Subtitle: React.FC<{ text: string; frames: number }> = ({
  text,
  frames,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [3, 13, frames - 8, frames - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 66,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          opacity: o,
          maxWidth: 1620,
          textAlign: "center",
          fontSize: 29,
          lineHeight: 1.38,
          color: C.text,
          background: "rgba(6,10,20,0.66)",
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "18px 32px",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
