"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { KartTuvali } from "@/components/kart-baski/KartTuvali";
import {
  ALAN_ETIKET, ALAN_IKON, DINAMIK_TIPLER, FONTLAR, HAZIR_IKONLAR, IKON_FONTU, ORNEK_DEGERLER,
  alanKutusu, alanlariDuzenle, gorselYukle, zeminRengi, ikonFontuYukle, olcu, varsayilanAlanlar, yeniAlan,
  type AlanTipi, type KartDegerleri, type KartSablonVerisi, type SablonAlani, type Yuz,
} from "@/lib/kart-baski";

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none";
const YAZI_TIPLERI: AlanTipi[] = ["ad", "soyad", "adSoyad", "unvan", "gsm", "metin"];
const EKLENEBILIR: AlanTipi[] = ["ad", "soyad", "adSoyad", "unvan", "gsm", "qr", "metin", "ikon", "gorsel"];

async function dosyaYukle(dosya: File): Promise<{ url?: string; hata?: string }> {
  const fd = new FormData();
  fd.append("file", dosya);
  fd.append("folder", "kart-sablon");
  const j = await fetch("/api/admin/upload", { method: "POST", body: fd }).then(r => r.json()).catch(() => null);
  return j?.ok ? { url: j.url } : { hata: j?.error ?? "Görsel yüklenemedi." };
}

