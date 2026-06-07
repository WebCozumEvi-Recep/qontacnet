"use client";
import { useEffect, useState } from "react";
import { paketLabel } from "@/lib/labels";

interface Rev { sira: number; ay: string; mrr: number; yeniFirma: number; iptal: number }
interface PaketRow { ad: string; renk: string; firmaCount: number; mrr: number }
interface TopFirma { id: string; ad: string; paket: string; mrr: number }

export default function AdminGelirPage() {
  const [revenue, setRevenue] = useState<Rev[]>([]);
  const [paketDagilim, setPaketDagilim] = useState<PaketRow[]>([]);
  const [topFirmalar, setTopFirmalar] = useState<TopFirma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue").then(r => r.json()).then(j => { if (j.ok) { setRevenue(j.revenue); setPaketDagilim(j.paketDagilim); setTopFirmalar(j.topFirmalar); } }).finally(() => setLoading(false));
  }, []);

  if (loading || revenue.length === 0) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">Yükleniyor...</div>;

  const currentMrr = revenue[revenue.length - 1].mrr;
  const prevMrr = revenue[revenue.length - 2]?.mrr ?? currentMrr;
  const delta = currentMrr - prevMrr;
  const deltaPct = prevMrr ? ((delta / prevMrr) * 100).toFixed(1) : "0";
  const maxMrr = Math.max(...revenue.map(r => r.mrr));
  const ortalama = Math.round(revenue.reduce((a, r) => a + r.mrr, 0) / revenue.length);
  const toplamMrr = paketDagilim.reduce((a, p) => a + p.mrr, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="payments" label="Bu Ay MRR" value={`₺${currentMrr.toLocaleString("tr-TR")}`} sub={`${delta >= 0 ? "+" : ""}${deltaPct}% geçen aya göre`} color="#42faba" />
        <Stat icon="trending_up" label="Yıllık Tahmin (ARR)" value={`₺${(currentMrr * 12 / 1000).toFixed(0)}K`} sub="Mevcut MRR × 12" color="#00d4ff" />
        <Stat icon="show_chart" label="12 Ay Ortalama" value={`₺${(ortalama / 1000).toFixed(1)}K`} sub="MRR ortalaması" color="#6001d1" />
        <Stat icon="account_balance" label="Toplam Gelir" value={`₺${(revenue.reduce((a, r) => a + r.mrr, 0) / 1000).toFixed(0)}K`} sub="12 aylık toplam" color="#a8e8ff" />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Tekrarlayan Gelir (MRR)</h3><p className="text-xs text-on-surface-variant mt-1">Son 12 ay</p></div>
        </div>
        <div className="flex items-end gap-3 h-56">
          {revenue.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group cursor-pointer">
              <div className="text-xs text-on-surface opacity-0 group-hover:opacity-100 transition-opacity font-semibold">₺{(r.mrr / 1000).toFixed(1)}K</div>
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${(r.mrr / maxMrr) * 100}%`, background: i === revenue.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.4)" }} />
              <span className="text-xs text-on-surface-variant">{r.ay}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Paket Bazlı Gelir Dağılımı</h3>
          <div className="space-y-4">
            {paketDagilim.map(p => {
              const pct = toplamMrr === 0 ? 0 : (p.mrr / toplamMrr) * 100;
              return (
                <div key={p.ad}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: p.renk }}></span><span className="text-sm text-on-surface font-medium">{paketLabel[p.ad]}</span><span className="text-xs text-on-surface-variant">({p.firmaCount} firma)</span></div>
                    <span className="text-sm font-semibold text-on-surface">₺{p.mrr.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.renk }}></div></div>
                  <p className="text-xs text-on-surface-variant mt-1">%{pct.toFixed(1)} pay</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>En Çok Gelir Getiren Firmalar</h3>
          <div className="space-y-2">
            {topFirmalar.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                <span className="text-xs text-on-surface-variant w-4 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">corporate_fare</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{f.ad}</p><p className="text-xs text-on-surface-variant">{paketLabel[f.paket]}</p></div>
                <p className="text-sm font-semibold text-tertiary">₺{f.mrr.toLocaleString("tr-TR")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Detay</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3"><tr className="text-left text-on-surface-variant"><th className="px-4 py-3 font-medium">Ay</th><th className="px-4 py-3 font-medium text-right">MRR</th><th className="px-4 py-3 font-medium text-center">Yeni Firma</th><th className="px-4 py-3 font-medium text-center">İptal</th><th className="px-4 py-3 font-medium text-right">Net</th></tr></thead>
            <tbody>
              {revenue.map(r => (
                <tr key={r.ay} className="border-b border-white/5">
                  <td className="px-4 py-3 text-on-surface">{r.ay}</td>
                  <td className="px-4 py-3 text-right font-medium text-on-surface">₺{r.mrr.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-center text-tertiary">+{r.yeniFirma}</td>
                  <td className="px-4 py-3 text-center text-red-400">-{r.iptal}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: r.yeniFirma - r.iptal >= 0 ? "#42faba" : "#ff6b6b" }}>{r.yeniFirma - r.iptal >= 0 ? "+" : ""}{r.yeniFirma - r.iptal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (<div className="glass-card rounded-2xl p-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div><p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p><p className="text-sm text-on-surface-variant mt-0.5">{label}</p><p className="text-xs mt-2" style={{ color }}>{sub}</p></div>);
}
