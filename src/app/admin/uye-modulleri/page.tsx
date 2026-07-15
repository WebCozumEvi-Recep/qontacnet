"use client";
import { useEffect, useRef, useState } from "react";
import { ModulIkon, IkonGaleri } from "@/components/ModulIkon";

type Tip = "GALERI" | "TEXT" | "VIDEO" | "LINK" | "GORSEL" | "FORM";
interface Tanim {
  id: string;
  ad: string;
  tip: Tip;
  ikon: string;
  ikonAd: string;
  butonRenk: string;
  ikonRenk: string;
  sira: number;
  aktif: boolean;
}
type IkonAlan = Pick<Tanim, "ikon" | "ikonAd" | "butonRenk" | "ikonRenk">;

const TIP_ETIKET: Record<Tip, string> = { GALERI: "Galeri", TEXT: "Text Bilgi", VIDEO: "Video", LINK: "URL / Link", GORSEL: "Görsel", FORM: "İletişim Formu" };

async function uploadIcon(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? "Yükleme hatası");
  return j.url as string;
}

// İkon kaynağı: galeriden ikon + renkler veya yüklenen görsel
function IkonSecici({ veri, onChange }: { veri: IkonAlan; onChange: (patch: Partial<IkonAlan>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [galeriAcik, setGaleriAcik] = useState(false);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ModulIkon veri={veri} size={40} />
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          setYukleniyor(true);
          try { onChange({ ikon: await uploadIcon(f) }); } catch (err) { alert(err instanceof Error ? err.message : "Hata"); }
          setYukleniyor(false);
          if (ref.current) ref.current.value = "";
        }} />
      <button type="button" onClick={() => setGaleriAcik(true)}
        className="px-2.5 py-1.5 rounded-lg glass-card text-xs text-on-surface flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">apps</span>Galeri
      </button>
      {/* renkler sadece görsel yüklenmemişken anlamlı */}
      {!veri.ikon && (
        <>
          <label className="flex items-center gap-1 text-xs text-on-surface-variant cursor-pointer" title="Buton rengi">
            <span className="w-6 h-6 rounded-md border border-white/20" style={{ background: veri.butonRenk }} />
            <input type="color" value={veri.butonRenk} onChange={e => onChange({ butonRenk: e.target.value })} className="w-0 h-0 opacity-0" />
          </label>
          <label className="flex items-center gap-1 text-xs text-on-surface-variant cursor-pointer" title="İkon rengi">
            <span className="w-6 h-6 rounded-md border border-white/20 flex items-center justify-center" style={{ background: "#0f1321" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: veri.ikonRenk }}>format_color_fill</span>
            </span>
            <input type="color" value={veri.ikonRenk} onChange={e => onChange({ ikonRenk: e.target.value })} className="w-0 h-0 opacity-0" />
          </label>
        </>
      )}
      <button type="button" onClick={() => ref.current?.click()} disabled={yukleniyor}
        className="px-2.5 py-1.5 rounded-lg glass-card text-xs text-on-surface flex items-center gap-1.5 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">{yukleniyor ? "progress_activity" : "upload"}</span>
        {yukleniyor ? "..." : "Görsel"}
      </button>
      {(veri.ikon || veri.ikonAd) && (
        <button type="button" onClick={() => onChange({ ikon: "", ikonAd: "" })} className="text-xs text-red-400 hover:text-red-300 px-1">Sıfırla</button>
      )}
      {galeriAcik && (
        <IkonGaleri secili={veri.ikonAd} onSec={ad => onChange({ ikonAd: ad, ikon: "" })} onKapat={() => setGaleriAcik(false)} />
      )}
    </div>
  );
}

export default function UyeModulleriPage() {
  const [tanimlar, setTanimlar] = useState<Tanim[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniTip, setYeniTip] = useState<Tip>("GALERI");
  const [yeniIkon, setYeniIkon] = useState<IkonAlan>({ ikon: "", ikonAd: "photo_library", butonRenk: "#d4af37", ikonRenk: "#000000" });
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
      body: JSON.stringify({ ad: yeniAd.trim(), tip: yeniTip, ...yeniIkon, sira: tanimlar.length }),
    });
    const j = await r.json();
    setEkleniyor(false);
    if (j.ok) {
      setTanimlar(t => [...t, j.tanim]);
      setYeniAd(""); setYeniTip("GALERI");
      setYeniIkon({ ikon: "", ikonAd: "photo_library", butonRenk: "#d4af37", ikonRenk: "#000000" });
    } else alert(j.error ?? "Eklenemedi");
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
    <div className="max-w-[820px] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Üye Modülleri</h2>
        <p className="text-sm text-on-surface-variant mt-1">Üyelerin kendi kartlarına ekleyebileceği modül kataloğunu yönetin. Üye bu modüllerden seçip içeriğini doldurur.</p>
      </div>

      {/* Yeni ekle */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Yeni Modül Tanımı</h3>
        <div className="space-y-3">
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
            <button onClick={ekle} disabled={ekleniyor || !yeniAd.trim()}
              className="px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
              <span className="material-symbols-outlined text-base">{ekleniyor ? "progress_activity" : "add"}</span>Ekle
            </button>
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">İkon</label>
            <IkonSecici veri={yeniIkon} onChange={p => setYeniIkon(v => ({ ...v, ...p }))} />
          </div>
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
            <div key={t.id} className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <ModulIkon veri={t} size={44} />
                <div className="flex-1 min-w-[120px]">
                  <input value={t.ad} onChange={e => guncelle(t.id, { ad: e.target.value })}
                    className="bg-transparent text-sm font-semibold text-on-surface outline-none w-full" />
                  <span className="text-xs text-on-surface-variant">{TIP_ETIKET[t.tip]}</span>
                </div>
                <button onClick={() => guncelle(t.id, { aktif: !t.aktif })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${t.aktif ? "bg-tertiary/15 text-tertiary" : "bg-white/5 text-on-surface-variant"}`}>
                  {t.aktif ? "Aktif" : "Pasif"}
                </button>
                <button onClick={() => sil(t.id)} className="text-red-400 hover:text-red-300">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              <IkonSecici veri={t} onChange={p => guncelle(t.id, p)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
