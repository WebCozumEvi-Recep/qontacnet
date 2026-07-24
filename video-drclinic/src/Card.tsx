import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "./theme";

// Kart taban ölçüsü (sahnelerde scale ile büyütülür/küçültülür)
export const CARD_W = 920;
export const CARD_H = 575;

const Logo: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <div style={{ display: "flex", alignItems: "flex-start", position: "relative", fontFamily: "Georgia, 'Times New Roman', serif" }}>
    {/* kırmızı medikal artı */}
    <div
      style={{
        position: "absolute",
        left: 118 * size,
        top: -22 * size,
        color: theme.red,
        fontSize: 52 * size,
        fontWeight: 900,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1,
      }}
    >
      ✚
    </div>
    <span style={{ color: theme.navy, fontSize: 78 * size, fontWeight: 700, letterSpacing: -1 }}>dr.</span>
    <span style={{ color: theme.navy, fontSize: 78 * size, fontWeight: 700, letterSpacing: -1 }}>Clinic</span>
    <span style={{ color: theme.navy, fontSize: 26 * size, marginTop: 8 * size }}>®</span>
  </div>
);

const Crown: React.FC<{ color?: string; size?: number }> = ({ color = theme.gold, size = 30 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 100 70" fill={color}>
    <path d="M10 60 L18 22 L34 44 L50 14 L66 44 L82 22 L90 60 Z" />
    <rect x="10" y="60" width="80" height="8" rx="2" />
  </svg>
);

export const CardFront: React.FC = () => {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 44,
        background: theme.white,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
      }}
    >
      {/* sol kırmızı kenar */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 56, background: theme.red, borderRadius: "44px 0 0 44px" }} />
      {/* sağ lacivert swoosh (büyük daire, yalnız sağ üçte kavis yapar) */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: (CARD_H - 1000) / 2,
          width: 1000,
          height: 1000,
          background: theme.navy,
          borderRadius: "50%",
        }}
      />
      {/* altın yay aksanı (lacivert kenarın hemen solunda) */}
      <div
        style={{
          position: "absolute",
          left: 540,
          top: (CARD_H - 1010) / 2,
          width: 1010,
          height: 1010,
          border: `5px solid ${theme.gold}`,
          borderRadius: "50%",
          opacity: 0.85,
        }}
      />

      {/* içerik — beyaz alanda ortalanır */}
      <div style={{ position: "absolute", left: 56, top: 0, bottom: 0, width: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Logo size={1.05} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "26px 0 18px" }}>
          <div style={{ width: 120, height: 2, background: theme.gold }} />
          <Crown />
          <div style={{ width: 120, height: 2, background: theme.gold }} />
        </div>
        <div style={{ color: theme.navy, fontSize: 38, fontWeight: 800, fontFamily: "Arial, sans-serif", whiteSpace: "nowrap" }}>
          Kendi işini kur,
        </div>
        <div
          style={{
            color: theme.red,
            fontSize: 40,
            fontWeight: 900,
            whiteSpace: "nowrap",
            fontStyle: "italic",
            fontFamily: "Arial, sans-serif",
            borderBottom: `3px solid ${theme.red}`,
            paddingBottom: 4,
            marginTop: 4,
          }}
        >
          kazancını büyüt!
        </div>
      </div>

      {/* NFC rozeti */}
      <div style={{ position: "absolute", right: 60, bottom: 54, display: "flex", flexDirection: "column", alignItems: "center", color: theme.white }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={theme.white} strokeWidth="2" strokeLinecap="round">
          <path d="M6 8.5a8 8 0 0 1 0 7" />
          <path d="M9.5 6a13 13 0 0 1 0 12" />
          <path d="M13 4a17 17 0 0 1 0 16" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>NFC</span>
      </div>
    </div>
  );
};

export const CardBack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // QR üstünde hafif parlama
  const shine = interpolate(frame % (fps * 2), [0, fps], [0, 1]);
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 44,
        background: theme.navy,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 26, border: `2px solid ${theme.gold}`, borderRadius: 30, opacity: 0.7 }} />
      <div style={{ marginBottom: 14 }}><Crown size={42} color={theme.goldBright} /></div>
      {/* QR (stilize) */}
      <div style={{ width: 250, height: 250, background: theme.white, borderRadius: 22, padding: 18, position: "relative", boxShadow: `0 0 40px rgba(232,198,89,${0.3 + shine * 0.3})` }}>
        <QR />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
        <div style={{ width: 60, height: 1, background: theme.gold }} />
        <span style={{ color: theme.white, fontSize: 26, fontFamily: "Arial, sans-serif" }}>Taramak için okutun</span>
        <div style={{ width: 60, height: 1, background: theme.gold }} />
      </div>
      <div style={{ color: theme.goldBright, fontSize: 30, fontWeight: 700, marginTop: 12, fontFamily: "Arial, sans-serif" }}>
        drclinic.com.tr
      </div>
    </div>
  );
};

// Basit, deterministik QR görünümü (gerçek QR değil — görsel amaçlı)
const QR: React.FC = () => {
  const cells = 21;
  const rng = (i: number) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x) > 0.5;
  };
  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
  const sq: React.ReactNode[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let on = false;
      if (finder(r, c)) {
        const rr = r % (cells - 7 <= r ? 1 : 7);
        // çizilen finder deseni
        const lr = r >= cells - 7 ? r - (cells - 7) : r;
        const lc = c >= cells - 7 ? c - (cells - 7) : c;
        const edge = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        on = edge || core;
      } else {
        on = rng(r * cells + c);
      }
      if (on) sq.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={theme.navyDeep} />);
    }
  }
  return (
    <svg viewBox={`0 0 ${cells} ${cells}`} width="100%" height="100%" shapeRendering="crispEdges">
      {sq}
    </svg>
  );
};
