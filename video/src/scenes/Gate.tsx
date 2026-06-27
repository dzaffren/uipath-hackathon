import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Stage, Kicker, Headline } from "../components";
import { useSpringIn } from "../animations";

const Bar: React.FC<{
  label: string;
  w: number;
  color: string;
  delay: number;
  big?: boolean;
}> = ({ label, w, color, delay, big }) => {
  const s = useSpringIn(delay);
  return (
    <div
      style={{
        opacity: s,
        display: "flex",
        alignItems: "center",
        gap: 22,
        marginBottom: big ? 0 : 16,
      }}
    >
      <div
        style={{
          width: 340,
          textAlign: "right",
          color: big ? C.green : C.muted,
          fontSize: big ? 30 : 24,
          fontWeight: big ? 700 : 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: big ? 56 : 18,
          width: w * s,
          background: `linear-gradient(90deg, ${color}, ${color}AA)`,
          borderRadius: 10,
          boxShadow: big ? `0 0 34px ${color}66` : "none",
        }}
      />
      {big ? (
        <div style={{ color, fontSize: 36, fontWeight: 800 }}>30.43s</div>
      ) : null}
    </div>
  );
};

export const GateScene: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 1 + Math.sin(f / 6) * 0.01;
  return (
    <Stage>
      <Kicker delay={2} color={C.green}>
        The moment that matters
      </Kicker>
      <Headline delay={8}>It stops, and waits for a human.</Headline>
      <div
        style={{
          marginTop: 56,
          transform: `scale(${pulse})`,
          transformOrigin: "left center",
        }}
      >
        <Bar label="Gather Evidence" w={26} color={C.accent} delay={24} />
        <Bar label="Triage Agent" w={40} color={C.accent} delay={30} />
        <Bar label="Decision Gate" w={16} color={C.accent} delay={36} />
        <Bar
          label="Await human sign-off"
          w={760}
          color={C.green}
          delay={46}
          big
        />
      </div>
      <div style={{ marginTop: 34, fontSize: 32, color: C.muted }}>
        30 seconds — while every other step is milliseconds.
      </div>
    </Stage>
  );
};
