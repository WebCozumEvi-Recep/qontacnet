"use client";
import { mockMembers, monthlyLeads, weeklyViews } from "@/lib/mock-data";

const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function AnalitikPage() {
  const totalViews = mockMembers.reduce((a, m) => a + m.goruntulemeSayisi, 0);
  const totalLeads = mockMembers.reduce((a, m) => a + m.leadSayisi, 0);
  const maxMonthly = Math.max(...monthlyLeads);
  const maxWeekly = Math.max(...weeklyViews);

  const kaynak = [
    { label: "NFC Dokunma", value: Math.floor(totalViews * 0.55), pct: 55, color: "#00d4ff" },
    { label: "QR Tarama", value: Math.floor(totalViews * 0.30), pct: 30, color: "#42faba" },
    { label: "Direkt Link", value: Math.floor(totalViews * 0.15), pct: 15, color: "#6001d1" },
  ];

  const departmanData = [
    { dep: "Satış", views: 248, leads: 32 },
    { dep: "Pazarlama", views: 189, leads: 21 },
    { dep: "Ürün", views: 167, leads: 19 },
    { dep: "Teknoloji", views: 92, leads: 8 },
    { dep: "İK", views: 45, leads: 3 },
  ];

  return (
    <div className="max-w-[1100px] space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "visibility", label: "Toplam Görüntülenme", value: totalViews, sub: "+18% geçen ay", color: "#00d4ff" },
          { icon: "group_add", label: "Toplam Lead", value: totalLeads, sub: "+24% geçen ay", color: "#42faba" },
          { icon: "nfc", label: "NFC Dokunma", value: Math.floor(totalViews * 0.55), sub: "En popüler kaynak", color: "#6001d1" },
          { icon: "conversion_path", label: "Dönüşüm Oranı", value: `${((totalLeads / totalViews) * 100).toFixed(1)}%`, sub: "Lead / Görüntülenme", color: "#a8e8ff" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            <p className="text-xs text-tertiary mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Aylık Lead Trendi</h3>
          <p className="text-xs text-on-surface-variant mb-5">Son 12 ay</p>
          <div className="flex items-end gap-1.5 h-40">
            {monthlyLeads.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="w-full rounded-t-md transition-all relative group"
                  style={{ height: `${(v / maxMonthly) * 100}%`, background: i === 11 ? "#00d4ff" : "rgba(0,212,255,0.35)" }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container px-1.5 py-0.5 rounded text-xs text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-10">
                    {v}
                  </div>
                </div>
                <span className="text-on-surface-variant" style={{ fontSize: "10px" }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Haftalık Görüntülenme</h3>
          <p className="text-xs text-on-surface-variant mb-5">Bu hafta</p>
          <div className="flex items-end gap-2 h-40">
            {weeklyViews.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div className="w-full rounded-t-lg relative group"
                  style={{ height: `${(v / maxWeekly) * 100}%`, background: i === 6 ? "#42faba" : "rgba(66,250,186,0.2)" }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container px-1.5 py-0.5 rounded text-xs text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-10">
                    {v}
                  </div>
                </div>
                <span className="text-on-surface-variant text-xs">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Source + Department */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Source */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-5" style={{ fontFamily: "Sora, sans-serif" }}>Kaynak Dağılımı</h3>
          <div className="space-y-4">
            {kaynak.map(k => (
              <div key={k.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-on-surface-variant">{k.label}</span>
                  <span className="text-on-surface font-medium">{k.value} <span className="text-on-surface-variant text-xs">({k.pct}%)</span></span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${k.pct}%`, background: k.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Department */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Departmana Göre</h3>
          <div className="space-y-3">
            {departmanData.map((d, i) => (
              <div key={d.dep} className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-4">{i + 1}</span>
                <span className="text-sm text-on-surface flex-1">{d.dep}</span>
                <span className="text-xs text-on-surface-variant w-20 text-right">{d.views} görüntüleme</span>
                <span className="text-xs text-tertiary w-16 text-right">{d.leads} lead</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
          Üye Performans Tablosu
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 pr-4 text-xs text-on-surface-variant font-medium">Üye</th>
                <th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Görüntülenme</th>
                <th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Lead</th>
                <th className="text-right py-3 px-4 text-xs text-on-surface-variant font-medium">Dönüşüm</th>
                <th className="text-right py-3 pl-4 text-xs text-on-surface-variant font-medium">Sıra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...mockMembers].sort((a, b) => b.goruntulemeSayisi - a.goruntulemeSayisi).map((m, i) => (
                <tr key={m.id} className="hover:bg-white/3 transition-all">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center border" style={{ background: `${m.kartRenk}15`, borderColor: `${m.kartRenk}30` }}>
                        <span className="material-symbols-outlined text-xs" style={{ color: m.kartRenk }}>person</span>
                      </div>
                      <div>
                        <p className="text-on-surface">{m.ad} {m.soyad}</p>
                        <p className="text-xs text-on-surface-variant">{m.unvan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-on-surface font-medium">{m.goruntulemeSayisi}</td>
                  <td className="py-3 px-4 text-right text-tertiary font-medium">{m.leadSayisi}</td>
                  <td className="py-3 px-4 text-right text-on-surface-variant">
                    {((m.leadSayisi / m.goruntulemeSayisi) * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                      i === 1 ? "bg-slate-400/20 text-slate-400" :
                      i === 2 ? "bg-orange-400/20 text-orange-400" : "text-on-surface-variant"
                    }`}>
                      #{i + 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
