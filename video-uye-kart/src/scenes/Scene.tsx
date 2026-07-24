import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { theme } from "../theme";

export type Highlight = { x: number; y: number; w: number; h: number }; // 0..1 oranlar

export type SceneProps = {
  image: string;
  step: string; // "01"
  title: string;
  caption: string;
  // Ken Burns hedefi (0..1). Verilmezse hafif merkez zoom.
  focus?: { x: number; y: number; zoom: number };
  highlight?: Highlight;
};

// Ekran görüntüsü 2880x1800 (16:10). Tuvali 16:9 doldurmak için genişliğe göre
// ölçekleyip dikeyde hafifçe kırpıyoruz.
export const Scene: React.FC<SceneProps> = ({
  image,
  step,
  title,
  caption,
  focus,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Yavaş Ken Burns: baştan sona hafif yakınlaşma + hedefe kayma
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  const zoomTo = focus?.zoom ?? 1.12;
  const scale = interpolate(p, [0, 1], [1.04, zoomTo], {
    easing: Easing.inOut(Easing.ease),
  });
  // hedef merkez (0.5,0.5 = orta). focus yoksa hafif sağ-üst.
  const fx = focus?.x ?? 0.5;
  const fy = focus?.y ?? 0.45;
  const tx = interpolate(p, [0, 1], [0, (0.5 - fx) * width * (scale - 1)]);
  const ty = interpolate(p, [0, 1], [0, (0.5 - fy) * height * (scale - 1)]);

  // Giriş: görsel hafif yukarıdan ve solmuş gelir
  const intro = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const imgOpacity = interpolate(intro, [0, 1], [0, 1]);

  // Çıkış: son 12 karede hafif soluş (sahne geçişini yumuşatır)
  const out = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      {/* Ekran görüntüsü */}
      <AbsoluteFill style={{ opacity: imgOpacity * out }}>
        <Img
          src={staticFile(`shots/${image}`)}
          style={{
            position: "absolute",
            width: "100%",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        />
      </AbsoluteFill>

      {/* Vurgu kutusu */}
      {highlight && (
        <HighlightBox highlight={highlight} scale={scale} tx={tx} ty={ty} opacity={out} />
      )}

      {/* Alt karartma (altyazı okunsun) */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(8,8,12,0.92) 0%, rgba(8,8,12,0.6) 14%, rgba(8,8,12,0) 32%)",
          opacity: out,
        }}
      />

      {/* Alt yazı / lower-third */}
      <Caption step={step} title={title} caption={caption} opacity={out} />
    </AbsoluteFill>
  );
};

const HighlightBox: React.FC<{
  highlight: Highlight;
  scale: number;
  tx: number;
  ty: number;
  opacity: number;
}> = ({ highlight, scale, tx, ty, opacity }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Görselin tuvaldeki gerçek yerleşimi: genişliğe göre ölçeklenmiş 16:10
  const imgW = width * scale;
  const imgH = imgW * (1800 / 2880);
  const imgLeft = (width - imgW) / 2 + tx;
  const imgTop = (height - imgH) / 2 + ty;

  const x = imgLeft + highlight.x * imgW;
  const y = imgTop + highlight.y * imgH;
  const w = highlight.w * imgW;
  const h = highlight.h * imgH;

  const appear = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 120 } });
  const pulse = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2 * 0.9);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        border: `4px solid ${theme.gold}`,
        borderRadius: 16,
        boxShadow: `0 0 ${20 + pulse * 18}px ${theme.gold}aa, 0 0 0 9999px rgba(8,8,12,0.45)`,
        transform: `scale(${interpolate(appear, [0, 1], [0.9, 1])})`,
        opacity: appear * opacity,
      }}
    />
  );
};

const Caption: React.FC<{ step: string; title: string; caption: string; opacity: number }> = ({
  step,
  title,
  caption,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 22 });
  const y = interpolate(rise, [0, 1], [40, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        bottom: 84,
        transform: `translateY(${y}px)`,
        opacity: rise * opacity,
        fontFamily: "Inter, sans-serif",
        maxWidth: 1200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
        <div
          style={{
            background: theme.gold,
            color: "#1a1408",
            fontWeight: 800,
            fontSize: 30,
            borderRadius: 12,
            padding: "6px 16px",
            letterSpacing: 1,
          }}
        >
          {step}
        </div>
        <div style={{ color: theme.text, fontSize: 56, fontWeight: 800, letterSpacing: -0.5 }}>
          {title}
        </div>
      </div>
      <div style={{ color: theme.textDim, fontSize: 34, fontWeight: 500, lineHeight: 1.3 }}>
        {caption}
      </div>
    </div>
  );
};
