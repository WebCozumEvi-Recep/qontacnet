import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { theme } from "../theme";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const lineW = interpolate(spring({ frame: frame - 14, fps, config: { damping: 200 } }), [0, 1], [0, 320]);
  const subIn = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 50% 35%, ${theme.bgGradTop}, ${theme.bgGradBottom})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, sans-serif",
        opacity: out,
      }}
    >
      <div
        style={{
          color: theme.gold,
          fontSize: 130,
          fontWeight: 900,
          letterSpacing: 6,
          transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`,
          opacity: logoIn,
          textShadow: `0 0 60px ${theme.gold}55`,
        }}
      >
        QONTAC
      </div>
      <div style={{ height: 5, width: lineW, background: theme.gold, borderRadius: 4, margin: "26px 0 30px" }} />
      <div style={{ color: theme.text, fontSize: 46, fontWeight: 700, opacity: subIn }}>
        Üye Yönetim Paneli
      </div>
      <div style={{ color: theme.textDim, fontSize: 32, fontWeight: 500, marginTop: 12, opacity: subIn }}>
        Dijital kartınız nasıl çalışır?
      </div>
    </AbsoluteFill>
  );
};
