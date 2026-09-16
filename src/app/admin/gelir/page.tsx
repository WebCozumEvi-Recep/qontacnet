"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Rev { ay: string; yil: number; tutar: number; siparis: number; adet: number; referansli: number }
interface TopFirma { id: string; ad: string; tutar: number; adet: number; siparis: number }

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

export default function AdminGelirPage() {
  const [revenue, setRevenue] = useState<Rev[]>([]);
  const [topFirmalar, setTopFirmalar] = useState<TopFirma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue").then(r => r.json()).then(j => { if (j.ok) { setRevenue(j.revenue); setTopFirmalar(j.topFirmalar); } }).finally(() => setLoading(false));
  }, []);

  if (loading || revenue.length === 0) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">Yükleniyor...</div>;

  const buAy = revenue[revenue.length - 1];
  const gecenAy = revenue[revenue.length - 2];
  const delta = buAy.tutar - (gecenAy?.tutar ?? 0);
  const deltaMetin = gecenAy?.tutar ? `${delta >= 0 ? "+" : ""}${((delta / gecenAy.tutar) * 100).toFixed(1)}% geçen aya göre` : "Geçen ay satış yok";
  const toplam = revenue.reduce((a, r) => a + r.tutar, 0);
  const toplamAdet = revenue.reduce((a, r) => a + r.adet, 0);
  const referansli = revenue.reduce((a, r) => a + r.referansli, 0);
  const maxTutar = Math.max(...revenue.map(r => r.tutar), 1);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="payments" label="Bu Ay Satış" value={tl(buAy.tutar)} sub={deltaMetin} color="#42faba" />
        <Stat icon="account_balance" label="12 Ay Toplam" value={tl(toplam)} sub={`${revenue.reduce((a, r) => a + r.siparis, 0)} sipariş`} color="#d4af37" />
        <Stat icon="credit_card" label="Satılan Ürün" value={toplamAdet.toLocaleString("tr-TR")} sub="Son 12 ay, adet" color="#6001d1" />
        <Stat icon="handshake" label="Firma Referanslı" value={tl(referansli)} sub={toplam ? `%${((referansli / toplam) * 100).toFixed(0)} pay` : "—"} color="#f0d289" />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Satış Geliri</h3>
          <p className="text-xs text-on-surface-variant mt-1">Son 12 ay · ödemesi alınmış ve elle girilen siparişler, iptaller hariç</p>
        </div>
        <div className="flex items-end gap-3 h-56">
          {revenue.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group cursor-pointer">
              <div className="text-xs text-on-surface opacity-0 group-hover:opacity-100 transition-opacity font-semibold whitespace-nowrap">{tl(r.tutar)}</div>
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${(r.tutar / maxTutar) * 100}%`, minHeight: r.tutar ? 2 : 0, background: i === revenue.length - 1 ? "#d4af37" : "rgba(212, 175, 55,0.4)" }} />
              <span className="text-xs text-on-surface-variant">{r.ay}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Firma Referanslı Satışlar</h3>
          <p className="text-xs text-on-surface-variant mb-4">Tüm zamanlar · satış linki veya admin seçimiyle firmaya bağlanan siparişler</p>
          {topFirmalar.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-6 text-center">Henüz firma referanslı satış yok.</p>
          ) : (
            <div className="space-y-2">
              {topFirmalar.map((f, i) => (
                <Link key={f.id} href={`/admin/firmalar/${f.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                  <span className="text-xs text-on-surface-variant w-4 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">corporate_fare</span></div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{f.ad}</p><p className="text-xs text-on-surface-variant">{f.siparis} sipariş · {f.adet} adet</p></div>
                  <p className="text-sm font-semibold text-tertiary">{tl(f.tutar)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Detay</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/3"><tr className="text-left text-on-surface-variant"><th className="px-4 py-3 font-medium">Ay</th><th className="px-4 py-3 font-medium text-center">Sipariş</th><th className="px-4 py-3 font-medium text-center">Adet</th><th className="px-4 py-3 font-medium text-right">Referanslı</th><th className="px-4 py-3 font-medium text-right">Toplam</th></tr></thead>
              <tbody>
                {[...revenue].reverse().map(r => (
                  <tr key={`${r.yil}-${r.ay}`} className="border-b border-white/5">
                    <td className="px-4 py-3 text-on-surface whitespace-nowrap">{r.ay} {r.yil}</td>
                    <td className="px-4 py-3 text-center text-on-surface">{r.siparis}</td>
                    <td className="px-4 py-3 text-center text-on-surface">{r.adet}</td>
                    <td className="px-4 py-3 text-right text-on-surface-variant">{tl(r.referansli)}</td>
                    <td className="px-4 py-3 text-right font-medium text-on-surface">{tl(r.tutar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (<div className="glass-card rounded-2xl p-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div><p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p><p className="text-sm text-on-surface-variant mt-0.5">{label}</p><p className="text-xs mt-2" style={{ color }}>{sub}</p></div>);
}
