import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { theme } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 16 } });
  const ctaIn = interpolate(frame, [16, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 50% 45%, ${theme.bgGradTop}, ${theme.bgGradBottom})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          color: theme.gold,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: 5,
          opacity: logoIn,
          transform: `translateY(${interpolate(logoIn, [0, 1], [30, 0])}px)`,
          textShadow: `0 0 50px ${theme.gold}55`,
        }}
      >
        QONTAC
      </div>
      <div style={{ color: theme.text, fontSize: 40, fontWeight: 600, marginTop: 20, opacity: ctaIn }}>
        Sahada daha profesyonel, daha ölçülebilir.
      </div>
      <div
        style={{
          marginTop: 34,
          opacity: ctaIn,
          background: theme.gold,
          color: "#1a1408",
          fontSize: 36,
          fontWeight: 800,
          padding: "16px 40px",
          borderRadius: 16,
        }}
      >
        qontac.net
      </div>
    </AbsoluteFill>
  );
};
