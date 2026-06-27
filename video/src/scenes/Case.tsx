import React from "react";
import { C } from "../theme";
import { Stage, Kicker, Panel, Pill } from "../components";

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 0",
      borderBottom: `1px solid ${C.border}`,
      fontSize: 31,
    }}
  >
    <span style={{ color: C.muted }}>{k}</span>
    <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
  </div>
);

export const CaseScene: React.FC = () => (
  <Stage>
    <Kicker delay={2}>A real alert · ALERT-2026-0488</Kicker>
    <div
      style={{ display: "flex", gap: 50, alignItems: "center", marginTop: 8 }}
    >
      <Panel delay={8} style={{ padding: "8px 46px", flex: 1, maxWidth: 1000 }}>
        <div style={{ fontSize: 46, fontWeight: 800, padding: "28px 0 8px" }}>
          Cedar Imports Sdn Bhd
        </div>
        <Row k="Amount" v="RM 85,000 · 2 wire transfers" />
        <Row k="Counterparty" v="Eastern Pacific Trading" />
        <Row
          k="Relationship"
          v={
            <span style={{ color: C.amber }}>
              New · overseas · no prior history
            </span>
          }
        />
        <Row k="Screening" v={<span style={{ color: C.green }}>CLEAR</span>} />
      </Panel>
      <div style={{ flex: "0 0 360px", textAlign: "center" }}>
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: C.amber,
            lineHeight: 1,
          }}
        >
          ?
        </div>
        <div style={{ marginTop: 14 }}>
          <Pill tone="amber" delay={36}>
            Genuinely ambiguous
          </Pill>
        </div>
      </div>
    </div>
  </Stage>
);
