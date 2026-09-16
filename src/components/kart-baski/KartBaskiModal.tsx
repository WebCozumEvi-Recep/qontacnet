"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { KartTuvali } from "@/components/kart-baski/KartTuvali";
import { alanlariDuzenle, jpgIndir, yazdir, type KartDegerleri, type KartSablonVerisi, type Yon } from "@/lib/kart-baski";

interface HamSablon { id: string; firmaId: string; ad: string; yon: Yon; onGorsel: string; arkaGorsel: string; alanlar: unknown }

interface Props {
  seriNo: string;
  qrUrl: string;
  firmaId: string | null;
  firmalar: { id: string; ad: string }[];
  baslangic: Omit<KartDegerleri, "qr">;
  onClose: () => void;
}

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none";
const dosyaAdi = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60);

// Satılan kart için şablon seçip baskı görselini önizler; JPG indirir ya da yazdırır.
export function KartBaskiModal({ seriNo, qrUrl, firmaId, firmalar, baslangic, onClose }: Props) {
  const [sablonlar, setSablonlar] = useState<HamSablon[] | null>(null);
  const [seciliId, setSeciliId] = useState("");
  const [degerler, setDegerler] = useState<KartDegerleri>({ ...baslangic, qr: qrUrl });
  const on = useRef<HTMLCanvasElement | null>(null);
  const arka = useRef<HTMLCanvasElement | null>(null);
  const [uyari, setUyari] = useState("");

  useEffect(() => {
    fetch("/api/admin/kart-sablonlari").then(r => r.json()).then(j => {
      const liste: HamSablon[] = j.ok ? j.sablonlar : [];
      setSablonlar(liste);
      // Kartın firmasının ilk şablonu varsayılan
      setSeciliId((liste.find(s => s.firmaId === firmaId) ?? liste[0])?.id ?? "");
    });
  }, [firmaId]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);

  const sablon: KartSablonVerisi | null = useMemo(() => {
    const s = sablonlar?.find(x => x.id === seciliId);
    return s ? { id: s.id, ad: s.ad, yon: s.yon, onGorsel: s.onGorsel, arkaGorsel: s.arkaGorsel, alanlar: alanlariDuzenle(s.alanlar, s.yon) } : null;
  }, [sablonlar, seciliId]);

  // Arka yüzde hiç içerik yoksa (görsel/alan) yalnız ön yüz basılır
  const arkaVar = !!sablon && (!!sablon.arkaGorsel || sablon.alanlar.some(a => a.yuz === "arka" && a.gorunur));
  const firmaAd = (id: string) => firmalar.find(f => f.id === id)?.ad ?? "Diğer";
  const gruplar = useMemo(() => {
    const m = new Map<string, HamSablon[]>();
    for (const s of sablonlar ?? []) m.set(s.firmaId, [...(m.get(s.firmaId) ?? []), s]);
    return [...m.entries()].sort(([a], [b]) => (a === firmaId ? -1 : b === firmaId ? 1 : 0));
  }, [sablonlar, firmaId]);

  const ad = dosyaAdi(`${seriNo}-${degerler.adSoyad || "kart"}`);
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

        {sablonlar === null ? (
          <p className="p-10 text-center text-sm text-on-surface-variant">Yükleniyor...</p>
        ) : sablonlar.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-on-surface-variant">Henüz kart baskı şablonu yok.</p>
            {firmaId && (
              <Link href={`/admin/firmalar/${firmaId}`} className="inline-block px-4 py-2 rounded-xl text-sm bg-primary-container text-on-primary-container font-semibold">
                Firma sayfasında şablon oluştur
              </Link>
            )}
          </div>
        ) : (
          <div className="p-6 grid lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Şablon</label>
                <select value={seciliId} onChange={e => setSeciliId(e.target.value)} className={inputCls}>
                  {gruplar.map(([fid, liste]) => (
                    <optgroup key={fid} label={firmaAd(fid) + (fid === firmaId ? " (kartın firması)" : "")}>
                      {liste.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              {(["adSoyad", "unvan", "gsm"] as const).map(k => (
                <div key={k}>
                  <label className="text-xs text-on-surface-variant mb-1 block">{k === "adSoyad" ? "Ad Soyad" : k === "gsm" ? "GSM" : "Unvan"}</label>
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
                    <KartTuvali ref={on} sablon={sablon} yuz="on" degerler={degerler} />
                    <button onClick={() => on.current && jpgIndir(on.current, `${ad}-on`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-sm">download</span>Ön yüz JPG
                    </button>
                  </div>
                  {arkaVar && (
                    <div className="space-y-2">
                      <p className="text-xs text-on-surface-variant">Arka Yüz</p>
                      <KartTuvali ref={arka} sablon={sablon} yuz="arka" degerler={degerler} />
                      <button onClick={() => arka.current && jpgIndir(arka.current, `${ad}-arka`)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-primary">
                        <span className="material-symbols-outlined text-sm">download</span>Arka yüz JPG
                      </button>
                    </div>
                  )}
                </div>
                {uyari && <p className="text-xs text-red-400">{uyari}</p>}
                <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-white/5">
                  {arkaVar && (
                    <button onClick={() => sayfalar().forEach((c, i) => setTimeout(() => jpgIndir(c, `${ad}-${i === 0 ? "on" : "arka"}`), i * 400))}
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
        )}
      </div>
    </div>
  );
}
