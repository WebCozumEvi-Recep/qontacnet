"use client";
import { useEffect, useState } from "react";
import { kaynakLabel } from "@/lib/labels";
import * as XLSX from "xlsx";

interface Lead { id: string; ad: string; sirket: string; email: string; telefon: string; kaynak: string; createdAt: string }

const trDateTime = (d: string) =>
  new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function BaglantilarPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKaynak, setFilterKaynak] = useState("Tümü");

  useEffect(() => {
    fetch("/api/me/leads").then(r => r.json()).then(j => { if (j.ok) setAllLeads(j.leads); }).finally(() => setLoading(false));
  }, []);

  const leads = allLeads.filter(l => {
    const ms = !search || l.ad.toLowerCase().includes(search.toLowerCase()) || l.sirket.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const mk = filterKaynak === "Tümü" || l.kaynak === filterKaynak;
    return ms && mk;
  });

  const kaynakStyle = (k: string) =>
    k === "NFC" ? "bg-primary/10 text-primary border-primary/20" :
    k === "QR"  ? "bg-tertiary/10 text-tertiary border-tertiary/20" :
                  "bg-secondary/20 text-secondary border-secondary/20";

  const exportXLSX = () => {
    const rows = allLeads.map(l => ({
      "Ad Soyad": l.ad,
      "Şirket": l.sirket,
      "E-posta": l.email,
      "Telefon": l.telefon || "",
      "Kaynak": kaynakLabel[l.kaynak] ?? l.kaynak,
      "Tarih": trDateTime(l.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bağlantılar");
    XLSX.writeFile(wb, "baglantilar.xlsx");
  };

  return (
    <div className="max-w-[900px] space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Bağlantı", value: allLeads.length, icon: "group_add", color: "#00d4ff" },
          { label: "NFC ile Gelen", value: allLeads.filter(l => l.kaynak === "NFC").length, icon: "nfc", color: "#42faba" },
          { label: "QR ile Gelen", value: allLeads.filter(l => l.kaynak === "QR").length, icon: "qr_code_2", color: "#6001d1" },
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

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, şirket veya e-posta ara..." className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all" />
        </div>
        <div className="flex gap-2">
          {["Tümü", "NFC", "QR", "LINK"].map(k => (
            <button key={k} onClick={() => setFilterKaynak(k)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterKaynak === k ? "bg-primary-container text-on-primary-container" : "glass-card text-on-surface-variant hover:text-on-surface"}`}>{k === "LINK" ? "Link" : k}</button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Bağlantı Listesi ({leads.length})</h3>
          <button onClick={exportXLSX} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">download</span>Excel İndir
          </button>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-[72px_1fr_1.5fr_1.1fr_1fr_72px] gap-x-3 px-5 py-3 border-b border-white/5 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
          <span>Kaynak</span>
          <span>Ad Soyad</span>
          <span>E-posta</span>
          <span>Telefon</span>
          <span>Tarih & Saat</span>
          <span className="text-right">İletişim</span>
        </div>

        {loading ? <div className="py-16 text-center text-on-surface-variant text-sm">Yükleniyor...</div> : leads.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-4xl block mb-3 opacity-30">person_search</span>
            Henüz bağlantı yok
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leads.map(lead => (
              <div key={lead.id} className="grid md:grid-cols-[72px_1fr_1.5fr_1.1fr_1fr_72px] gap-x-3 px-5 py-3.5 hover:bg-white/3 transition-all items-center">

                {/* Kaynak badge — sol */}
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${kaynakStyle(lead.kaynak)}`}>
                    {kaynakLabel[lead.kaynak]}
                  </span>
                </div>

                {/* Ad + Şirket */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{lead.ad}</p>
                  <p className="text-xs text-on-surface-variant truncate">{lead.sirket}</p>
                </div>

                {/* E-posta */}
                <div className="hidden md:block text-xs text-on-surface-variant truncate">{lead.email || "—"}</div>

                {/* Telefon */}
                <div className="hidden md:block text-xs text-on-surface-variant">{lead.telefon || "—"}</div>

                {/* Tarih & Saat */}
                <div className="hidden md:block text-xs text-on-surface-variant whitespace-nowrap">
                  {trDateTime(lead.createdAt)}
                </div>

                {/* İletişim: WhatsApp + Mail */}
                <div className="flex gap-1 justify-end">
                  {lead.telefon && (
                    <a
                      href={`https://wa.me/${lead.telefon.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp ile yaz"
                      className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-[#25d366] transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      title="E-posta gönder"
                      className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-primary transition-all"
                    >
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
