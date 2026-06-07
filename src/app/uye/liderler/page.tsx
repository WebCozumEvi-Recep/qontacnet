"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { mockLeads, Lead } from "@/lib/mock-data";

export default function LiderlerPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterKaynak, setFilterKaynak] = useState<string>("Tümü");

  const allLeads = mockLeads.filter(l => l.uyeId === user?.id || mockLeads.length > 0 ? true : false);
  // Show all leads as demo
  const leads = mockLeads.filter(l => {
    const matchSearch = !search ||
      l.ad.toLowerCase().includes(search.toLowerCase()) ||
      l.sirket.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchKaynak = filterKaynak === "Tümü" || l.kaynak === filterKaynak;
    return matchSearch && matchKaynak;
  });

  const kaynakColor = (k: Lead["kaynak"]) =>
    k === "NFC" ? "bg-primary/10 text-primary border-primary/20" :
    k === "QR" ? "bg-tertiary/10 text-tertiary border-tertiary/20" :
    "bg-secondary/20 text-secondary border-secondary/20";

  return (
    <div className="max-w-[900px] space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Lead", value: mockLeads.length, icon: "group_add", color: "#00d4ff" },
          { label: "NFC ile Gelen", value: mockLeads.filter(l => l.kaynak === "NFC").length, icon: "nfc", color: "#42faba" },
          { label: "QR ile Gelen", value: mockLeads.filter(l => l.kaynak === "QR").length, icon: "qr_code_2", color: "#6001d1" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span className="material-symbols-outlined text-xl" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ad, şirket veya e-posta ara..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {["Tümü", "NFC", "QR", "Link"].map(k => (
            <button
              key={k}
              onClick={() => setFilterKaynak(k)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filterKaynak === k ? "bg-primary-container text-on-primary-container" : "glass-card text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Lider Listesi ({leads.length})
          </h3>
          <button className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Excel İndir
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">person_search</span>
            Lider bulunamadı
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leads.map(lead => (
              <div key={lead.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-all">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{lead.ad}</p>
                  <p className="text-xs text-on-surface-variant">{lead.sirket}</p>
                </div>
                <div className="hidden md:block text-xs text-on-surface-variant min-w-[160px]">
                  {lead.email}
                </div>
                <div className="hidden md:block text-xs text-on-surface-variant min-w-[120px]">
                  {lead.telefon || "—"}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${kaynakColor(lead.kaynak)}`}>
                  {lead.kaynak}
                </span>
                <span className="text-xs text-on-surface-variant hidden lg:block whitespace-nowrap">
                  {lead.tarih}
                </span>
                <div className="flex gap-1">
                  {lead.telefon && (
                    <a href={`tel:${lead.telefon}`}
                      className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-primary transition-all">
                      <span className="material-symbols-outlined text-sm">phone</span>
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`}
                      className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-primary transition-all">
                      <span className="material-symbols-outlined text-sm">mail</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