export default function KartSablonEditoru({ params }: { params: Promise<{ id: string; sablonId: string }> }) {
  const { id: firmaId, sablonId } = use(params);
  const [sablon, setSablon] = useState<KartSablonVerisi | null>(null);
  const [yuz, setYuz] = useState<Yuz>("on");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [ornek, setOrnek] = useState<KartDegerleri>(ORNEK_DEGERLER);
  const [firmaWeb, setFirmaWeb] = useState("");
  const [degisti, setDegisti] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [ekleMenusu, setEkleMenusu] = useState(false);
  const [zeminTuru, setZeminTuru] = useState<Partial<Record<Yuz, "gorsel" | "renk">>>({});
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null);
  const surukleme = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const olcumTuvali = useRef<HTMLCanvasElement | null>(null);
  const gorselHaritasi = useRef(new Map<string, HTMLImageElement | null>());

  useEffect(() => {
    fetch(`/api/admin/kart-sablonlari/${sablonId}`).then(r => r.json()).then(j => {
      if (!j.ok) { setMesaj({ ok: false, metin: j.error ?? "Şablon yüklenemedi." }); return; }
      const s = j.sablon;
      const alanlar = alanlariDuzenle(s.alanlar, s.yon);
      setSablon({ id: s.id, ad: s.ad, yon: s.yon, onGorsel: s.onGorsel, arkaGorsel: s.arkaGorsel, onRenk: zeminRengi(s.onRenk), arkaRenk: zeminRengi(s.arkaRenk), alanlar });
      setSeciliId(alanlar[0]?.id ?? null);
    });
    fetch(`/api/admin/firmalar/${firmaId}`).then(r => r.json()).then(j => { if (j.ok) setFirmaWeb(j.firma.website ?? ""); }).catch(() => {});
    void ikonFontuYukle();
  }, [sablonId, firmaId]);

  // Kaydedilmemiş değişiklikle sayfadan çıkarken uyar
  useEffect(() => {
    if (!degisti) return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [degisti]);

  // Görsel alanlarının resimleri sürükleme isabet testi için de hazır olsun
  const gorselYollari = (sablon?.alanlar ?? []).filter(a => a.tip === "gorsel" && a.icerik).map(a => a.icerik).join("|");
  useEffect(() => {
    for (const yol of gorselYollari.split("|").filter(Boolean)) {
      if (gorselHaritasi.current.has(yol)) continue;
      gorselHaritasi.current.set(yol, null);
      void gorselYukle(yol).then(img => gorselHaritasi.current.set(yol, img));
    }
  }, [gorselYollari]);

  if (!sablon) {
    return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">{mesaj?.metin ?? "Yükleniyor..."}</div>;
  }

  const guncelle = (p: Partial<KartSablonVerisi>) => { setSablon(s => (s ? { ...s, ...p } : s)); setDegisti(true); setMesaj(null); };
  const alanGuncelle = (id: string, p: Partial<SablonAlani>) =>
    guncelle({ alanlar: sablon.alanlar.map(a => (a.id === id ? { ...a, ...p } : a)) });
  const secili = sablon.alanlar.find(a => a.id === seciliId) ?? null;
  const mevcutTipler = new Set(sablon.alanlar.map(a => a.tip));

  function alanEkle(tip: AlanTipi) {
    const icerik = tip === "metin" ? (firmaWeb.replace(/^https?:\/\//, "").replace(/\/$/, "") || "www.firmaniz.com") : "";
    const a = yeniAlan(tip, yuz, icerik);
    guncelle({ alanlar: [...sablon!.alanlar, a] });
    setSeciliId(a.id);
    setEkleMenusu(false);
  }
  function alanSil(id: string) {
    const kalan = sablon!.alanlar.filter(a => a.id !== id);
    guncelle({ alanlar: kalan });
    setSeciliId(kalan[0]?.id ?? null);
  }
  function katman(id: string, yon: -1 | 1) {
    const l = [...sablon!.alanlar];
    const i = l.findIndex(a => a.id === id);
    const j = i + yon;
    if (i < 0 || j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    guncelle({ alanlar: l });
  }

  function isaretci(tur: "bas" | "surukle" | "birak", x: number, y: number) {
    if (!sablon) return;
    const { w, h } = olcu(sablon.yon);
    if (tur === "bas") {
      const ctx = (olcumTuvali.current ??= document.createElement("canvas")).getContext("2d")!;
      // Üstte çizilen (listede sonra gelen) alan önce yakalansın
      const vurulan = [...sablon.alanlar].reverse().find(a => {
        if (a.yuz !== yuz || !a.gorunur) return false;
        const b = alanKutusu(ctx, a, ornek, w, h, gorselHaritasi.current);
        return x * w >= b.x - 10 && x * w <= b.x + b.w + 10 && y * h >= b.y - 10 && y * h <= b.y + b.h + 10;
      });
      if (vurulan) {
        setSeciliId(vurulan.id);
        surukleme.current = { id: vurulan.id, dx: x - vurulan.x, dy: y - vurulan.y };
      } else surukleme.current = null;
    } else if (tur === "surukle" && surukleme.current) {
      const { id, dx, dy } = surukleme.current;
      const k = (n: number) => Math.round(Math.min(Math.max(n, 0), 1) * 1000) / 1000;
      alanGuncelle(id, { x: k(x - dx), y: k(y - dy) });
    } else if (tur === "birak") surukleme.current = null;
  }

  async function zeminSec(hedef: Yuz, dosya: File) {
    setYukleniyor(hedef); setMesaj(null);
    try {
      const { url, hata } = await dosyaYukle(dosya);
      if (!url) { setMesaj({ ok: false, metin: hata! }); return; }
      guncelle(hedef === "on" ? { onGorsel: url } : { arkaGorsel: url });
      setYuz(hedef);
    } finally { setYukleniyor(null); }
  }

  async function alanGorseliSec(id: string, dosya: File) {
    setYukleniyor(id); setMesaj(null);
    try {
      const { url, hata } = await dosyaYukle(dosya);
      if (!url) { setMesaj({ ok: false, metin: hata! }); return; }
      gorselHaritasi.current.set(url, await gorselYukle(url));
      alanGuncelle(id, { icerik: url });
    } finally { setYukleniyor(null); }
  }

  async function kaydet() {
    if (!sablon) return;
    setKaydediliyor(true); setMesaj(null);
    try {
      const j = await fetch(`/api/admin/kart-sablonlari/${sablonId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: sablon.ad, yon: sablon.yon, onGorsel: sablon.onGorsel, arkaGorsel: sablon.arkaGorsel, onRenk: sablon.onRenk, arkaRenk: sablon.arkaRenk, alanlar: sablon.alanlar }),
      }).then(r => r.json());
      if (!j.ok) { setMesaj({ ok: false, metin: j.error ?? "Kaydedilemedi." }); return; }
      setDegisti(false);
      setMesaj({ ok: true, metin: "Şablon kaydedildi." });
    } finally { setKaydediliyor(false); }
  }

  const { wmm, hmm, w, h } = olcu(sablon.yon);
  const alanAdi = (a: SablonAlani) =>
    a.tip === "metin" ? a.icerik || "Metin" : a.tip === "ikon" ? `İkon · ${a.icerik}` : ALAN_ETIKET[a.tip];

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

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
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
            <KartTuvali sablon={sablon} yuz={yuz} degerler={ornek} vurgu={seciliId} onIsaretci={isaretci} />
          </div>
          <p className="text-[11px] text-on-surface-variant text-center">Alanları kart üzerinde sürükleyerek konumlandırın. Seçili alan kesik çizgiyle gösterilir.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/5">
            {(["ad", "soyad", "unvan", "gsm"] as const).map(k => (
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
                    const alanlar = varsayilanAlanlar(yon);
                    guncelle({ yon, alanlar });
                    setSeciliId(alanlar[0]?.id ?? null);
                  }
                }}
                className={inputCls}>
                <option value="yatay">Yatay (85,6 × 54 mm)</option>
                <option value="dikey">Dikey (54 × 85,6 mm)</option>
              </select>
            </div>
            {(["on", "arka"] as const).map(y => {
              const url = y === "on" ? sablon.onGorsel : sablon.arkaGorsel;
              const renk = y === "on" ? sablon.onRenk : sablon.arkaRenk;
              const renkAyarla = (r: string) => guncelle(y === "on" ? { onRenk: r } : { arkaRenk: r });
              const tur = zeminTuru[y] ?? (url ? "gorsel" : "renk");
              return (
                <div key={y} className="p-3 rounded-xl border border-white/8 bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-on-surface-variant">{y === "on" ? "Ön Yüz Zemini" : "Arka Yüz Zemini"}</span>
                    <div className="flex gap-1 p-0.5 rounded-lg bg-white/5">
                      {([["gorsel", "Görsel"], ["renk", "Renk"]] as const).map(([t, etiket]) => (
                        <button key={t} type="button"
                          onClick={() => {
                            setZeminTuru(z => ({ ...z, [y]: t }));
                            // Renge geçince görsel kaldırılır ki seçilen renk görünsün
                            if (t === "renk" && url) guncelle(y === "on" ? { onGorsel: "" } : { arkaGorsel: "" });
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${tur === t ? "bg-primary text-black" : "text-on-surface-variant hover:text-on-surface"}`}>
                          {etiket}
                        </button>
                      ))}
                    </div>
                  </div>
                  {tur === "gorsel" ? (
                    <div className="flex items-center gap-2">
                      <label className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/15 border border-primary/25 text-primary cursor-pointer ${yukleniyor === y ? "opacity-60 pointer-events-none" : ""}`}>
                        <span className="material-symbols-outlined text-sm">upload</span>
                        {yukleniyor === y ? "Yükleniyor..." : url ? "Değiştir" : "Görsel Yükle"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) void zeminSec(y, f); e.target.value = ""; }} />
                      </label>
                      {url && (
                        <button type="button" onClick={() => guncelle(y === "on" ? { onGorsel: "" } : { arkaGorsel: "" })}
                          className="px-3 py-2 rounded-xl text-xs border border-white/10 text-on-surface-variant hover:text-red-400">Kaldır</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="color" value={renk} onChange={e => renkAyarla(e.target.value)}
                        className="w-10 h-9 flex-shrink-0 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                      <input value={renk} onChange={e => /^#[0-9a-f]{6}$/i.test(e.target.value) && renkAyarla(e.target.value.toLowerCase())}
                        className="w-24 bg-surface-dim border border-white/10 rounded-lg px-2 py-2 text-xs font-mono text-on-surface outline-none" />
                      <div className="flex gap-1 ml-auto">
                        {["#ffffff", "#000000", "#0f172a", "#d4af37", "#b91c1c"].map(r => (
                          <button key={r} type="button" onClick={() => renkAyarla(r)} title={r}
                            className={`w-6 h-6 rounded-full border ${renk === r ? "border-primary ring-2 ring-primary/40" : "border-white/20"}`}
                            style={{ background: r }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-[11px] text-on-surface-variant/70">
              Zemin görselini {w} × {h} px (300 DPI) ya da aynı oranda hazırlayın. Şeffaf görselin altında seçili renk görünür.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Alanlar</p>
              <div className="relative">
                <button onClick={() => setEkleMenusu(v => !v)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/15 border border-primary/25 text-primary">
                  <span className="material-symbols-outlined text-sm">add</span>Alan Ekle
                </button>
                {ekleMenusu && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-white/10 shadow-2xl p-1" style={{ background: "#1a1a2e" }}>
                    {EKLENEBILIR.map(t => {
                      const tekli = (DINAMIK_TIPLER as AlanTipi[]).includes(t);
                      const var_ = tekli && mevcutTipler.has(t);
                      return (
                        <button key={t} disabled={var_} onClick={() => alanEkle(t)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left text-on-surface hover:bg-white/5 disabled:opacity-35 disabled:hover:bg-transparent">
                          <span className="material-symbols-outlined text-base text-primary">{ALAN_IKON[t]}</span>
                          <span className="flex-1">{ALAN_ETIKET[t]}</span>
                          {var_ && <span className="text-[10px] text-on-surface-variant">ekli</span>}
                          {t === "metin" && <span className="text-[10px] text-on-surface-variant">web vb.</span>}
                          {t === "gorsel" && <span className="text-[10px] text-on-surface-variant">logo</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {sablon.alanlar.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-3">Alan yok — &quot;Alan Ekle&quot; ile ekleyin.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {sablon.alanlar.map(a => (
                  <div key={a.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${seciliId === a.id ? "border-primary/50 bg-primary/10" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => { setSeciliId(a.id); if (a.gorunur) setYuz(a.yuz); }}>
                    <span className="material-symbols-outlined text-base text-primary">{ALAN_IKON[a.tip]}</span>
                    <span className={`flex-1 truncate ${seciliId === a.id ? "text-primary" : "text-on-surface"}`}>{alanAdi(a)}</span>
                    <span className="text-[10px] text-on-surface-variant">{a.yuz === "on" ? "Ön" : "Arka"}</span>
                    <button onClick={e => { e.stopPropagation(); alanGuncelle(a.id, { gorunur: !a.gorunur }); }} title={a.gorunur ? "Gizle" : "Göster"}
                      className="p-0.5 text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">{a.gorunur ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {secili && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <select value={secili.yuz} onChange={e => { alanGuncelle(secili.id, { yuz: e.target.value as Yuz }); setYuz(e.target.value as Yuz); }}
                    className="bg-surface-dim border border-white/10 rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none">
                    <option value="on">Ön yüzde</option>
                    <option value="arka">Arka yüzde</option>
                  </select>
                  <div className="flex gap-1">
                    <button onClick={() => katman(secili.id, -1)} title="Alta al" className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">flip_to_back</span>
                    </button>
                    <button onClick={() => katman(secili.id, 1)} title="Üste al" className="p-1.5 rounded-lg border border-white/10 text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">flip_to_front</span>
                    </button>
                    <button onClick={() => alanSil(secili.id)} title="Alanı sil" className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {secili.tip === "metin" && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Metin</label>
                    <input value={secili.icerik} maxLength={200} onChange={e => alanGuncelle(secili.id, { icerik: e.target.value })} className={inputCls}
                      placeholder="www.firmaniz.com" />
                    {firmaWeb && (
                      <button type="button" onClick={() => alanGuncelle(secili.id, { icerik: firmaWeb.replace(/^https?:\/\//, "").replace(/\/$/, "") })}
                        className="mt-1 text-[11px] text-primary hover:underline">Firmanın web adresini kullan</button>
                    )}
                  </div>
                )}

                {secili.tip === "ikon" && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">İkon</label>
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {HAZIR_IKONLAR.map(ik => (
                        <button key={ik} type="button" onClick={() => alanGuncelle(secili.id, { icerik: ik })} title={ik}
                          className={`h-9 rounded-lg border flex items-center justify-center text-xl ${secili.icerik === ik ? "border-primary/60 bg-primary/15 text-primary" : "border-white/10 text-on-surface hover:bg-white/5"}`}
                          style={{ fontFamily: `"${IKON_FONTU}"`, fontFeatureSettings: '"liga"' }}>
                          {ik}
                        </button>
                      ))}
                    </div>
                    <input value={secili.icerik} onChange={e => alanGuncelle(secili.id, { icerik: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                      className={`${inputCls} font-mono`} placeholder="ör. nfc" />
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">
                      Diğer ikonlar için adını yazın (fonts.google.com/icons adresindeki Material Symbols adları).
                    </p>
                  </div>
                )}

                {secili.tip === "gorsel" && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Görsel (logo)</label>
                    <label className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/15 border border-primary/25 text-primary cursor-pointer ${yukleniyor === secili.id ? "opacity-60 pointer-events-none" : ""}`}>
                      <span className="material-symbols-outlined text-sm">upload</span>
                      {yukleniyor === secili.id ? "Yükleniyor..." : secili.icerik ? "Görseli Değiştir" : "Görsel Yükle"}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) void alanGorseliSec(secili.id, f); e.target.value = ""; }} />
                    </label>
                    <p className="text-[11px] text-on-surface-variant/70 mt-1">Şeffaf zeminli PNG önerilir; oranı korunarak yerleşir.</p>
                  </div>
                )}

                <Kaydirici etiket={secili.tip === "qr" || secili.tip === "gorsel" ? "Yükseklik" : "Büyüklük"} deger={secili.boyut}
                  min={secili.tip === "qr" || secili.tip === "gorsel" ? 0.05 : 0.02} max={secili.tip === "qr" || secili.tip === "gorsel" ? 0.95 : 0.3} adim={0.005}
                  goster={v => (secili.tip === "qr" || secili.tip === "gorsel" || secili.tip === "ikon")
                    ? `${(v * hmm).toFixed(1)} mm`
                    : `${Math.round((v * hmm) / 0.3528)} pt`}
                  onChange={v => alanGuncelle(secili.id, { boyut: v })} />
                <Kaydirici etiket="Yatay konum" deger={secili.x} min={0} max={1} adim={0.005}
                  goster={v => `${(v * wmm).toFixed(1)} mm`} onChange={v => alanGuncelle(secili.id, { x: v })} />
                <Kaydirici etiket="Dikey konum" deger={secili.y} min={0} max={1} adim={0.005}
                  goster={v => `${(v * hmm).toFixed(1)} mm`} onChange={v => alanGuncelle(secili.id, { y: v })} />

                {secili.tip !== "qr" && secili.tip !== "gorsel" && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Renk</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={secili.renk} onChange={e => alanGuncelle(secili.id, { renk: e.target.value })}
                        className="w-10 h-9 flex-shrink-0 rounded-lg bg-transparent border border-white/10 cursor-pointer" />
                      <input value={secili.renk} onChange={e => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && alanGuncelle(secili.id, { renk: e.target.value })}
                        className="w-24 bg-surface-dim border border-white/10 rounded-lg px-2 py-2 text-xs font-mono text-on-surface outline-none" />
                      <div className="flex gap-1 ml-auto">
                        {["#ffffff", "#000000", "#d4af37", "#e11d48"].map(r => (
                          <button key={r} type="button" onClick={() => alanGuncelle(secili.id, { renk: r })} title={r}
                            className={`w-6 h-6 rounded-full border ${secili.renk.toLowerCase() === r ? "border-primary ring-2 ring-primary/40" : "border-white/20"}`}
                            style={{ background: r }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {secili.tip !== "qr" && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">{YAZI_TIPLERI.includes(secili.tip) ? "Hizalama ve kalınlık" : "Hizalama"}</label>
                    <div className="flex gap-1">
                      {([["left", "format_align_left", "Sola"], ["center", "format_align_center", "Ortaya"], ["right", "format_align_right", "Sağa"]] as const).map(([hz, ikon, etiket]) => (
                        <button key={hz} type="button" onClick={() => alanGuncelle(secili.id, { hiza: hz })} title={`${etiket} hizala`}
                          className={`flex-1 h-9 rounded-lg border flex items-center justify-center ${secili.hiza === hz ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-on-surface-variant hover:text-on-surface"}`}>
                          <span className="material-symbols-outlined text-lg">{ikon}</span>
                        </button>
                      ))}
                      {YAZI_TIPLERI.includes(secili.tip) && (
                        <button type="button" onClick={() => alanGuncelle(secili.id, { kalin: !secili.kalin })} title="Kalın"
                          className={`flex-1 h-9 rounded-lg border flex items-center justify-center ${secili.kalin ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-on-surface-variant hover:text-on-surface"}`}>
                          <span className="material-symbols-outlined text-lg">format_bold</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {YAZI_TIPLERI.includes(secili.tip) && (
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">Font</label>
                    <select value={secili.font} onChange={e => alanGuncelle(secili.id, { font: e.target.value })}
                      className={inputCls} style={{ fontFamily: secili.font }}>
                      {FONTLAR.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                  </div>
                )}
                {secili.tip === "qr" && (
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
