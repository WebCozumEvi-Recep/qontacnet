"use client";
import { useEffect, useRef, useState } from "react";

type Medya = { url: string; baslik?: string; ad?: string };

async function tanitimUpload(file: File): Promise<{ url: string; ad: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/tanitim-upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? "Yükleme hatası");
  return { url: j.url, ad: j.ad };
}

function MedyaListe({
  baslik, accept, tip, liste, onChange,
}: { baslik: string; accept: string; tip: "image" | "video"; liste: Medya[]; onChange: (l: Medya[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [yuk, setYuk] = useState(false);

  const ekle = async (files: FileList) => {
    setYuk(true);
    const yeni: Medya[] = [...liste];
    for (const f of Array.from(files)) {
      try { const u = await tanitimUpload(f); yeni.push({ url: u.url, ad: u.ad, baslik: "" }); }
      catch (err) { alert(err instanceof Error ? err.message : "Hata"); }
    }
    onChange(yeni);
    setYuk(false);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-on-surface">{baslik}</label>
        <button type="button" onClick={() => ref.current?.click()} disabled={yuk}
          className="px-3 py-1.5 rounded-lg glass-card text-xs text-on-surface flex items-center gap-1.5 disabled:opacity-60">
          <span className={`material-symbols-outlined text-sm ${yuk ? "animate-spin" : ""}`}>{yuk ? "progress_activity" : "upload"}</span>
          {yuk ? "Yükleniyor..." : "Yükle"}
        </button>
        <input ref={ref} type="file" accept={accept} multiple className="hidden"
          onChange={e => { if (e.target.files?.length) ekle(e.target.files); }} />
      </div>
      {liste.length === 0 ? (
        <p className="text-xs text-on-surface-variant">Henüz yok.</p>
      ) : (
        <div className="space-y-2">
          {liste.map((m, i) => (
            <div key={i} className="flex items-center gap-3 glass-card rounded-xl p-2">
              {tip === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <video src={m.url} className="w-20 h-14 rounded-lg object-cover flex-shrink-0 bg-black" />
              )}
              <input value={m.baslik ?? ""} onChange={e => onChange(liste.map((x, xi) => xi === i ? { ...x, baslik: e.target.value } : x))}
                placeholder={`Başlık (${m.ad ?? "opsiyonel"})`}
                className="flex-1 bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" />
              <button type="button" onClick={() => onChange(liste.filter((_, xi) => xi !== i))} className="text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUrunTanitimPage() {
  const [ozet, setOzet] = useState("");
  const [detay, setDetay] = useState("");
  const [gorseller, setGorseller] = useState<Medya[]>([]);
  const [videolar, setVideolar] = useState<Medya[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/urun-tanitim")
      .then(r => r.json())
      .then(j => {
        if (j.ok) {
          setOzet(j.tanitim.ozet ?? "");
          setDetay(j.tanitim.detay ?? "");
          setGorseller(Array.isArray(j.tanitim.gorseller) ? j.tanitim.gorseller : []);
          setVideolar(Array.isArray(j.tanitim.videolar) ? j.tanitim.videolar : []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const kaydet = async () => {
    setSaving(true);
    const r = await fetch("/api/admin/urun-tanitim", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ozet, detay, gorseller, videolar }),
    });
    const j = await r.json();
    setSaving(false);
    if (j.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else alert(j.error ?? "Kaydedilemedi");
  };

  if (loading) return <div className="flex justify-center py-16"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>;

  return (
    <div className="max-w-[760px] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Ürün Tanıtımı</h2>
        <p className="text-sm text-on-surface-variant mt-1">Buradaki içerik tüm firmaların panelinde aynı şekilde görünür. Özet, detay, fotoğraf ve videoları buradan yönetin.</p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-on-surface mb-1 block">Özet</label>
          <textarea value={ozet} onChange={e => setOzet(e.target.value)} rows={3} placeholder="Kısa tanıtım özeti..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface mb-1 block">Detaylı Tanıtım</label>
          <textarea value={detay} onChange={e => setDetay(e.target.value)} rows={8} placeholder="Ürünün detaylı tanıtım metni..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <MedyaListe baslik="Fotoğraflar" accept="image/*" tip="image" liste={gorseller} onChange={setGorseller} />
      </div>
      <div className="glass-card rounded-2xl p-5">
        <MedyaListe baslik="Videolar" accept="video/*" tip="video" liste={videolar} onChange={setVideolar} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={kaydet} disabled={saving}
          className="px-5 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60">
          <span className={`material-symbols-outlined text-base ${saving ? "animate-spin" : ""}`}>{saving ? "progress_activity" : "save"}</span>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {saved && <span className="text-sm text-tertiary">Kaydedildi ✓</span>}
      </div>
    </div>
  );
}
