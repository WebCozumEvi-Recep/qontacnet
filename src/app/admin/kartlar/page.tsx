"use client";
import { useEffect, useState } from "react";
import { batchDurumMap, trDate } from "@/lib/labels";

interface Batch {
  id: string; kod: string; miktar: number; uretici: string; uretimTarihi: string;
  durum: string; tahsisFirma: string | null; seriPrefix: string;
}

export default function AdminKartlarPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/batches").then(r => r.json()).then(j => { if (j.ok) setBatches(j.batches); }).finally(() => setLoading(false));
  }, []);

  const sum = (d: string) => batches.filter(b => b.durum === d).reduce((a, b) => a + b.miktar, 0);
  const toplam = batches.reduce((a, b) => a + b.miktar, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="inventory" label="Toplam Üretilen" value={toplam} color="#00d4ff" />
        <Stat icon="warehouse" label="Stokta" value={sum("STOKTA")} color="#42faba" />
        <Stat icon="assignment_turned_in" label="Tahsis Edildi" value={sum("TAHSIS")} color="#6001d1" />
        <Stat icon="factory" label="Üretimde" value={sum("URETIMDE")} color="#a8e8ff" />
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Üretim Partileri (Batch)</h3>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-base">add</span>Yeni Üretim Siparişi
        </button>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {batches.map(b => (
            <div key={b.id} className="glass-card rounded-2xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><p className="text-xs text-on-surface-variant">Batch Kodu</p><p className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{b.kod}</p></div>
                <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${batchDurumMap[b.durum].color}15`, color: batchDurumMap[b.durum].color, border: `1px solid ${batchDurumMap[b.durum].color}30` }}>{batchDurumMap[b.durum].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><p className="text-xs text-on-surface-variant">Miktar</p><p className="text-on-surface font-medium">{b.miktar.toLocaleString("tr-TR")} adet</p></div>
                <div><p className="text-xs text-on-surface-variant">Seri Prefix</p><p className="text-on-surface font-medium font-mono text-sm">{b.seriPrefix}</p></div>
                <div><p className="text-xs text-on-surface-variant">Üretici</p><p className="text-on-surface text-sm">{b.uretici}</p></div>
                <div><p className="text-xs text-on-surface-variant">Üretim Tarihi</p><p className="text-on-surface text-sm">{trDate(b.uretimTarihi)}</p></div>
              </div>
              {b.tahsisFirma && (<div className="pt-3 border-t border-white/5"><p className="text-xs text-on-surface-variant">Tahsis Edilen Firma</p><p className="text-primary text-sm font-medium">{b.tahsisFirma}</p></div>)}
              <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                <button className="flex-1 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">Detay</button>
                <button className="flex-1 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">Seri No Listesi</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value.toLocaleString("tr-TR")}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}
