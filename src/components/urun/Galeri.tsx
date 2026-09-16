"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { PRODUCTS_TEXT, type ProductsText } from "@/lib/i18n/ui-text";

// Ürün görsellerini tam ekran galeri/lightbox olarak gösterir
export function Lightbox({ gorseller, baslangic, ad, onClose, t = PRODUCTS_TEXT }: { gorseller: string[]; baslangic: number; ad: string; onClose: () => void; t?: ProductsText }) {
  const [index, setIndex] = useState(baslangic);
  const coklu = gorseller.length > 1;
  const ileri = () => setIndex((i) => (i + 1) % gorseller.length);
  const geri = () => setIndex((i) => (i - 1 + gorseller.length) % gorseller.length);

  // Dokunmatik: sağa/sola kaydırma görsel değiştirir, aşağı kaydırma kapatır
  const dokunma = useRef<{ x: number; y: number } | null>(null);
  function dokunBasla(e: React.TouchEvent) {
    dokunma.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function dokunBitir(e: React.TouchEvent) {
    const bas = dokunma.current;
    dokunma.current = null;
    if (!bas) return;
    const dx = e.changedTouches[0].clientX - bas.x;
    const dy = e.changedTouches[0].clientY - bas.y;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) onClose();
    else if (coklu && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? ileri : geri)();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && coklu) ileri();
      else if (e.key === "ArrowLeft" && coklu) geri();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coklu]);

  return (
    <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}
      onTouchStart={dokunBasla} onTouchEnd={dokunBitir} role="dialog" aria-modal="true" aria-label={ad}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        aria-label={t.close}
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="relative flex items-center justify-center w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {coklu && (
          <button
            type="button"
            onClick={geri}
            className="absolute left-0 sm:-left-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
            aria-label={t.prev}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        <img
          src={gorseller[index]}
          alt={`${ad} — görsel ${index + 1}`}
          className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
        />
        {coklu && (
          <button
            type="button"
            onClick={ileri}
            className="absolute right-0 sm:-right-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
            aria-label={t.next}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      <p className="text-white/80 text-sm mt-3 font-medium" onClick={(e) => e.stopPropagation()}>
        {ad}{coklu && <span className="text-white/50"> · {index + 1}/{gorseller.length}</span>}
      </p>

      {coklu && (
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center max-w-full" onClick={(e) => e.stopPropagation()}>
          {gorseller.map((g, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === index ? "border-primary" : "border-white/20 opacity-60 hover:opacity-100"}`}
            >
              <img src={g} alt={`küçük görsel ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tıklanınca galeriyi açan ürün görseli (birden çok görsel varsa sayısını gösterir)
export function GaleriliGorsel({ gorseller, ad, className = "" }: { gorseller: string[]; ad: string; className?: string }) {
  const [acik, setAcik] = useState<number | null>(null);
  if (!gorseller.length) return null;
  return (
    <>
      <button type="button" onClick={() => setAcik(0)} aria-label={`${ad} görsellerini büyüt`}
        className={`relative group overflow-hidden rounded-xl cursor-zoom-in ${className}`}>
        <img src={gorseller[0]} alt={ad} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[11px]">
          <span className="material-symbols-outlined text-sm">{gorseller.length > 1 ? "photo_library" : "zoom_in"}</span>
          {gorseller.length > 1 && gorseller.length}
        </span>
      </button>
      {acik !== null && <Lightbox gorseller={gorseller} baslangic={acik} ad={ad} onClose={() => setAcik(null)} />}
    </>
  );
}
