"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { KartTuvali } from "@/components/kart-baski/KartTuvali";
import {
  ALAN_ETIKET, FONTLAR, ORNEK_DEGERLER, alanKutusu, alanlariDuzenle, olcu, varsayilanAlanlar,
  type AlanTipi, type KartDegerleri, type KartSablonVerisi, type SablonAlani, type Yuz,
} from "@/lib/kart-baski";

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none";

export default function KartSablonEditoru({ params }: { params: Promise<{ id: string; sablonId: string }> }) {
  const { id: firmaId, sablonId } = use(params);
  const [sablon, setSablon] = useState<KartSablonVerisi | null>(null);
  const [yuz, setYuz] = useState<Yuz>("on");
  const [secili, setSecili] = useState<AlanTipi | null>("adSoyad");
  const [ornek, setOrnek] = useState<KartDegerleri>(ORNEK_DEGERLER);
  const [degisti, setDegisti] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState<Yuz | null>(null);
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null);
  const surukleme = useRef<{ tip: AlanTipi; dx: number; dy: number } | null>(null);
  const olcumTuvali = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch(`/api/admin/kart-sablonlari/${sablonId}`).then(r => r.json()).then(j => {
      if (!j.ok) { setMesaj({ ok: false, metin: j.error ?? "Şablon yüklenemedi." }); return; }
      const s = j.sablon;
      setSablon({ id: s.id, ad: s.ad, yon: s.yon, onGorsel: s.onGorsel, arkaGorsel: s.arkaGorsel, alanlar: alanlariDuzenle(s.alanlar, s.yon) });
    });
  }, [sablonId]);

  // Kaydedilmemiş değişiklikle sayfadan çıkarken uyar
  useEffect(() => {
    if (!degisti) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [degisti]);

  if (!sablon) {
    return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">{mesaj?.metin ?? "Yükleniyor..."}</div>;
  }

  const guncelle = (p: Partial<KartSablonVerisi>) => { setSablon(s => (s ? { ...s, ...p } : s)); setDegisti(true); };
  const alanGuncelle = (tip: AlanTipi, p: Partial<SablonAlani>) =>
    guncelle({ alanlar: sablon.alanlar.map(a => (a.tip === tip ? { ...a, ...p } : a)) });
  const seciliAlan = sablon.alanlar.find(a => a.tip === secili) ?? null;

  function isaretci(tur: "bas" | "surukle" | "birak", x: number, y: number) {
    if (!sablon) return;
    const { w, h } = olcu(sablon.yon);
    if (tur === "bas") {
      const ctx = (olcumTuvali.current ??= document.createElement("canvas")).getContext("2d")!;
      // Üstte çizilen alan önce yakalansın
      const vurulan = [...sablon.alanlar].reverse().find(a => {
        if (a.yuz !== yuz || !a.gorunur) return false;
        const b = alanKutusu(ctx, a, a.tip === "qr" ? "" : ornek[a.tip], w, h);
        return x * w >= b.x - 10 && x * w <= b.x + b.w + 10 && y * h >= b.y - 10 && y * h <= b.y + b.h + 10;
      });
      if (vurulan) {
        setSecili(vurulan.tip);
        surukleme.current = { tip: vurulan.tip, dx: x - vurulan.x, dy: y - vurulan.y };
      } else surukleme.current = null;
    } else if (tur === "surukle" && surukleme.current) {
      const { tip, dx, dy } = surukleme.current;
      const k = (n: number) => Math.round(Math.min(Math.max(n, 0), 1) * 1000) / 1000;
      alanGuncelle(tip, { x: k(x - dx), y: k(y - dy) });
    } else if (tur === "birak") surukleme.current = null;
  }

  async function gorselSec(hedef: Yuz, dosya: File) {
    setYukleniyor(hedef); setMesaj(null);
    try {
      const fd = new FormData();
      fd.append("file", dosya);
      fd.append("folder", "kart-sablon");
      const j = await fetch("/api/admin/upload", { method: "POST", body: fd }).then(r => r.json());
      if (!j.ok) { setMesaj({ ok: false, metin: j.error ?? "Görsel yüklenemedi." }); return; }
      guncelle(hedef === "on" ? { onGorsel: j.url } : { arkaGorsel: j.url });
      setYuz(hedef);
    } finally { setYukleniyor(null); }
  }

  async function kaydet() {
    if (!sablon) return;
    setKaydediliyor(true); setMesaj(null);
    try {
      const j = await fetch(`/api/admin/kart-sablonlari/${sablonId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: sablon.ad, yon: sablon.yon, onGorsel: sablon.onGorsel, arkaGorsel: sablon.arkaGorsel, alanlar: sablon.alanlar }),
      }).then(r => r.json());
      if (!j.ok) { setMesaj({ ok: false, metin: j.error ?? "Kaydedilemedi." }); return; }
      setDegisti(false);
      setMesaj({ ok: true, metin: "Şablon kaydedildi." });
    } finally { setKaydediliyor(false); }
  }

  const { wmm, hmm, w, h } = olcu(sablon.yon);

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/firmalar/${firmaId}`} className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-base">arrow_back</span>Firma
        </Link>
        <div className="flex items-center gap-3">
          {mesaj && <span className={`text-xs ${mesaj.ok ? "text-tertiary" : "text-red-400"}`}>{mesaj.metin}</span>}
          {degisti && !mesaj && <span className="text-xs text-amber-300">Kaydedilmemiş değişiklik var</span>}
          <button onClick={kaydet} disabled={kaydediliyor}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold disabled:opacity-60">
            <span className="material-symbols-outlined text-base">save</span>{kaydediliyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Önizleme */}
        <div className="glass-card rounded-2xl p-5 space-y-4 lg:sticky lg:top-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 p-1 rounded-xl bg-white/5">
              {(["on", "arka"] as const).map(y => (
                <button key={y} onClick={() => setYuz(y)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium ${yuz === y ? "bg-primary text-black" : "text-on-surface-variant hover:text-on-surface"}`}>
                  {y === "on" ? "Ön Yüz" : "Arka Yüz"}
                </button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant">{wmm} × {hmm} mm · baskı {w} × {h} px (300 DPI)</p>
          </div>
          <div className={`mx-auto ${sablon.yon === "dikey" ? "max-w-[340px]" : "max-w-[680px]"}`}>
            <KartTuvali sablon={sablon} yuz={yuz} degerler={ornek} vurgu={secili} onIsaretci={isaretci} />
          </div>
          <p className="text-[11px] text-on-surface-variant text-center">Alanları kart üzerinde sürükleyerek konumlandırın. Seçili alan kesik çizgiyle gösterilir.</p>

          <div className="grid sm:grid-cols-3 gap-2 pt-3 border-t border-white/5">
            {(["adSoyad", "unvan", "gsm"] as const).map(k => (
              <div key={k}>
                <label className="text-[11px] text-on-surface-variant mb-1 block">Örnek {ALAN_ETIKET[k]}</label>
                <input value={ornek[k]} onChange={e => setOrnek(o => ({ ...o, [k]: e.target.value }))} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        {/* Ayarlar */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Şablon Adı</label>
              <input value={sablon.ad} onChange={e => guncelle({ ad: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Kart Yönü</label>
              <select value={sablon.yon}
                onChange={e => {
                  const yon = e.target.value as KartSablonVerisi["yon"];
                  if (yon !== sablon.yon && confirm("Yön değişince alanlar varsayılan yerleşime döner. Devam edilsin mi?")) {
                    guncelle({ yon, alanlar: varsayilanAlanlar(yon) });
                  }
                }}
                className={inputCls}>
                <option value="yatay">Yatay (85,6 × 54 mm)</option>
                <option value="dikey">Dikey (54 × 85,6 mm)</option>
              </select>
            </div>
            {(["on", "arka"] as const).map(y => {
              const url = y === "on" ? sablon.onGorsel : sablon.arkaGorsel;
              return (
                <div key={y}>
                  <label className="text-xs text-on-surface-variant mb-1 block">{y === "on" ? "Ön Yüz Görseli" : "Arka Yüz Görseli"}</label>
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/15 border border-primary/25 text-primary cursor-pointer ${yukleniyor === y ? "opacity-60 pointer-events-none" : ""}`}>
                      <span className="material-symbols-outlined text-sm">upload</span>
                      {yukleniyor === y ? "Yükleniyor..." : url ? "Değiştir" : "Görsel Yükle"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) void gorselSec(y, f); e.target.value = ""; }} />
                    </label>
                    {url && (
                      <button type="button" onClick={() => guncelle(y === "on" ? { onGorsel: "" } : { arkaGorsel: "" })}
                        className="px-3 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-red-400">Kaldır</button>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-on-surface-variant/70">
              En iyi sonuç için görseli {w} × {h} px (300 DPI) ya da aynı oranda hazırlayın; farklı oranlı görsel karta sığacak şekilde esnetilir.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Alanlar</p>
            <div className="grid grid-cols-2 gap-1.5">
              {sablon.alanlar.map(a => (
                <button key={a.tip} onClick={() => { setSecili(a.tip); if (a.gorunur) setYuz(a.yuz); }}
                  className={`flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-xs border transition-all ${secili === a.tip ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-on-surface-variant hover:bg-white/5"}`}>
                  <span>{ALAN_ETIKET[a.tip]}</span>
                  <span className="material-symbols-outlined text-sm opacity-70">{a.gorunur ? "visibility" : "visibility_off"}</span>
                </button>
              ))}
            </div>

            {seciliAlan && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                    <input type="checkbox" checked={seciliAlan.gorunur} onChange={e => alanGuncelle(seciliAlan.tip, { gorunur: e.target.checked })}
                      className="accent-[#d4af37] w-4 h-4" />
                    Kartta göster
                  </label>
                  <select value={seciliAlan.yuz} onChange={e => { alanGuncelle(seciliAlan.tip, { yuz: e.target.value as Yuz }); setYuz(e.target.value as Yuz); }}
                    className="bg-surface-dim border border-white/10 rounded-lg px-2 py-1 text-xs text-on-surface outline-none">
                    <option value="on">Ön yüzde</option>
                    <option value="arka">Arka yüzde</option>
                  </select>
                </div>

                <Kaydirici etiket={seciliAlan.tip === "qr" ? "QR boyutu" : "Yazı büyüklüğü"} deger={seciliAlan.boyut}
                  min={seciliAlan.tip === "qr" ? 0.1 : 0.02} max={seciliAlan.tip === "qr" ? 0.9 : 0.2} adim={0.005}
                  goster={v => seciliAlan.tip === "qr"
                    ? `${((v * hmm)).toFixed(1)} mm`
                    : `${Math.round((v * hmm) / 0.3528)} pt`}
                  onChange={v => alanGuncelle(seciliAlan.tip, { boyut: v })} />
                <Kaydirici etiket="Yatay konum" deger={seciliAlan.x} min={0} max={1} adim={0.005}
                  goster={v => `${(v * wmm).toFixed(1)} mm`} onChange={v => alanGuncelle(seciliAlan.tip, { x: v })} />
                <Kaydirici etiket="Dikey konum" deger={seciliAlan.y} min={0} max={1} adim={0.005}
                  goster={v => `${(v * hmm).toFixed(1)} mm`} onChange={v => alanGuncelle(seciliAlan.tip, { y: v })} />

                {seciliAlan.tip !== "qr" && (
                  <>
                    <div>
                      <label className="text-xs text-on-surface-variant mb-1 block">Font</label>
                      <select value={seciliAlan.font} onChange={e => alanGuncelle(seciliAlan.tip, { font: e.target.value })}
                        className={inputCls} style={{ fontFamily: seciliAlan.font }}>
                        {FONTLAR.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Renk</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={seciliAlan.renk} onChange={e => alanGuncelle(seciliAlan.tip, { renk: e.target.value })}
                            className="w-10 h-9 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                          <input value={seciliAlan.renk} onChange={e => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && alanGuncelle(seciliAlan.tip, { renk: e.target.value })}
                            className="w-20 bg-surface-dim border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-on-surface outline-none" />
                        </div>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={() => alanGuncelle(seciliAlan.tip, { kalin: !seciliAlan.kalin })} title="Kalın"
                          className={`w-9 h-9 rounded-lg border text-sm font-bold ${seciliAlan.kalin ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-on-surface-variant"}`}>B</button>
                        {([["left", "format_align_left"], ["center", "format_align_center"], ["right", "format_align_right"]] as const).map(([h, ikon]) => (
                          <button key={h} type="button" onClick={() => alanGuncelle(seciliAlan.tip, { hiza: h })} title="Hizalama"
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center ${seciliAlan.hiza === h ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-on-surface-variant"}`}>
                            <span className="material-symbols-outlined text-base">{ikon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {seciliAlan.tip === "qr" && (
                  <p className="text-[11px] text-on-surface-variant/70">QR, okunabilirlik için beyaz zemin üzerine siyah basılır; içeriği kartın QR adresidir.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kaydirici({ etiket, deger, min, max, adim, goster, onChange }: {
  etiket: string; deger: number; min: number; max: number; adim: number;
  goster: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-on-surface-variant">{etiket}</label>
        <span className="text-[11px] text-on-surface font-mono">{goster(deger)}</span>
      </div>
      <input type="range" min={min} max={max} step={adim} value={deger}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-[#d4af37]" />
    </div>
  );
}
