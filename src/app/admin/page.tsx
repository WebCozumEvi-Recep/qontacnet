"use client";
import Link from "next/link";
import { mockAdminFirmalar, mockOrders, mockApplications, mockCardBatches, mockRevenue } from "@/lib/mock-data";

function StatCard({ icon, label, value, sub, color, href }: { icon: string; label: string; value: string | number; sub: string; color: string; href?: string }) {
  const cls = "glass-card rounded-2xl p-5 transition-all " + (href ? "hover:border-primary/20 cursor-pointer" : "");
  const inner = (
    <>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      <p className="text-xs mt-2" style={{ color }}>{sub}</p>
    </>
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export default function AdminDashboard() {
  const aktifFirma = mockAdminFirmalar.filter(f => f.durum === "aktif").length;
  const denemeFirma = mockAdminFirmalar.filter(f => f.durum === "deneme").length;
  const toplamUye = mockAdminFirmalar.reduce((a, f) => a + f.uyeSayisi, 0);
  const toplamAktifKart = mockAdminFirmalar.reduce((a, f) => a + f.aktifKart, 0);
  const mrr = mockAdminFirmalar.reduce((a, f) => a + f.mrr, 0);
  const yeniBasvuru = mockApplications.filter(a => a.durum === "yeni").length;
  const aktifSiparis = mockOrders.filter(o => o.durum === "hazirlaniyor" || o.durum === "uretimde" || o.durum === "kargoda").length;
  const stoktakiKart = mockCardBatches.filter(b => b.durum === "stokta").reduce((a, b) => a + b.miktar, 0);

  const maxMrr = Math.max(...mockRevenue.map(r => r.mrr));

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">shield_person</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
              QONTAC Platform Yönetimi
            </h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              <span className="text-primary font-medium">{aktifFirma} aktif firma</span> · {toplamUye} üye · ₺{mrr.toLocaleString("tr-TR")} aylık gelir
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/basvurular" className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-base">mark_email_unread</span>
            {yeniBasvuru} Yeni Başvuru
          </Link>
          <Link href="/admin/gelir" className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-base">trending_up</span>
            Rapor
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="corporate_fare" label="Aktif Firma" value={aktifFirma} sub={`${denemeFirma} deneme süresinde`} color="#00d4ff" href="/admin/firmalar" />
        <StatCard icon="payments" label="Aylık Gelir (MRR)" value={`₺${(mrr / 1000).toFixed(1)}K`} sub="Mevcut ay" color="#42faba" href="/admin/gelir" />
        <StatCard icon="credit_card" label="Aktif Kart" value={toplamAktifKart} sub={`${stoktakiKart} stokta`} color="#6001d1" href="/admin/kartlar" />
        <StatCard icon="local_shipping" label="Bekleyen Sipariş" value={aktifSiparis} sub="Hazırlanıyor / Kargoda" color="#a8e8ff" href="/admin/siparisler" />
      </div>

      {/* MRR Chart + Top Firmalar */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Gelir Trendi (MRR)</h3>
            <span className="text-xs text-on-surface-variant">12 aylık</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {mockRevenue.map((r, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <div className="w-full rounded-t-md transition-all hover:opacity-80"
                  style={{ height: `${(r.mrr / maxMrr) * 100}%`, background: i === mockRevenue.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.4)" }}
                  title={`${r.ay}: ₺${r.mrr.toLocaleString("tr-TR")}`} />
                <span className="text-xs text-on-surface-variant" style={{ fontSize: "10px" }}>{r.ay}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>En Çok Üyesi Olan Firmalar</h3>
            <Link href="/admin/firmalar" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-3">
            {[...mockAdminFirmalar].sort((a, b) => b.uyeSayisi - a.uyeSayisi).slice(0, 4).map((f, i) => (
              <Link key={f.id} href={`/admin/firmalar/${f.id}`} className="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-all">
                <span className="text-xs text-on-surface-variant w-4 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">corporate_fare</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{f.ad}</p>
                  <p className="text-xs text-on-surface-variant">{f.paket}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{f.uyeSayisi}</p>
                  <p className="text-xs text-on-surface-variant">üye</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Recent Applications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Son Siparişler</h3>
            <Link href="/admin/siparisler" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {mockOrders.slice(0, 4).map(o => (
              <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{o.firma}</p>
                  <p className="text-xs text-on-surface-variant">{o.siparisNo} · {o.adet} adet</p>
                </div>
                <OrderBadge durum={o.durum} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Yeni Başvurular</h3>
            <Link href="/admin/basvurular" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {mockApplications.filter(a => a.durum === "yeni" || a.durum === "iletisimde").slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/3 transition-all">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-sm">business</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{a.firmaAdi}</p>
                  <p className="text-xs text-on-surface-variant">{a.yetkili} · {a.uyeSayisi} üye</p>
                </div>
                <span className="text-xs text-on-surface-variant whitespace-nowrap">{new Date(a.tarih).toLocaleDateString("tr-TR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderBadge({ durum }: { durum: string }) {
  const map: Record<string, { label: string; color: string }> = {
    hazirlaniyor: { label: "Hazırlanıyor", color: "#a8e8ff" },
    uretimde: { label: "Üretimde", color: "#6001d1" },
    kargoda: { label: "Kargoda", color: "#00d4ff" },
    teslim: { label: "Teslim", color: "#42faba" },
    iptal: { label: "İptal", color: "#ff6b6b" },
  };
  const m = map[durum] ?? { label: durum, color: "#fff" };
  return (
    <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>
      {m.label}
    </span>
  );
}
