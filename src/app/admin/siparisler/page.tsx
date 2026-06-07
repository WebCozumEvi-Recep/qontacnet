"use client";
import { useEffect, useMemo, useState } from "react";
import { siparisDurumMap, trDate } from "@/lib/labels";

interface Order {
  id: string; siparisNo: string; firma: string; urun: string; adet: number;
  tutar: number; durum: string; kargoNo: string | null; createdAt: string;
}

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("tum");

  useEffect(() => {
    fetch("/api/admin/orders").then(r => r.json()).then(j => { if (j.ok) setOrders(j.orders); }).finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { tum: orders.length };
    Object.keys(siparisDurumMap).forEach(k => c[k] = orders.filter(o => o.durum === k).length);
    return c;
  }, [orders]);

  const filtered = tab === "tum" ? orders : orders.filter(o => o.durum === tab);
  const toplamCiro = filtered.filter(o => o.durum !== "IPTAL").reduce((a, o) => a + o.tutar, 0);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon="receipt_long" label="Toplam Sipariş" value={orders.length} sub="Tüm zamanlar" color="#00d4ff" />
        <Stat icon="pending_actions" label="Bekleyen" value={(counts["HAZIRLANIYOR"]||0)+(counts["URETIMDE"]||0)+(counts["KARGODA"]||0)} sub="Hazırlanan + Kargoda" color="#a8e8ff" />
        <Stat icon="check_circle" label="Teslim Edilen" value={counts["TESLIM"]||0} sub="Tamamlandı" color="#42faba" />
        <Stat icon="payments" label="Ciro" value={`₺${toplamCiro.toLocaleString("tr-TR")}`} sub={tab === "tum" ? "Tüm aktif" : siparisDurumMap[tab]?.label} color="#6001d1" />
      </div>

      <div className="glass-card rounded-2xl p-2 flex flex-wrap gap-1">
        <TabButton active={tab === "tum"} onClick={() => setTab("tum")} label="Tümü" count={counts.tum} />
        {Object.keys(siparisDurumMap).map(d => (
          <TabButton key={d} active={tab === d} onClick={() => setTab(d)} label={siparisDurumMap[d].label} count={counts[d]||0} color={siparisDurumMap[d].color} />
        ))}
      </div>

      <div className="space-y-3">
        {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div> : filtered.map(o => (
          <div key={o.id} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-primary/20 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${siparisDurumMap[o.durum].color}15`, border: `1px solid ${siparisDurumMap[o.durum].color}30` }}>
              <span className="material-symbols-outlined" style={{ color: siparisDurumMap[o.durum].color }}>{siparisDurumMap[o.durum].icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{o.siparisNo}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${siparisDurumMap[o.durum].color}15`, color: siparisDurumMap[o.durum].color, border: `1px solid ${siparisDurumMap[o.durum].color}30` }}>{siparisDurumMap[o.durum].label}</span>
              </div>
              <p className="text-sm text-on-surface-variant">{o.firma} · {o.urun}</p>
              <p className="text-xs text-on-surface-variant mt-1">{trDate(o.createdAt)}{o.kargoNo && <span> · Kargo: <span className="font-mono">{o.kargoNo}</span></span>}</p>
            </div>
            <div className="text-left md:text-right"><p className="text-xs text-on-surface-variant">Adet</p><p className="text-on-surface font-medium">{o.adet}</p></div>
            <div className="text-left md:text-right"><p className="text-xs text-on-surface-variant">Tutar</p><p className="text-on-surface font-bold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>₺{o.tutar.toLocaleString("tr-TR")}</p></div>
            <button className="px-4 py-2 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all">Yönet</button>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Bu durumda sipariş yok.</div>}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-primary-container/20 text-primary border border-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}{label}<span className="text-xs text-on-surface-variant">({count})</span>
    </button>
  );
}
function Stat({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p><p className="text-xs mt-2" style={{ color }}>{sub}</p>
    </div>
  );
}
