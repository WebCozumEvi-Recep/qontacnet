"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { paketLabel, siparisDurumMap, trDate } from "@/lib/labels";

interface Overview {
  stats: { aktifFirma: number; denemeFirma: number; toplamUye: number; aktifKart: number; mrr: number; yeniBasvuru: number; aktifSiparis: number; stoktakiKart: number };
  revenue: { ay: string; mrr: number }[];
  topFirmalar: { id: string; ad: string; paket: string; uyeSayisi: number }[];
  sonSiparisler: { id: string; siparisNo: string; firma: string; adet: number; durum: string }[];
  yeniBasvurular: { id: string; firmaAdi: string; yetkili: string; uyeSayisi: string; createdAt: string }[];
}

function StatCard({ icon, label, value, sub, color, href }: { icon: string; label: string; value: string | number; sub: string; color: string; href?: string }) {
  const cls = "glass-card rounded-2xl p-5 transition-all " + (href ? "hover:border-primary/20 cursor-pointer" : "");
  const inner = (<>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div>
    <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
    <p className="text-sm text-on-surface-variant mt-0.5">{label}</p><p className="text-xs mt-2" style={{ color }}>{sub}</p>
  </>);
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export default function AdminDashboard() {
  const [d, setD] = useState<Overview | null>(null);
  useEffect(() => { fetch("/api/admin/overview").then(r => r.json()).then(j => { if (j.ok) setD(j); }); }, []);

  if (!d) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[1200px]">Yükleniyor...</div>;
  const s = d.stats;
  const maxMrr = Math.max(...d.revenue.map(r => r.mrr), 1);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-3xl">shield_person</span></div>
          <div><h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>QONTAC Platform Yönetimi</h2><p className="text-on-surface-variant text-sm mt-0.5"><span className="text-primary font-medium">{s.aktifFirma} aktif firma</span> · {s.toplamUye} üye · ₺{s.mrr.toLocaleString("tr-TR")} aylık gelir</p></div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/basvurular" className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all"><span className="material-symbols-outlined text-base">mark_email_unread</span>{s.yeniBasvuru} Yeni Başvuru</Link>
          <Link href="/admin/gelir" className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all"><span className="material-symbols-outlined text-base">trending_up</span>Rapor</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="corporate_fare" label="Aktif Firma" value={s.aktifFirma} sub={`${s.denemeFirma} deneme süresinde`} color="#00d4ff" href="/admin/firmalar" />
        <StatCard icon="payments" label="Aylık Gelir (MRR)" value={`₺${(s.mrr / 1000).toFixed(1)}K`} sub="Mevcut ay" color="#42faba" href="/admin/gelir" />
        <StatCard icon="credit_card" label="Aktif Kart" value={s.aktifKart} sub={`${s.stoktakiKart} stokta`} color="#6001d1" href="/admin/kartlar" />
        <StatCard icon="local_shipping" label="Bekleyen Sipariş" value={s.aktifSiparis} sub="Hazırlanıyor / Kargoda" color="#a8e8ff" href="/admin/siparisler" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Gelir Trendi (MRR)</h3><span className="text-xs text-on-surface-variant">12 aylık</span></div>
          <div className="flex items-end gap-2 h-40">
            {d.revenue.map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <div className="w-full rounded-t-md transition-all hover:opacity-80" style={{ height: `${(r.mrr / maxMrr) * 100}%`, background: i === d.revenue.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.4)" }} title={`${r.ay}: ₺${r.mrr.toLocaleString("tr-TR")}`} />
                <span className="text-xs text-on-surface-variant" style={{ fontSize: "10px" }}>{r.ay}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>En Çok Üyesi Olan Firmalar</h3><Link href="/admin/firmalar" className="text-xs text-primary hover:underline">Tümü →</Link></div>
          <div className="space-y-3">
            {d.topFirmalar.map((f, i) => (
              <Link key={f.id} href={`/admin/firmalar/${f.id}`} className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-all">
                <span className="text-xs text-on-surface-variant w-4 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">corporate_fare</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{f.ad}</p><p className="text-xs text-on-surface-variant">{paketLabel[f.paket]}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-primary">{f.uyeSayisi}</p><p className="text-xs text-on-surface-variant">üye</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Son Siparişler</h3><Link href="/admin/siparisler" className="text-xs text-primary hover:underline">Tümü →</Link></div>
          <div className="space-y-2">
            {d.sonSiparisler.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">local_shipping</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{o.firma}</p><p className="text-xs text-on-surface-variant">{o.siparisNo} · {o.adet} adet</p></div>
                <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${siparisDurumMap[o.durum].color}15`, color: siparisDurumMap[o.durum].color, border: `1px solid ${siparisDurumMap[o.durum].color}30` }}>{siparisDurumMap[o.durum].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Yeni Başvurular</h3><Link href="/admin/basvurular" className="text-xs text-primary hover:underline">Tümü →</Link></div>
          <div className="space-y-2">
            {d.yeniBasvurular.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-tertiary text-sm">business</span></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-on-surface font-medium truncate">{a.firmaAdi}</p><p className="text-xs text-on-surface-variant">{a.yetkili} · {a.uyeSayisi} üye</p></div>
                <span className="text-xs text-on-surface-variant whitespace-nowrap">{trDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
