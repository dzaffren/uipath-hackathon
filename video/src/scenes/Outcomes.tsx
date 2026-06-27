import React from "react";
import { staticFile } from "remotion";
import { Gif } from "@remotion/gif";
import { C } from "../theme";
import { Stage, Kicker, Headline, Pill, BrowserFrame } from "../components";

export const OutcomesScene: React.FC = () => (
  <Stage pad={100}>
    <Kicker delay={2}>On the record</Kicker>
    <Headline delay={8} size={70}>
      Two endings. One permanent record.
    </Headline>
    <div
      style={{ display: "flex", gap: 46, marginTop: 40, alignItems: "center" }}
    >
      <BrowserFrame delay={18} style={{ flex: "0 0 1000px" }}>
        <Gif
          src={staticFile("moneyshots.gif")}
          width={1000}
          height={476}
          fit="cover"
        />
      </BrowserFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Pill tone="green" delay={42} size={31}>
          signed_agree → closed
        </Pill>
        <Pill tone="red" delay={52} size={31}>
          override → escalated
        </Pill>
        <div
          style={{
            marginTop: 12,
            color: C.muted,
            fontSize: 26,
            lineHeight: 1.55,
          }}
        >
          analyst name · reasoning · timestamp
          <br />
          <span style={{ color: C.faint }}>
            DecisionRecordId a0000006 · cannot be altered
          </span>
        </div>
      </div>
    </div>
  </Stage>
);
