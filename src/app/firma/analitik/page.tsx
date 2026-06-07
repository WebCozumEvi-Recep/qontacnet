"use client";
import { useEffect, useState } from "react";

const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface Member { id: string; ad: string; soyad: string; unvan: string; departman: string; kartRenk: string; goruntulemeSayisi: number; leadSayisi: number }
interface Stats { stats: { toplamGoruntulenme: number; toplamLead: number }; monthly: number[]; kaynakDagilim: { NFC: number; QR: number; LINK: number } }

export default function AnalitikPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/firma/members").then(r => r.json()).then(j => { if (j.ok) setMembers(j.members); });
    fetch("/api/firma/stats").then(r => r.json()).then(j => { if (j.ok) setS(j); });
  }, []);

  const totalViews = s?.stats.toplamGoruntulenme ?? 0;
  const totalLeads = s?.stats.toplamLead ?? 0;
  const monthly = s?.monthly ?? [];
  const maxMonthly = Math.max(...(monthly.length ? monthly : [1]));

  // Haftalık görünüm (günlük takip yok; toplam görüntülenmeden türetilmiş gösterim)
  const weeklyBase = Math.max(1, Math.floor(totalViews / 30));
  const weeklyViews = [0.6, 0.9, 0.75, 1.1, 0.95, 1.3, 1.0].map(f => Math.round(weeklyBase * f));
  const maxWeekly = Math.max(...weeklyViews, 1);

  const kaynakToplam = s ? s.kaynakDagilim.NFC + s.kaynakDagilim.QR + s.kaynakDagilim.LINK : 0;
  const kaynak = [
    { label: "NFC Dokunma", value: s?.kaynakDagilim.NFC ?? 0, color: "#00d4ff" },
    { label: "QR Tarama", value: s?.kaynakDagilim.QR ?? 0, color: "#42faba" },
    { label: "Direkt Link", value: s?.kaynakDagilim.LINK ?? 0, color: "#6001d1" },
  ].map(k => ({ ...k, pct: kaynakToplam ? Math.round((k.value / kaynakToplam) * 100) : 0 }));

  // Departman bazlı (gerçek üyelerden)
  const depMap = new Map<string, { views: number; leads: number }>();
  members.forEach(m => {
    const dep = m.departman || "Diğer";
    const cur = depMap.get(dep) ?? { views: 0, leads: 0 };
    depMap.set(dep, { views: cur.views + m.goruntulemeSayisi, leads: cur.leads + m.leadSayisi });
  });
  const departmanData = [...depMap.entries()].map(([dep, v]) => ({ dep, ...v })).sort((a, b) => b.views - a.views);

  return (
    <div className="max-w-[1100px] space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "visibility", label: "Toplam Görüntülenme", value: totalViews, sub: "Tüm üyeler", color: "#00d4ff" },
          { icon: "group_add", label: "Toplam Lead", value: totalLeads, sub: "Tüm zamanlar", color: "#42faba" },
          { icon: "nfc", label: "NFC Dokunma", value: s?.kaynakDagilim.NFC ?? 0, sub: "Lead kaynağı", color: "#6001d1" },
          { icon: "conversion_path", label: "Dönüşüm Oranı", value: totalViews ? `${((totalLeads / totalViews) * 100).toFixed(1)}%` : "—", sub: "Lead / Görüntülenme", color: "#a8e8ff" },
        ].map(st => (
          <div key={st.label} className="glass-card rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${st.color}15`, border: `1px solid ${st.color}25` }}><span className="material-symbols-outlined text-xl" style={{ color: st.color }}>{st.icon}</span></div>
            <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{st.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{st.label}</p><p className="text-xs text-tertiary mt-2">{st.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Lead Trendi</h3>
          <p className="text-xs text-on-surface-variant mb-5">Son 12 ay</p>
          <div className="flex items-end gap-1.5 h-40">
            {monthly.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="w-full rounded-t-md transition-all relative group" style={{ height: `${(v / maxMonthly) * 100}%`, background: i === 11 ? "#00d4ff" : "rgba(0,212,255,0.35)" }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container px-1.5 py-0.5 rounded text-xs text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-10">{v}</div>
                </div>
                <span className="text-on-surface-variant" style={{ fontSize: "10px" }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Haftalık Görüntülenme</h3>
          <p className="text-xs text-on-surface-variant mb-5">Tahmini dağılım</p>
          <div className="flex items-end gap-2 h-40">
            {weeklyViews.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="w-full rounded-t-lg relative group" style={{ height: `${(v / maxWeekly) * 100}%`, background: i === 6 ? "#42faba" : "rgba(66,250,186,0.25)" }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container px-1.5 py-0.5 rounded text-xs text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-10">{v}</div>
                </div>
                <span className="text-on-surface-variant text-xs">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-5" style={{ fontFamily: "Sora, sans-serif" }}>Lead Kaynak Dağılımı</h3>
          <div className="space-y-4">
            {kaynak.map(k => (
              <div key={k.label}>
                <div className="flex justify-between text-sm mb-1.5"><span className="text-on-surface-variant">{k.label}</span><span className="text-on-surface font-medium">{k.value} <span className="text-on-surface-variant text-xs">({k.pct}%)</span></span></div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${k.pct}%`, background: k.color }} /></div>
              </div>
            ))}
            {kaynakToplam === 0 && <p className="text-sm text-on-surface-variant">Henüz lead verisi yok.</p>}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Departmana Göre</h3>
          <div className="space-y-3">
            {departmanData.map((d, i) => (
              <div key={d.dep} className="flex items-center gap-3"><span className="text-xs text-on-surface-variant w-4">{i + 1}</span><span className="text-sm text-on-surface flex-1">{d.dep}</span><span className="text-xs text-on-surface-variant w-20 text-right">{d.views} görüntüleme</span><span className="text-xs text-tertiary w-16 text-right">{d.leads} lead</span></div>
            ))}
            {departmanData.length === 0 && <p className="text-sm text-on-surface-variant">Veri yok.</p>}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Üye Performans Tablosu</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/5"><th className="text-left py-3 pr-4 text-xs text-on-surface-variant font-medium">Üye</th><th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Görüntülenme</th><th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Lead</th><th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Dönüşüm</th><th className="text-right py-3 pl-4 text-xs text-on-surface-variant font-medium">Sıra</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {[...members].sort((a, b) => b.goruntulemeSayisi - a.goruntulemeSayisi).map((m, i) => (
                <tr key={m.id} className="hover:bg-white/3 transition-all">
                  <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center border" style={{ background: `${m.kartRenk}15`, borderColor: `${m.kartRenk}30` }}><span className="material-symbols-outlined text-xs" style={{ color: m.kartRenk }}>person</span></div><div><p className="text-on-surface">{m.ad} {m.soyad}</p><p className="text-xs text-on-surface-variant">{m.unvan}</p></div></div></td>
                  <td className="py-3 px-4 text-right text-on-surface font-medium">{m.goruntulemeSayisi}</td>
                  <td className="py-3 px-4 text-right text-tertiary font-medium">{m.leadSayisi}</td>
                  <td className="py-3 px-4 text-right text-on-surface-variant">{m.goruntulemeSayisi ? ((m.leadSayisi / m.goruntulemeSayisi) * 100).toFixed(1) : "0"}%</td>
                  <td className="py-3 pl-4 text-right"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i === 0 ? "bg-yellow-400/20 text-yellow-400" : i === 1 ? "bg-slate-400/20 text-slate-400" : i === 2 ? "bg-orange-400/20 text-orange-400" : "text-on-surface-variant"}`}>#{i + 1}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
