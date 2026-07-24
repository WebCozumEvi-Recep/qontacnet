import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
import { theme } from "./theme";

// Enerjik, hareketli lacivert arka plan: ışık huzmeleri + altın parçacıklar.
export const Bg: React.FC<{ flash?: boolean }> = ({ flash }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const particles = new Array(36).fill(0).map((_, i) => {
    const seedX = random(`x${i}`);
    const seedSpeed = 0.4 + random(`s${i}`) * 1.2;
    const x = seedX * width;
    const y = (height - ((frame * seedSpeed * 4 + random(`o${i}`) * height) % (height + 100)));
    const size = 3 + random(`r${i}`) * 7;
    const op = 0.2 + random(`a${i}`) * 0.5;
    return { x, y, size, op, key: i };
  });

  const sweep = interpolate(frame % (fps * 4), [0, fps * 4], [-width, width]);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 20%, ${theme.navy}, ${theme.navyDeep} 70%, #0c1530)` }}>
      {/* dönen ışık huzmesi */}
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -200,
          width: 280,
          height: height + 400,
          background: `linear-gradient(90deg, transparent, ${theme.gold}22, transparent)`,
          transform: "rotate(14deg)",
          filter: "blur(8px)",
        }}
      />
      {/* parçacıklar */}
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: theme.goldBright,
            opacity: p.op,
            boxShadow: `0 0 ${p.size * 2}px ${theme.gold}`,
          }}
        />
      ))}
      {flash && (
        <AbsoluteFill style={{ background: theme.white, opacity: interpolate(frame, [0, 6], [0.6, 0], { extrapolateRight: "clamp" }) }} />
      )}
    </AbsoluteFill>
  );
};
