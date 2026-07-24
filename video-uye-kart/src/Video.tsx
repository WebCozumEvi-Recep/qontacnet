import React from "react";
import { AbsoluteFill, Series, Audio, staticFile } from "remotion";
import { theme } from "./theme";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Scene } from "./scenes/Scene";

// Sahne süreleri (kare). Toplam = SCENES + intro/outro, Root'taki süreyle eşleşmeli.
export const DURATIONS = {
  intro: 70,
  panel: 120,
  kartim: 145,
  qr: 120,
  baglantilar: 120,
  outro: 85,
};
export const TOTAL = Object.values(DURATIONS).reduce((a, b) => a + b, 0);

export const UyeKartTanitim: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* Telifsiz fon müziği (kendi sentezimiz) */}
      <Audio src={staticFile("music.wav")} volume={0.32} />
      <Series>
        <Series.Sequence durationInFrames={DURATIONS.intro}>
          <Intro />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.panel}>
          <Scene
            image="01-panel.png"
            step="01"
            title="Panel"
            caption="Kartınızın performansını tek bakışta görün: görüntülenme, bağlantı ve kaynak istatistikleri."
            focus={{ x: 0.55, y: 0.46, zoom: 1.16 }}
            highlight={{ x: 0.17, y: 0.37, w: 0.81, h: 0.21 }}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.kartim}>
          <Scene
            image="02-kartim.png"
            step="02"
            title="Kartım"
            caption="Profilde görünecek alanları açıp kapatın; kart önizlemesi anında güncellenir."
            focus={{ x: 0.72, y: 0.3, zoom: 1.2 }}
            highlight={{ x: 0.5, y: 0.13, w: 0.46, h: 0.31 }}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.qr}>
          <Scene
            image="05-qr.png"
            step="03"
            title="QR Kodum"
            caption="Dijital kartvizitinizi QR ile paylaşın; WhatsApp, LinkedIn veya e-posta ile tek dokunuş."
            focus={{ x: 0.37, y: 0.33, zoom: 1.22 }}
            highlight={{ x: 0.27, y: 0.14, w: 0.21, h: 0.34 }}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.baglantilar}>
          <Scene
            image="06-baglantilar.png"
            step="04"
            title="Bağlantılarım"
            caption="Kartınızı okutan herkes burada listelenir; kaynağıyla birlikte takip edip dışa aktarın."
            focus={{ x: 0.5, y: 0.5, zoom: 1.12 }}
            highlight={{ x: 0.17, y: 0.3, w: 0.7, h: 0.5 }}
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={DURATIONS.outro}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
