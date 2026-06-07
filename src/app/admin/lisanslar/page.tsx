"use client";
import { useEffect, useState } from "react";
import { paketLabel, trDate } from "@/lib/labels";

interface License {
  id: string; ad: string; aylikFiyat: number; yillikFiyat: number; maxUye: number;
  maxTemplate: number; ozellikler: string[]; renk: string; aktifFirmaSayisi: number;
}
interface FirmaRow { id: string; ad: string; paket: string; mrr: number; paketBitis: string | null }

export default function AdminLisanslarPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [firmalar, setFirmalar] = useState<FirmaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/licenses").then(r => r.json()).then(j => { if (j.ok) { setLicenses(j.licenses); setFirmalar(j.firmalar); } }).finally(() => setLoading(false));
  }, []);

  const toplamFirma = licenses.reduce((a, l) => a + l.aktifFirmaSayisi, 0);
  const lim = (n: number) => (n === -1 ? "Sınırsız" : String(n));

  if (loading) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">Yükleniyor...</div>;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Paket & Lisans Yönetimi</h3><p className="text-sm text-on-surface-variant">{toplamFirma} firmanın aktif lisansı var.</p></div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all"><span className="material-symbols-outlined text-base">add</span>Yeni Paket</button>
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
              <div><p className="text-xs text-on-surface-variant">Max Üye</p><p className="text-sm text-on-surface font-medium">{lim(l.maxUye)}</p></div>
              <div><p className="text-xs text-on-surface-variant">Şablon</p><p className="text-sm text-on-surface font-medium">{lim(l.maxTemplate)}</p></div>
            </div>
            <ul className="space-y-2 mb-5 flex-1">{l.ozellikler.map((o, i) => (<li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-sm mt-0.5" style={{ color: l.renk }}>check_circle</span>{o}</li>))}</ul>
            <div className="flex gap-2"><button className="flex-1 py-2.5 glass-card rounded-lg text-xs text-on-surface hover:bg-white/5 transition-all">Düzenle</button><button className="flex-1 py-2.5 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">Firmalar</button></div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
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
    </div>
  );
}
