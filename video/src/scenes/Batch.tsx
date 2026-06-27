import React from "react";
import { C } from "../theme";
import { Stage, Kicker, Headline, Pill } from "../components";
import { useSpringIn } from "../animations";

const Chip: React.FC<{ i: number; pulled?: boolean }> = ({ i, pulled }) => {
  const s = useSpringIn(18 + i * 1.1);
  return (
    <div
      style={{
        opacity: s,
        transform: `scale(${s})`,
        height: 46,
        borderRadius: 8,
        border: `1px solid ${pulled ? C.amber : C.border}`,
        background: pulled ? "rgba(245,178,61,0.12)" : C.panel,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 13px",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: pulled ? C.amber : C.green,
        }}
      />
      <div
        style={{
          height: 6,
          width: pulled ? 64 : 48,
          borderRadius: 999,
          background: pulled ? C.amber : C.faint,
          opacity: 0.7,
        }}
      />
    </div>
  );
};

export const BatchScene: React.FC = () => {
  const pulled = new Set([4, 12, 19, 25]);
  return (
    <Stage>
      <Kicker delay={2} color={C.green}>
        The high-volume risk
      </Kicker>
      <Headline delay={8} size={60}>
        Most alerts are low-risk. None close in the dark.
      </Headline>
      <div
        style={{
          display: "flex",
          gap: 44,
          marginTop: 42,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: "0 0 1020px",
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <Chip key={i} i={i} pulled={pulled.has(i)} />
          ))}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}
        >
          <Pill tone="amber" delay={48} size={25}>
            Sampled 5% pulled
          </Pill>
          <Pill tone="amber" delay={56} size={25}>
            Every ≥ RM 250k pulled
          </Pill>
          <Pill tone="green" delay={66} size={27}>
            1 supervisor signs the batch
          </Pill>
          <div
            style={{
              marginTop: 6,
              color: C.muted,
              fontSize: 25,
              lineHeight: 1.5,
            }}
          >
            Auto-sorted, never silently closed —
            <br />a human name on every disposition.
          </div>
        </div>
      </div>
    </Stage>
  );
};
