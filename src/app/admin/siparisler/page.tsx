"use client";
import { useMemo, useState } from "react";
import { mockOrders, SiparisDurum } from "@/lib/mock-data";

const durumMap: Record<SiparisDurum, { label: string; color: string; icon: string }> = {
  hazirlaniyor: { label: "Hazırlanıyor", color: "#a8e8ff", icon: "pending" },
  uretimde: { label: "Üretimde", color: "#6001d1", icon: "factory" },
  kargoda: { label: "Kargoda", color: "#00d4ff", icon: "local_shipping" },
  teslim: { label: "Teslim Edildi", color: "#42faba", icon: "check_circle" },
  iptal: { label: "İptal", color: "#ff6b6b", icon: "cancel" },
};

export default function AdminSiparislerPage() {
  const [tab, setTab] = useState<SiparisDurum | "tum">("tum");

  const counts = useMemo(() => {
    const c: Record<string, number> = { tum: mockOrders.length };
    (Object.keys(durumMap) as SiparisDurum[]).forEach(k => {
      c[k] = mockOrders.filter(o => o.durum === k).length;
    });
    return c;
  }, []);

  const filtered = tab === "tum" ? mockOrders : mockOrders.filter(o => o.durum === tab);
  const toplamCiro = filtered.filter(o => o.durum !== "iptal").reduce((a, o) => a + o.tutar, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="receipt_long" label="Toplam Sipariş" value={mockOrders.length} sub="Tüm zamanlar" color="#00d4ff" />
        <Stat icon="pending_actions" label="Bekleyen" value={counts["hazirlaniyor"] + counts["uretimde"] + counts["kargoda"]} sub="Hazırlanan + Kargoda" color="#a8e8ff" />
        <Stat icon="check_circle" label="Teslim Edilen" value={counts["teslim"]} sub="Tamamlandı" color="#42faba" />
        <Stat icon="payments" label="Ciro" value={`₺${toplamCiro.toLocaleString("tr-TR")}`} sub={tab === "tum" ? "Tüm aktif" : durumMap[tab as SiparisDurum].label} color="#6001d1" />
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-2 flex flex-wrap gap-1">
        <TabButton active={tab === "tum"} onClick={() => setTab("tum")} label="Tümü" count={counts.tum} />
        {(Object.keys(durumMap) as SiparisDurum[]).map(d => (
          <TabButton key={d} active={tab === d} onClick={() => setTab(d)} label={durumMap[d].label} count={counts[d]} color={durumMap[d].color} />
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(o => (
          <div key={o.id} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary/20 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${durumMap[o.durum].color}15`, border: `1px solid ${durumMap[o.durum].color}30` }}>
              <span className="material-symbols-outlined" style={{ color: durumMap[o.durum].color }}>{durumMap[o.durum].icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{o.siparisNo}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${durumMap[o.durum].color}15`, color: durumMap[o.durum].color, border: `1px solid ${durumMap[o.durum].color}30` }}>
                  {durumMap[o.durum].label}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">{o.firma} · {o.urun}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {new Date(o.tarih).toLocaleDateString("tr-TR")}
                {o.kargoNo && <span> · Kargo: <span className="font-mono">{o.kargoNo}</span></span>}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-on-surface-variant">Adet</p>
              <p className="text-on-surface font-medium">{o.adet}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-on-surface-variant">Tutar</p>
              <p className="text-on-surface font-bold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>₺{o.tutar.toLocaleString("tr-TR")}</p>
            </div>
            <button className="px-4 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">
              Yönet
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Bu durumda sipariş yok.</div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active ? "bg-primary-container/20 text-primary border border-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
      }`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {label}
      <span className="text-xs text-on-surface-variant">({count})</span>
    </button>
  );
}

function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      <p className="text-xs mt-2" style={{ color }}>{sub}</p>
    </div>
  );
}
