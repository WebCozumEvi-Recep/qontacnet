"use client";
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
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    fetch("/api/admin/applications").then(r => r.json()).then(j => { if (j.ok) setApps(j.applications); }).finally(() => setLoading(false));
  }, []);

  const filtered = tab === "tum" ? apps : apps.filter(a => a.durum === tab);
  const counts: Record<string, number> = { tum: apps.length };
  Object.keys(basvuruDurumMap).forEach(k => counts[k] = apps.filter(a => a.durum === k).length);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(basvuruDurumMap).map(d => (
          <Stat key={d} icon={d === "YENI" ? "mark_email_unread" : d === "ILETISIMDE" ? "forum" : d === "DONUSUM" ? "task_alt" : "block"} label={basvuruDurumMap[d].label} value={counts[d]} color={basvuruDurumMap[d].color} />
        ))}
      </div>

      <div className="glass-card rounded-2xl p-2 flex flex-wrap gap-1">
        <TabButton active={tab === "tum"} onClick={() => setTab("tum")} label="Tümü" count={counts.tum} />
        {Object.keys(basvuruDurumMap).map(d => <TabButton key={d} active={tab === d} onClick={() => setTab(d)} label={basvuruDurumMap[d].label} count={counts[d]} color={basvuruDurumMap[d].color} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant lg:col-span-2">Yükleniyor...</div> : filtered.map(a => (
          <div key={a.id} onClick={() => setSelected(a)} className="glass-card rounded-2xl p-5 cursor-pointer hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>{a.firmaAdi}</p><p className="text-xs text-on-surface-variant mt-0.5">{a.yetkili}</p></div>
              <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${basvuruDurumMap[a.durum].color}15`, color: basvuruDurumMap[a.durum].color, border: `1px solid ${basvuruDurumMap[a.durum].color}30` }}>{basvuruDurumMap[a.durum].label}</span>
            </div>
            <div className="space-y-1 text-xs text-on-surface-variant mb-3">
              <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">mail</span>{a.email}</p>
              <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">phone</span>{a.telefon}</p>
              <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">group</span>{a.uyeSayisi} üye</p>
            </div>
            <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{a.mesaj}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white/5"><span className="text-xs text-on-surface-variant">{trDate(a.createdAt)}</span><span className="text-xs text-primary">Detay →</span></div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant lg:col-span-2">Bu durumda başvuru yok.</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="text-lg font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{selected.firmaAdi}</h3><p className="text-xs text-on-surface-variant mt-1">Başvuru: {trDate(selected.createdAt)}</p></div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
            </div>
            <div className="space-y-3 mb-5">
              <Row icon="person" label="Yetkili" value={selected.yetkili} /><Row icon="mail" label="E-posta" value={selected.email} />
              <Row icon="phone" label="Telefon" value={selected.telefon} /><Row icon="group" label="Üye Sayısı" value={selected.uyeSayisi} />
            </div>
            <div className="p-4 rounded-xl bg-white/3 mb-5"><p className="text-xs text-on-surface-variant mb-1">Mesaj</p><p className="text-sm text-on-surface">{selected.mesaj}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">İletişime Geç</button>
              <button className="py-3 glass-card rounded-xl text-sm text-on-surface-variant hover:text-tertiary transition-all">Firmaya Dönüştür</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-primary-container/20 text-primary border border-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"}`}>{color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}{label}<span className="text-xs text-on-surface-variant">({count})</span></button>);
}
function Stat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (<div className="glass-card rounded-2xl p-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}30` }}><span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span></div><p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p><p className="text-sm text-on-surface-variant mt-0.5">{label}</p></div>);
}
function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (<div className="flex items-center gap-3"><span className="material-symbols-outlined text-on-surface-variant text-base">{icon}</span><div className="flex-1 min-w-0"><p className="text-xs text-on-surface-variant">{label}</p><p className="text-on-surface text-sm">{value}</p></div></div>);
}
