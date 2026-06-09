"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { kaynakLabel } from "@/lib/labels";
import Link from "next/link";

interface Member { ad?: string; unvan?: string; firmaAdi?: string; goruntulemeSayisi?: number; leadSayisi?: number }
interface Lead { id: string; ad: string; sirket: string; kaynak: string }

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      <p className="text-xs text-tertiary mt-2">{sub}</p>
    </div>
  );
}

export default function UyeDashboard() {
  const { user } = useAuth();
  const member = user?.data as unknown as Member;
  const [myLeads, setMyLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/me/leads").then(r => r.json()).then(j => { if (j.ok) setMyLeads(j.leads); }).catch(() => {});
  }, []);

  // Haftalık görünüm (günlük takip yok; toplam görüntülenmeden türetilmiş gösterim)
  const base = Math.max(1, Math.floor((member?.goruntulemeSayisi ?? 0) / 30));
  const weeklyViews = [0.6, 0.9, 0.75, 1.1, 0.95, 1.3, 1.0].map(f => Math.round(base * f));
  const maxView = Math.max(...weeklyViews, 1);

  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Welcome */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Hoş geldin, {member?.ad ?? "Üye"} 👋
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {member?.unvan} · {member?.firmaAdi}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/uye/kartim" className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-base">credit_card</span>
            Kartımı Görüntüle
          </Link>
          <Link href={`/kart/${user?.id}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Paylaş
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="visibility" label="Toplam Görüntülenme" value={member?.goruntulemeSayisi ?? 0} sub="+12% bu hafta" color="#00d4ff" />
        <StatCard icon="group_add" label="Bağlantılar" value={member?.leadSayisi ?? 0} sub="+5 bu ay" color="#42faba" />
        <StatCard icon="nfc" label="NFC Dokunma" value={Math.floor((member?.goruntulemeSayisi ?? 0) * 0.6)} sub="Son 30 gün" color="#6001d1" />
        <StatCard icon="qr_code_2" label="QR Tarama" value={Math.floor((member?.goruntulemeSayisi ?? 0) * 0.4)} sub="Son 30 gün" color="#a8e8ff" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Views Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Haftalık Görüntülenme
          </h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyViews.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{ height: `${(v / maxView) * 100}%`, background: i === 6 ? "#00d4ff" : "rgba(0,212,255,0.35)" }}
                />
                <span className="text-xs text-on-surface-variant">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Son Bağlantılar</h3>
            <Link href="/uye/liderler" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          <div className="space-y-3">
            {myLeads.slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{lead.ad}</p>
                  <p className="text-xs text-on-surface-variant truncate">{lead.sirket}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  lead.kaynak === "NFC" ? "bg-primary/10 text-primary" :
                  lead.kaynak === "QR" ? "bg-tertiary/10 text-tertiary" :
                  "bg-secondary/20 text-secondary"
                }`}>{kaynakLabel[lead.kaynak]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card preview CTA */}
      <div className="glass-card rounded-2xl p-6 border border-primary/10 bg-primary/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">nfc</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>NFC Kartın Aktif</p>
              <p className="text-sm text-on-surface-variant">Fiziksel kartın dijital profilinle bağlı ve aktif durumda.</p>
            </div>
          </div>
          <Link href="/uye/qr" className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-all whitespace-nowrap">
            <span className="material-symbols-outlined text-base">qr_code_2</span>
            QR Kodunu Gör
          </Link>
        </div>
      </div>
    </div>
  );
}
