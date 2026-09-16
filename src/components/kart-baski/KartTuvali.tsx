"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  fontYukle, gorselYukle, ikonFontuYukle, yuzCiz, olcu,
  type KartDegerleri, type KartSablonVerisi, type Yuz,
} from "@/lib/kart-baski";

interface Props {
  sablon: KartSablonVerisi;
  yuz: Yuz;
  degerler: KartDegerleri;
  /** Seçim çerçevesi çizilecek alanın id'si (editör) */
  vurgu?: string | null;
  className?: string;
  /** Editörde sürükleme için: tuval üzerindeki işaretçi olayları (koordinatlar 0–1 oranında) */
  onIsaretci?: (tur: "bas" | "surukle" | "birak", x: number, y: number) => void;
}

// Kartın bir yüzünü tam baskı çözünürlüğünde çizer; ekranda CSS ile küçültülür.
export const KartTuvali = forwardRef<HTMLCanvasElement | null, Props>(function KartTuvali(
  { sablon, yuz, degerler, vurgu, className = "", onIsaretci }, ref,
) {
  const tuval = useRef<HTMLCanvasElement>(null);
  const qr = useRef<HTMLCanvasElement>(null);
  const [surum, setSurum] = useState(0); // font/görsel yüklenince yeniden çiz
  useImperativeHandle(ref, () => tuval.current as HTMLCanvasElement);

  const zemin = yuz === "on" ? sablon.onGorsel : sablon.arkaGorsel;
  const yuzAlanlari = sablon.alanlar.filter(a => a.yuz === yuz && a.gorunur);
  const yazili = yuzAlanlari.filter(a => a.tip !== "qr" && a.tip !== "ikon" && a.tip !== "gorsel");
  // Yükleme bağımlılıkları: değişmedikçe yeniden yüklenmez
  const fontlar = [...new Set(yazili.map(a => a.font))].sort().join("|");
  const resimler = [...new Set(yuzAlanlari.filter(a => a.tip === "gorsel" && a.icerik).map(a => a.icerik))].sort().join("|");
  const ikonVar = yuzAlanlari.some(a => a.tip === "ikon");

  useEffect(() => {
    let iptal = false;
    Promise.all([
      gorselYukle(zemin),
      ...resimler.split("|").filter(Boolean).map(gorselYukle),
      ...fontlar.split("|").filter(Boolean).map(fontYukle),
      ikonVar ? ikonFontuYukle() : null,
    ]).then(() => { if (!iptal) setSurum(s => s + 1); });
    return () => { iptal = true; };
  }, [zemin, fontlar, resimler, ikonVar]);

  useEffect(() => {
    let iptal = false;
    const kaynaklar = [zemin, ...resimler.split("|").filter(Boolean)];
    Promise.all(kaynaklar.map(gorselYukle)).then(([img, ...digerleri]) => {
      const ctx = tuval.current?.getContext("2d");
      if (iptal || !ctx) return;
      const harita = new Map(kaynaklar.slice(1).map((k, i) => [k, digerleri[i]] as const));
      yuzCiz(ctx, sablon, yuz, img, degerler, qr.current, harita, vurgu);
    });
    return () => { iptal = true; };
  }, [sablon, yuz, degerler, vurgu, zemin, resimler, surum]);

  const { w, h } = olcu(sablon.yon);
  const olay = (tur: "bas" | "surukle" | "birak") => (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onIsaretci) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (tur === "bas") e.currentTarget.setPointerCapture(e.pointerId);
    onIsaretci(tur, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };

  return (
    <>
      <canvas
        ref={tuval}
        width={w}
        height={h}
        className={`w-full h-auto rounded-xl shadow-lg ${onIsaretci ? "cursor-move touch-none" : ""} ${className}`}
        style={{ aspectRatio: `${w} / ${h}` }}
        onPointerDown={olay("bas")}
        onPointerMove={e => { if (e.buttons) olay("surukle")(e); }}
        onPointerUp={olay("birak")}
      />
      {/* QR, çizimde kaynak olarak kullanılır; baskıda okunabilirlik için siyah/beyaz ve sessiz bölgeli */}
      <QRCodeCanvas ref={qr} value={degerler.qr || " "} size={600} marginSize={2} level="M"
        bgColor="#ffffff" fgColor="#000000" style={{ display: "none" }} />
    </>
  );
});
