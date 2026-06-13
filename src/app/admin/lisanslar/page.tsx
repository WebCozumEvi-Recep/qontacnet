"use client";
import { useEffect, useState } from "react";
import { paketLabel, trDate, temaLimiti, uyeLimiti } from "@/lib/labels";

interface License {
  id: string; ad: string; aylikFiyat: number; yillikFiyat: number; maxUye: number;
  maxTemplate: number; ozellikler: string[]; renk: string; aktifFirmaSayisi: number;
}
interface FirmaRow { id: string; ad: string; paket: string; mrr: number; paketBitis: string | null }

const lim = (n: number) => (!isFinite(n) || n === -1 ? "Sınırsız" : String(n));
const uyeLim = (ad: string) => lim(uyeLimiti[ad] ?? 50);
const temaLim = (ad: string) => lim(temaLimiti[ad] ?? 1);

export default function AdminLisanslarPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [firmalar, setFirmalar] = useState<FirmaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [duzenle, setDuzenle] = useState<License | null>(null);

  function yukle() {
    return fetch("/api/admin/licenses").then(r => r.json()).then(j => { if (j.ok) { setLicenses(j.licenses); setFirmalar(j.firmalar); } });
  }

  useEffect(() => { yukle().finally(() => setLoading(false)); }, []);

  const toplamFirma = licenses.reduce((a, l) => a + l.aktifFirmaSayisi, 0);

  if (loading) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">Yükleniyor...</div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Paket & Lisans Yönetimi</h3><p className="text-sm text-on-surface-variant">{toplamFirma} firmanın aktif lisansı var.</p></div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {licenses.map(l => (
          <div key={l.id} className="glass-card rounded-2xl p-6 flex flex-col relative" style={{ borderColor: `${l.renk}30` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${l.renk}15`, border: `1px solid ${l.renk}30` }}><span className="material-symbols-outlined" style={{ color: l.renk }}>workspace_premium</span></div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${l.renk}15`, color: l.renk, border: `1px solid ${l.renk}30` }}>{l.aktifFirmaSayisi} firma</span>
            </div>
            <h4 className="text-lg font-bold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>{paketLabel[l.ad]}</h4>
            <div className="mb-1"><span className="text-3xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>₺{l.aylikFiyat.toLocaleString("tr-TR")}</span><span className="text-sm text-on-surface-variant"> / ay</span></div>
            <p className="text-xs text-on-surface-variant mb-4">Yıllık ₺{l.yillikFiyat.toLocaleString("tr-TR")}</p>
            <div className="grid grid-cols-2 gap-2 mb-4 py-3 border-y border-white/5">
              <div><p className="text-xs text-on-surface-variant">Max Üye</p><p className="text-sm text-on-surface font-medium">{uyeLim(l.ad)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Şablon</p><p className="text-sm text-on-surface font-medium">{temaLim(l.ad)}</p></div>
            </div>
            <ul className="space-y-2 mb-5 flex-1">{l.ozellikler.map((o, i) => (<li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-sm mt-0.5" style={{ color: l.renk }}>check_circle</span>{o}</li>))}</ul>
            <div className="flex gap-2">
              <button onClick={() => setDuzenle(l)} className="flex-1 py-2.5 glass-card rounded-lg text-xs text-on-surface hover:bg-white/5 transition-all">Düzenle</button>
              <a href="#firma-lisanslari" className="flex-1 py-2.5 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all text-center">Firmalar</a>
            </div>
          </div>
        ))}
      </div>

      <div id="firma-lisanslari" className="glass-card rounded-2xl p-6 scroll-mt-24">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Firma Lisansları</h3>
        <div className="space-y-2">
          {firmalar.map(f => {
            const lic = licenses.find(l => l.ad === f.paket);
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">corporate_fare</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{f.ad}</p><p className="text-xs text-on-surface-variant">Bitiş: {f.paketBitis ? trDate(f.paketBitis) : "—"}</p></div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${lic?.renk}15`, color: lic?.renk, border: `1px solid ${lic?.renk}30` }}>{paketLabel[f.paket]}</span>
                <p className="text-sm font-semibold text-on-surface w-24 text-right">₺{f.mrr.toLocaleString("tr-TR")}/ay</p>
              </div>
            );
          })}
        </div>
      </div>

      {duzenle && (
        <DuzenleModal license={duzenle} onClose={() => setDuzenle(null)} onSaved={async () => { await yukle(); setDuzenle(null); }} />
      )}
    </div>
  );
}

function DuzenleModal({ license, onClose, onSaved }: { license: License; onClose: () => void; onSaved: () => void }) {
  const [aylikFiyat, setAylikFiyat] = useState(String(license.aylikFiyat));
  const [yillikFiyat, setYillikFiyat] = useState(String(license.yillikFiyat));
  const [ozellikler, setOzellikler] = useState(license.ozellikler.join("\n"));
  const [renk, setRenk] = useState(license.renk);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  async function kaydet() {
    setKaydediliyor(true); setHata("");
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: license.id,
          aylikFiyat: Number(aylikFiyat),
          yillikFiyat: Number(yillikFiyat),
          ozellikler: ozellikler.split("\n"),
          renk,
        }),
      });
      const j = await res.json();
      if (!j.ok) { setHata(j.error || "Kaydedilemedi."); return; }
      onSaved();
    } catch {
      setHata("Bağlantı hatası.");
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{paketLabel[license.ad]} — Düzenle</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-on-surface-variant">Aylık Fiyat (₺)</span>
              <input type="number" min={0} value={aylikFiyat} onChange={e => setAylikFiyat(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
            </label>
            <label className="block">
              <span className="text-xs text-on-surface-variant">Yıllık Fiyat (₺)</span>
              <input type="number" min={0} value={yillikFiyat} onChange={e => setYillikFiyat(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-on-surface-variant">Renk</span>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={renk} onChange={e => setRenk(e.target.value)} className="h-9 w-12 rounded bg-transparent border border-white/10 cursor-pointer" />
              <input type="text" value={renk} onChange={e => setRenk(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-on-surface-variant">Özellikler (her satır bir madde)</span>
            <textarea value={ozellikler} onChange={e => setOzellikler(e.target.value)} rows={6} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-on-surface focus:outline-none focus:border-primary/50 resize-none" />
          </label>

          <div className="rounded-lg bg-white/3 border border-white/5 p-3 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            Max Üye ({uyeLim(license.ad)}) ve Şablon ({temaLim(license.ad)}) limitleri sistem genelinde sabittir; buradan değiştirilmez.
          </div>

          {hata && <p className="text-xs text-red-400">{hata}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 glass-card rounded-lg text-sm text-on-surface-variant hover:bg-white/5 transition-all">İptal</button>
            <button onClick={kaydet} disabled={kaydediliyor} className="flex-1 py-2.5 bg-primary-container text-on-primary-container rounded-lg text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">{kaydediliyor ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
