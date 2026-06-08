"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { basvuruDurumMap, trDate } from "@/lib/labels";

interface Application {
  id: string; firmaAdi: string; yetkili: string; email: string; telefon: string;
  uyeSayisi: string; mesaj: string; durum: string; createdAt: string;
}

export default function AdminBasvurularPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("tum");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/applications").then(r => r.json()).then(j => { if (j.ok) setApps(j.applications); }).finally(() => setLoading(false));
  }, []);

  const filtered = apps.filter(a => {
    if (tab !== "tum" && a.durum !== tab) return false;
    if (q && !a.firmaAdi.toLowerCase().includes(q.toLowerCase()) && !a.email.toLowerCase().includes(q.toLowerCase()) && !a.yetkili.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { tum: apps.length };
  Object.keys(basvuruDurumMap).forEach(k => counts[k] = apps.filter(a => a.durum === k).length);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(basvuruDurumMap).map(([d, v]) => (
          <button key={d} onClick={() => setTab(d)}
            className={`glass-card rounded-2xl p-5 text-left transition-all hover:border-primary/20 ${tab === d ? "border-primary/30" : ""}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${v.color}20`, border: `1px solid ${v.color}30` }}>
              <span className="material-symbols-outlined text-xl"
                style={{ color: v.color }}>
                {d === "YENI" ? "mark_email_unread" : d === "ILETISIMDE" ? "forum" : d === "DONUSUM" ? "task_alt" : "block"}
              </span>
            </div>
            <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{counts[d] ?? 0}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{v.label}</p>
          </button>
        ))}
      </div>

      {/* Filtre çubuğu */}
      <div className="glass-card rounded-2xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Firma, yetkili veya e-posta ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
        </div>
        <div className="flex flex-wrap gap-1">
          <TabBtn active={tab === "tum"} onClick={() => setTab("tum")} label="Tümü" count={counts.tum} />
          {Object.entries(basvuruDurumMap).map(([d, v]) => (
            <TabBtn key={d} active={tab === d} onClick={() => setTab(d)} label={v.label} count={counts[d]} color={v.color} />
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inbox</span>
          Bu durumda başvuru yok.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map(a => {
            const d = basvuruDurumMap[a.durum];
            return (
              <Link key={a.id} href={`/admin/basvurular/${a.id}`}
                className="glass-card rounded-2xl p-5 hover:border-primary/20 transition-all block group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-on-surface font-semibold group-hover:text-primary transition-all" style={{ fontFamily: "Sora, sans-serif" }}>
                      {a.firmaAdi}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{a.yetkili}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}30` }}>
                    {d.label}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-on-surface-variant mb-3">
                  <p className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">mail</span>{a.email}
                  </p>
                  {a.telefon && (
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">phone</span>{a.telefon}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">group</span>{a.uyeSayisi} üye
                  </p>
                </div>

                {a.mesaj && <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{a.mesaj}</p>}

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-on-surface-variant">{trDate(a.createdAt)}</span>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Detay <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <p className="text-xs text-on-surface-variant text-right">{filtered.length} başvuru listeleniyor.</p>
    </div>
  );
}

function TabBtn({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${active ? "bg-primary-container/20 text-primary border border-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}>
      {color && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />}
      {label}
      <span className="text-on-surface-variant">({count})</span>
    </button>
  );
}
