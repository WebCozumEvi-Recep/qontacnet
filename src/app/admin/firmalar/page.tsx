"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { mockAdminFirmalar, FirmaDurum } from "@/lib/mock-data";

const durumMap: Record<FirmaDurum, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "#42faba" },
  deneme: { label: "Deneme", color: "#a8e8ff" },
  askida: { label: "Askıda", color: "#ffb74d" },
  iptal: { label: "İptal", color: "#ff6b6b" },
};

export default function AdminFirmalarPage() {
  const [q, setQ] = useState("");
  const [durum, setDurum] = useState<FirmaDurum | "tum">("tum");
  const [paket, setPaket] = useState<string>("tum");

  const filtered = useMemo(() => {
    return mockAdminFirmalar.filter(f => {
      if (durum !== "tum" && f.durum !== durum) return false;
      if (paket !== "tum" && f.paket !== paket) return false;
      if (q && !f.ad.toLowerCase().includes(q.toLowerCase()) && !f.email.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, durum, paket]);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Firma adı veya e-posta ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:ring-0 outline-none transition-all"
          />
        </div>
        <select value={durum} onChange={e => setDurum(e.target.value as FirmaDurum | "tum")}
          className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-0 outline-none">
          <option value="tum">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="deneme">Deneme</option>
          <option value="askida">Askıda</option>
          <option value="iptal">İptal</option>
        </select>
        <select value={paket} onChange={e => setPaket(e.target.value)}
          className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:ring-0 outline-none">
          <option value="tum">Tüm Paketler</option>
          <option value="Başlangıç">Başlangıç</option>
          <option value="Profesyonel">Profesyonel</option>
          <option value="Kurumsal">Kurumsal</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
          <span className="material-symbols-outlined text-base">add</span>
          Yeni Firma
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/5">
              <tr className="text-left text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium text-center">Üye</th>
                <th className="px-4 py-3 font-medium text-center">Aktif Kart</th>
                <th className="px-4 py-3 font-medium text-right">MRR</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/3 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">corporate_fare</span>
                      </div>
                      <div>
                        <p className="text-on-surface font-medium">{f.ad}</p>
                        <p className="text-xs text-on-surface-variant">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-primary">{f.paket}</span></td>
                  <td className="px-4 py-3 text-center text-on-surface">{f.uyeSayisi}</td>
                  <td className="px-4 py-3 text-center text-on-surface">{f.aktifKart}</td>
                  <td className="px-4 py-3 text-right font-medium text-on-surface">₺{f.mrr.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${durumMap[f.durum].color}15`, color: durumMap[f.durum].color, border: `1px solid ${durumMap[f.durum].color}30` }}>
                      {durumMap[f.durum].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/firmalar/${f.id}`} className="text-primary text-xs hover:underline">Detay →</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">Sonuç bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant text-right">{filtered.length} firma listeleniyor.</p>
    </div>
  );
}
