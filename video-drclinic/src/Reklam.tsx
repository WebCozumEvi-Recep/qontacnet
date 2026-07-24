import React from "react";
import {
  AbsoluteFill,
  Series,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { theme } from "./theme";
import { Bg } from "./Bg";
import { CardFront, CardBack, CARD_W, CARD_H } from "./Card";

export const DURATIONS = {
  hook: 84,
  reveal: 156,
  benefits: 174,
  cta: 132,
};
export const TOTAL = Object.values(DURATIONS).reduce((a, b) => a + b, 0); // 546 ≈ 18.2s

const F = "Arial, Helvetica, sans-serif";

// ---- Sahne 1: Hook ----
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const l1 = spring({ frame, fps, config: { damping: 10, stiffness: 140 } });
  const l2 = spring({ frame: frame - 16, fps, config: { damping: 9, stiffness: 150 } });
  const kick = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2 * 2);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: F, opacity: out }}>
      <Bg flash />
      <div style={{ position: "absolute", textAlign: "center", transform: `scale(${kick})` }}>
        <div
          style={{
            color: theme.white,
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -2,
            transform: `translateY(${interpolate(l1, [0, 1], [120, 0])}px) rotate(${interpolate(l1, [0, 1], [-6, 0])}deg)`,
            opacity: l1,
            textShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          KENDİ İŞİNİ
        </div>
        <div
          style={{
            color: theme.goldBright,
            fontSize: 128,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: -3,
            transform: `translateY(${interpolate(l2, [0, 1], [120, 0])}px) scale(${interpolate(l2, [0, 1], [0.7, 1])})`,
            opacity: l2,
            textShadow: `0 0 50px ${theme.gold}aa`,
          }}
        >
          KUR!
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- Sahne 2: Kart reveal + 3D flip ----
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fly = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });
  const enterY = interpolate(fly, [0, 1], [500, 0]);
  const enterScale = interpolate(fly, [0, 1], [0.5, 1]);
  // flip: 60→100 karede front→back
  const flip = interpolate(frame, [70, 110], [0, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const idle = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 4; // hafif salınım
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const capIn = spring({ frame: frame - 115, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <Bg />
      <div style={{ perspective: 1600, transform: `translateY(-60px)` }}>
        <div
          style={{
            width: CARD_W,
            height: CARD_H,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `scale(${enterScale}) translateY(${enterY}px) rotateZ(${idle * 0.3}deg) rotateY(${flip}deg)`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
            <CardFront />
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <CardBack />
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 360,
          color: theme.white,
          fontSize: 58,
          fontWeight: 800,
          fontFamily: F,
          textAlign: "center",
          opacity: capIn,
          transform: `translateY(${interpolate(capIn, [0, 1], [40, 0])}px)`,
        }}
      >
        Dijital Kartınla Tanış
        <div style={{ color: theme.goldBright, fontSize: 36, fontWeight: 600, marginTop: 10 }}>
          NFC + QR · tek dokunuş
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- Sahne 3: Faydalar (hızlı kinetik) ----
const benefitItems = [
  { icon: "📲", title: "Tek Dokunuşla Paylaş", sub: "Telefon numarası değil, tüm iş dünyan" },
  { icon: "🚀", title: "Saniyeler İçinde Aktif", sub: "Kartı okut, dijital sayfan açılsın" },
  { icon: "📈", title: "Kazancını Büyüt", sub: "Her tanışma takip edilebilir bir fırsat" },
];

const Benefits: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const per = durationInFrames / benefitItems.length;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Bg />
      <Series>
        {benefitItems.map((b, i) => (
          <Series.Sequence key={i} durationInFrames={Math.round(per)}>
            <BenefitCard {...b} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

const BenefitCard: React.FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const x = interpolate(inn, [0, 1], [-260, 0]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: F, opacity: out }}>
      <div style={{ fontSize: 150, transform: `scale(${inn})`, marginBottom: 30 }}>{icon}</div>
      <div
        style={{
          color: theme.white,
          fontSize: 76,
          fontWeight: 900,
          textAlign: "center",
          transform: `translateX(${x}px)`,
          opacity: inn,
          padding: "0 60px",
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
      <div style={{ width: interpolate(inn, [0, 1], [0, 200]), height: 5, background: theme.goldBright, borderRadius: 3, margin: "26px 0" }} />
      <div style={{ color: theme.goldBright, fontSize: 40, fontWeight: 500, textAlign: "center", opacity: inn, padding: "0 80px" }}>
        {sub}
      </div>
    </AbsoluteFill>
  );
};

// ---- Sahne 4: CTA ----
const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14 } });
  const btnIn = spring({ frame: frame - 18, fps, config: { damping: 10, stiffness: 140 } });
  const pulse = 1 + 0.05 * Math.sin((frame / fps) * Math.PI * 2 * 2.2);
  const urlIn = interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: F }}>
      <Bg flash />
      <div style={{ display: "flex", alignItems: "flex-start", opacity: logoIn, transform: `scale(${interpolate(logoIn, [0, 1], [0.7, 1])})`, position: "relative" }}>
        <div style={{ position: "absolute", left: 132, top: -26, color: theme.redBright, fontSize: 60, fontWeight: 900, fontFamily: "Arial" }}>✚</div>
        <span style={{ color: theme.white, fontSize: 92, fontWeight: 700, fontFamily: "Georgia, serif" }}>dr.Clinic</span>
      </div>

      <div style={{ color: theme.white, fontSize: 46, fontWeight: 600, marginTop: 24, opacity: logoIn }}>
        Kendi işini kur, <span style={{ color: theme.goldBright, fontStyle: "italic", fontWeight: 900 }}>kazancını büyüt!</span>
      </div>

      <div
        style={{
          marginTop: 70,
          transform: `scale(${btnIn * pulse})`,
          opacity: btnIn,
          background: `linear-gradient(90deg, ${theme.red}, ${theme.redBright})`,
          color: theme.white,
          fontSize: 64,
          fontWeight: 900,
          padding: "34px 84px",
          borderRadius: 28,
          boxShadow: `0 0 60px ${theme.redBright}aa, 0 20px 50px rgba(0,0,0,0.5)`,
          letterSpacing: 1,
        }}
      >
        HEMEN KAYIT OL →
      </div>

      <div style={{ marginTop: 46, color: theme.goldBright, fontSize: 50, fontWeight: 800, opacity: urlIn }}>
        drclinic.com.tr
      </div>
    </AbsoluteFill>
  );
};

export const DrClinicReklam: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.navyDeep }}>
      <Audio src={staticFile("music.wav")} volume={0.5} />
      <Series>
        <Series.Sequence durationInFrames={DURATIONS.hook}><Hook /></Series.Sequence>
        <Series.Sequence durationInFrames={DURATIONS.reveal}><Reveal /></Series.Sequence>
        <Series.Sequence durationInFrames={DURATIONS.benefits}><Benefits /></Series.Sequence>
        <Series.Sequence durationInFrames={DURATIONS.cta}><CTA /></Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
