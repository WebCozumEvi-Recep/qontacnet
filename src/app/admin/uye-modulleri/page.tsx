"use client";
import { useEffect, useRef, useState } from "react";

type Tip = "GALERI" | "TEXT" | "VIDEO";
interface Tanim {
  id: string;
  ad: string;
  tip: Tip;
  ikon: string;
  sira: number;
  aktif: boolean;
}

const TIP_ETIKET: Record<Tip, string> = { GALERI: "Galeri", TEXT: "Text Bilgi", VIDEO: "Video" };
const TIP_IKON: Record<Tip, string> = { GALERI: "photo_library", TEXT: "article", VIDEO: "smart_display" };

async function uploadIcon(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? "Yükleme hatası");
  return j.url as string;
}

function IkonYukle({ url, onChange }: { url: string; onChange: (u: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-surface-dim border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-base text-on-surface-variant">image</span>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          setYukleniyor(true);
          try { onChange(await uploadIcon(f)); } catch (err) { alert(err instanceof Error ? err.message : "Hata"); }
          setYukleniyor(false);
          if (ref.current) ref.current.value = "";
        }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={yukleniyor}
        className="px-2.5 py-1.5 rounded-lg glass-card text-xs text-on-surface flex items-center gap-1.5 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">{yukleniyor ? "progress_activity" : "upload"}</span>
        {yukleniyor ? "..." : url ? "Değiştir" : "İkon"}
      </button>
      {url && (
        <button type="button" onClick={() => onChange("")} className="text-xs text-red-400 hover:text-red-300 px-1">Kaldır</button>
      )}
    </div>
  );
}

export default function UyeModulleriPage() {
  const [tanimlar, setTanimlar] = useState<Tanim[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniTip, setYeniTip] = useState<Tip>("GALERI");
  const [yeniIkon, setYeniIkon] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);

  const yukle = () => {
    fetch("/api/admin/uye-modul-tanim")
      .then(r => r.json())
      .then(j => { if (j.ok) setTanimlar(j.tanimlar); })
      .finally(() => setLoading(false));
  };
  useEffect(yukle, []);

  const ekle = async () => {
    if (!yeniAd.trim()) return;
    setEkleniyor(true);
    const r = await fetch("/api/admin/uye-modul-tanim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad: yeniAd.trim(), tip: yeniTip, ikon: yeniIkon, sira: tanimlar.length }),
    });
    const j = await r.json();
    setEkleniyor(false);
    if (j.ok) { setTanimlar(t => [...t, j.tanim]); setYeniAd(""); setYeniIkon(""); setYeniTip("GALERI"); }
    else alert(j.error ?? "Eklenemedi");
  };

  const guncelle = async (id: string, patch: Partial<Tanim>) => {
    setTanimlar(t => t.map(x => (x.id === id ? { ...x, ...patch } : x)));
    await fetch(`/api/admin/uye-modul-tanim/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const sil = async (id: string) => {
    if (!confirm("Bu modül tanımı silinsin mi? Üyelerin eklediği içerikler etkilenebilir.")) return;
    setTanimlar(t => t.filter(x => x.id !== id));
    await fetch(`/api/admin/uye-modul-tanim/${id}`, { method: "DELETE" });
  };

  return (
    <div className="max-w-[800px] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Üye Modülleri</h2>
        <p className="text-sm text-on-surface-variant mt-1">Üyelerin kendi kartlarına ekleyebileceği modül kataloğunu yönetin. Üye bu modüllerden seçip içeriğini doldurur.</p>
      </div>

      {/* Yeni ekle */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Yeni Modül Tanımı</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-on-surface-variant mb-1 block">Modül adı</label>
            <input value={yeniAd} onChange={e => setYeniAd(e.target.value)} placeholder="ör. Ürün Galerim"
              className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Tip</label>
            <select value={yeniTip} onChange={e => setYeniTip(e.target.value as Tip)}
              className="bg-surface-dim border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary">
              {(Object.keys(TIP_ETIKET) as Tip[]).map(t => <option key={t} value={t}>{TIP_ETIKET[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">İkon</label>
            <IkonYukle url={yeniIkon} onChange={setYeniIkon} />
          </div>
          <button onClick={ekle} disabled={ekleniyor || !yeniAd.trim()}
            className="px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            <span className="material-symbols-outlined text-base">{ekleniyor ? "progress_activity" : "add"}</span>Ekle
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-10"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>
      ) : tanimlar.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-10">Henüz modül tanımı yok. Yukarıdan ekleyin.</p>
      ) : (
        <div className="space-y-3">
          {tanimlar.map(t => (
            <div key={t.id} className="glass-card rounded-2xl p-4 flex items-center gap-4 flex-wrap">
              {t.ikon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.ikon} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-surface-dim border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">{TIP_IKON[t.tip]}</span>
                </div>
              )}
              <div className="flex-1 min-w-[120px]">
                <input value={t.ad} onChange={e => guncelle(t.id, { ad: e.target.value })}
                  className="bg-transparent text-sm font-semibold text-on-surface outline-none w-full" />
                <span className="text-xs text-on-surface-variant">{TIP_ETIKET[t.tip]}</span>
              </div>
              <IkonYukle url={t.ikon} onChange={u => guncelle(t.id, { ikon: u })} />
              <button onClick={() => guncelle(t.id, { aktif: !t.aktif })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${t.aktif ? "bg-tertiary/15 text-tertiary" : "bg-white/5 text-on-surface-variant"}`}>
                {t.aktif ? "Aktif" : "Pasif"}
              </button>
              <button onClick={() => sil(t.id)} className="text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
