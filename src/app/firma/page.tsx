"use client";
import { useAuth } from "@/lib/auth-context";
import { Firma, mockMembers, mockLeads, monthlyLeads } from "@/lib/mock-data";
import Link from "next/link";

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

export default function FirmaDashboard() {
  const { user } = useAuth();
  const firma = user?.data as Firma;
  const aktifUye = mockMembers.filter(m => m.aktif).length;
  const totalViews = mockMembers.reduce((a, m) => a + m.goruntulemeSayisi, 0);
  const totalLeads = mockMembers.reduce((a, m) => a + m.leadSayisi, 0);

  const maxLead = Math.max(...monthlyLeads);
  const months = ["Oc", "Şu", "Ma", "Ni", "Ma", "Ha", "Te", "Ag", "Ey", "Ek", "Ka", "Ar"];

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
              {firma?.ad}
            </h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              <span className="text-primary font-medium">{firma?.paket}</span> Paketi · {firma?.sektor}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/firma/uyeler"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-base">group_add</span>
            Üye Ekle
          </Link>
          <Link href="/firma/analitik"
            className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-base">bar_chart</span>
            Rapor
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="group" label="Toplam Üye" value={mockMembers.length} sub={`${aktifUye} aktif`} color="#00d4ff" href="/firma/uyeler" />
        <StatCard icon="credit_card" label="Aktif Kart" value={aktifUye} sub="NFC bağlı" color="#42faba" />
        <StatCard icon="visibility" label="Toplam Görüntülenme" value={totalViews} sub="Tüm üyeler" color="#6001d1" href="/firma/analitik" />
        <StatCard icon="group_add" label="Toplam Lead" value={totalLeads} sub="Bu ay" color="#a8e8ff" href="/firma/analitik" />
      </div>

      {/* Chart + Members */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Lead Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Aylık Lead Trendi
          </h3>
          <div className="flex items-end gap-1.5 h-36">
            {monthlyLeads.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="w-full rounded-t-md transition-all"
                  style={{ height: `${(v / maxLead) * 100}%`, background: i === 11 ? "#00d4ff" : "rgba(0,212,255,0.35)" }} />
                <span className="text-xs text-on-surface-variant" style={{ fontSize: "10px" }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Members */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>En Aktif Üyeler</h3>
            <Link href="/firma/uyeler" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-3">
            {[...mockMembers].sort((a, b) => b.goruntulemeSayisi - a.goruntulemeSayisi).slice(0, 4).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-4 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium">{m.ad} {m.soyad}</p>
                  <p className="text-xs text-on-surface-variant">{m.unvan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{m.goruntulemeSayisi}</p>
                  <p className="text-xs text-on-surface-variant">görüntüleme</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Son Aktiviteler</h3>
        <div className="space-y-3">
          {[
            { icon: "person_add", text: "Zeynep Arslan yeni bir lead aldı", time: "2 saat önce", color: "#42faba" },
            { icon: "nfc", text: "Mehmet Kaya profili NFC ile görüntülendi", time: "4 saat önce", color: "#00d4ff" },
            { icon: "credit_card", text: "Can Yıldız kart rengini güncelledi", time: "Dün", color: "#6001d1" },
            { icon: "qr_code_2", text: "Ali Demir QR kod paylaştı", time: "Dün", color: "#a8e8ff" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15` }}>
                <span className="material-symbols-outlined text-sm" style={{ color: a.color }}>{a.icon}</span>
              </div>
              <p className="flex-1 text-sm text-on-surface-variant">{a.text}</p>
              <span className="text-xs text-on-surface-variant/60 whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
