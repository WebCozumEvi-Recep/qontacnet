"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { KartTuvali } from "@/components/kart-baski/KartTuvali";
import { ALAN_ETIKET, alanlariDuzenle, zeminRengi, zeminBasilir, gorselIndir, yazdir, type KartDegerleri, type KartSablonVerisi, type Yon, type Yuz } from "@/lib/kart-baski";

export interface HamSablon {
  id: string; firmaId: string; ad: string; yon: Yon; onGorsel: string; arkaGorsel: string;
  onRenk: string; arkaRenk: string; onZeminBas: boolean; arkaZeminBas: boolean; alanlar: unknown;
}

interface Props {
  seriNo: string;
  qrUrl: string;
  /** Kartın firmasının şablonları (boş olmamalı; çağıran kontrol eder) */
  sablonlar: HamSablon[];
  firmaAd: string;
  baslangic: Omit<KartDegerleri, "qr">;
  onClose: () => void;
}

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none";
const dosyaAdi = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60);

// Satılan kart için şablon seçip baskı görselini önizler; JPG indirir ya da yazdırır.
// Yalnız kartın firmasına ait şablonlarla baskı yapılır.
export function KartBaskiModal({ seriNo, qrUrl, sablonlar, firmaAd, baslangic, onClose }: Props) {
  const [seciliId, setSeciliId] = useState(sablonlar[0]?.id ?? "");
  const [degerler, setDegerler] = useState<KartDegerleri>({ ...baslangic, qr: qrUrl });
  const on = useRef<HTMLCanvasElement | null>(null);
  const arka = useRef<HTMLCanvasElement | null>(null);
  const [uyari, setUyari] = useState("");

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);

  const sablon: KartSablonVerisi | null = useMemo(() => {
    const s = sablonlar.find(x => x.id === seciliId);
    return s ? {
      id: s.id, ad: s.ad, yon: s.yon, onGorsel: s.onGorsel, arkaGorsel: s.arkaGorsel,
      onRenk: zeminRengi(s.onRenk), arkaRenk: zeminRengi(s.arkaRenk),
      onZeminBas: s.onZeminBas !== false, arkaZeminBas: s.arkaZeminBas !== false,
      alanlar: alanlariDuzenle(s.alanlar, s.yon),
    } : null;
  }, [sablonlar, seciliId]);

  // Arka yüzde hiç içerik yoksa (görsel/alan) yalnız ön yüz basılır
  const arkaVar = !!sablon && (!!sablon.arkaGorsel || sablon.arkaRenk !== "#ffffff" || sablon.alanlar.some(a => a.yuz === "arka" && a.gorunur));
  const ad = dosyaAdi(`${seriNo}-${`${degerler.ad} ${degerler.soyad}`.trim() || "kart"}`);
  // Önizleme tasarımı gösterir; indirme/yazdırma gizli baskı tuvallerinden yapılır
  const indir = (y: Yuz) => {
    const c = y === "on" ? on.current : arka.current;
    if (c && sablon) gorselIndir(c, `${ad}-${y}`, !zeminBasilir(sablon, y));
  };
  const sayfalar = () => [on.current, arkaVar ? arka.current : null].filter((c): c is HTMLCanvasElement => !!c);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div>
            <h3 className="font-semibold text-on-surface">Kart Baskı Görseli</h3>
            <p className="text-xs text-on-surface-variant font-mono">{seriNo}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface" aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 grid lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Şablon · {firmaAd}</label>
                <select value={seciliId} onChange={e => setSeciliId(e.target.value)} className={inputCls}>
                  {sablonlar.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                </select>
              </div>
              {(["ad", "soyad", "unvan", "gsm"] as const).map(k => (
                <div key={k}>
                  <label className="text-xs text-on-surface-variant mb-1 block">{ALAN_ETIKET[k]}</label>
                  <input value={degerler[k]} onChange={e => setDegerler(d => ({ ...d, [k]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">QR adresi</label>
                <p className="text-[11px] font-mono text-primary break-all">{qrUrl}</p>
              </div>
              <p className="text-[11px] text-on-surface-variant/70">Bu alanlardaki değişiklik yalnız baskı görseline yansır, üye kaydını değiştirmez.</p>
            </div>

            {sablon && (
              <div className="space-y-4">
                <div className={`grid gap-4 ${sablon.yon === "dikey" ? "grid-cols-2" : arkaVar ? "md:grid-cols-2" : ""}`}>
                  <div className="space-y-2">
                    <p className="text-xs text-on-surface-variant">Ön Yüz</p>
                    <KartTuvali sablon={sablon} yuz="on" degerler={degerler} />
                    <KartTuvali ref={on} sablon={sablon} yuz="on" degerler={degerler} baski className="hidden" />
                    {!sablon.onZeminBas && <p className="text-[11px] text-amber-300">Zemin basılmaz — yalnız alanlar basılır.</p>}
                    <button onClick={() => indir("on")}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-sm">download</span>Ön yüz {sablon.onZeminBas ? "JPG" : "PNG"}
                    </button>
                  </div>
                  {arkaVar && (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant">Arka Yüz</p>
                      <KartTuvali sablon={sablon} yuz="arka" degerler={degerler} />
                      <KartTuvali ref={arka} sablon={sablon} yuz="arka" degerler={degerler} baski className="hidden" />
                      {!sablon.arkaZeminBas && <p className="text-[11px] text-amber-300">Zemin basılmaz — yalnız alanlar basılır.</p>}
                      <button onClick={() => indir("arka")}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-sm">download</span>Arka yüz {sablon.arkaZeminBas ? "JPG" : "PNG"}
                      </button>
                    </div>
                  )}
                </div>
                {uyari && <p className="text-xs text-red-400">{uyari}</p>}
                <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-white/5">
                  {arkaVar && (
                    <button onClick={() => (["on", "arka"] as const).forEach((y, i) => setTimeout(() => indir(y), i * 400))}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-white/10 text-on-surface hover:bg-white/5">
                      <span className="material-symbols-outlined text-base">download</span>İki Yüzü İndir
                    </button>
                  )}
                  <button
                    onClick={() => { setUyari(""); if (!yazdir(sayfalar(), sablon.yon, ad)) setUyari("Yazdırma penceresi açılamadı; tarayıcının açılır pencere engelini kaldırın."); }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-black">
                    <span className="material-symbols-outlined text-base">print</span>Yazdır
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
