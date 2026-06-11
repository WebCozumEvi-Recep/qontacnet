"use client";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

interface NotKaydi {
  tarih: string;
  not: string;
  durum: string;
}

interface Basvuru {
  id: string;
  ad: string;
  email: string;
  telefon: string;
  mesaj: string;
  okundu: boolean;
  durum: string;
  notlar: NotKaydi[];
  createdAt: string;
}

const DURUMLAR: { key: string; label: string; cls: string }[] = [
  { key: "yeni", label: "Yeni", cls: "bg-primary/20 text-primary" },
  { key: "iletisim", label: "İletişim kuruldu", cls: "bg-emerald-500/20 text-emerald-400" },
  { key: "ulasilamadi", label: "Ulaşılamadı", cls: "bg-amber-500/20 text-amber-400" },
  { key: "sonra", label: "Daha sonra arayın", cls: "bg-sky-500/20 text-sky-400" },
  { key: "ilgilenmiyor", label: "İlgilenmiyor", cls: "bg-red-500/20 text-red-400" },
];

function durumBilgi(key: string) {
  return DURUMLAR.find(d => d.key === key) ?? DURUMLAR[0];
}

function fmt(d: string) {
  return new Date(d).toLocaleString("tr-TR");
}

function waLink(tel: string) {
  const temiz = tel.replace(/\D/g, "");
  const numara = temiz.startsWith("90") ? temiz : temiz.startsWith("0") ? "9" + temiz : "90" + temiz;
  return `https://wa.me/${numara}`;
}

export default function BasvurularPage() {
  const [items, setItems] = useState<Basvuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<string>("hepsi");
  const [acik, setAcik] = useState<Basvuru | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/firma/basvurular");
    const j = await r.json();
    if (j.ok) {
      setItems(j.basvurular.map((b: Basvuru) => ({ ...b, notlar: Array.isArray(b.notlar) ? b.notlar : [] })));
    }
    setLoading(false);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const r = await fetch(`/api/firma/basvurular/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.ok) {
      const guncel: Basvuru = { ...j.basvuru, notlar: Array.isArray(j.basvuru.notlar) ? j.basvuru.notlar : [] };
      setItems(prev => prev.map(b => (b.id === id ? guncel : b)));
      setAcik(prev => (prev && prev.id === id ? guncel : prev));
    }
  }

  async function sil(id: string) {
    if (!confirm("Bu başvuruyu silmek istediğine emin misin?")) return;
    await fetch(`/api/firma/basvurular/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(b => b.id !== id));
  }

  const gosterilen = useMemo(
    () => (filtre === "hepsi" ? items : items.filter(b => b.durum === filtre)),
    [items, filtre],
  );

  function excelIndir() {
    const veri = gosterilen.map(b => ({
      "Ad Soyad": b.ad,
      "E-posta": b.email,
      "Telefon": b.telefon,
      "Mesaj": b.mesaj,
      "Durum": durumBilgi(b.durum).label,
      "Okundu": b.okundu ? "Evet" : "Hayır",
      "Tarih": fmt(b.createdAt),
      "Not Sayısı": b.notlar.length,
    }));
    const ws = XLSX.utils.json_to_sheet(veri);
    ws["!cols"] = [{ wch: 20 }, { wch: 26 }, { wch: 15 }, { wch: 40 }, { wch: 18 }, { wch: 8 }, { wch: 20 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Başvurular");
    XLSX.writeFile(wb, `basvurular-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Başvurular</h2>
          <p className="text-sm text-on-surface-variant mt-1">Üye kartlarındaki başvuru formundan gelen mesajlar.</p>
        </div>
        <button onClick={excelIndir} disabled={gosterilen.length === 0}
          className="px-3 py-2 text-sm rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">download</span>Excel'e Aktar
        </button>
      </div>

      {/* Durum filtreleri */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFiltre("hepsi")}
          className={`px-3 py-1 text-xs rounded-full ${filtre === "hepsi" ? "bg-primary/20 text-primary" : "glass-card text-on-surface-variant"}`}>
          Hepsi ({items.length})
        </button>
        {DURUMLAR.map(d => {
          const n = items.filter(b => b.durum === d.key).length;
          return (
            <button key={d.key} onClick={() => setFiltre(d.key)}
              className={`px-3 py-1 text-xs rounded-full ${filtre === d.key ? d.cls : "glass-card text-on-surface-variant"}`}>
              {d.label} ({n})
            </button>
          );
        })}
      </div>

      {gosterilen.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">inbox</span>
          <p className="text-sm text-on-surface-variant">Bu filtrede başvuru yok.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-on-surface-variant border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">İletişim</th>
                  <th className="px-4 py-3 font-medium">Mesaj</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {gosterilen.map(b => {
                  const d = durumBilgi(b.durum);
                  return (
                    <tr key={b.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${b.okundu ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface">{b.ad}</span>
                          {!b.okundu && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">YENİ</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant">
                          {b.email && <a href={`mailto:${b.email}`} className="hover:text-primary">{b.email}</a>}
                          {b.telefon && <a href={`tel:${b.telefon}`} className="hover:text-primary">{b.telefon}</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top max-w-[260px]">
                        <p className="text-xs text-on-surface-variant line-clamp-2">{b.mesaj || "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <select value={b.durum} onChange={e => void patch(b.id, { durum: e.target.value })}
                          className={`w-[150px] text-xs rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer ${d.cls}`}>
                          {DURUMLAR.map(o => <option key={o.key} value={o.key} className="bg-surface text-on-surface">{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-on-surface-variant whitespace-nowrap tabular-nums">{fmt(b.createdAt)}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          {b.telefon && (
                            <a href={waLink(b.telefon)} target="_blank" rel="noopener noreferrer" title="WhatsApp'tan yaz"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>
                            </a>
                          )}
                          <button onClick={() => setAcik(b)} title="Notlar"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sky-400 hover:bg-sky-500/10 relative">
                            <span className="material-symbols-outlined text-lg">sticky_note_2</span>
                            {b.notlar.length > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-sky-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{b.notlar.length}</span>
                            )}
                          </button>
                          <button onClick={() => void patch(b.id, { okundu: !b.okundu })} title={b.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/10">
                            <span className="material-symbols-outlined text-lg">{b.okundu ? "mark_email_unread" : "mark_email_read"}</span>
                          </button>
                          <button onClick={() => void sil(b.id)} title="Sil"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {acik && <NotlarPopup basvuru={acik} onClose={() => setAcik(null)} onPatch={patch} />}
    </div>
  );
}

function NotlarPopup({ basvuru, onClose, onPatch }: {
  basvuru: Basvuru;
  onClose: () => void;
  onPatch: (id: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [not, setNot] = useState("");
  const [durum, setDurum] = useState(basvuru.durum);
  const [kaydediyor, setKaydediyor] = useState(false);

  async function ekle() {
    if (!not.trim() && durum === basvuru.durum) return;
    setKaydediyor(true);
    await onPatch(basvuru.id, { not: not.trim() || undefined, durum });
    setNot("");
    setKaydediyor(false);
  }

  const kayitlar = [...basvuru.notlar].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="font-bold text-on-surface">{basvuru.ad}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Notlar & durum geçmişi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/10">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Not ekle */}
        <div className="p-4 border-b border-white/10 space-y-2">
          <textarea value={not} onChange={e => setNot(e.target.value)} rows={2} placeholder="Not yaz…"
            className="w-full text-sm rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-primary/50 resize-none text-on-surface" />
          <div className="flex items-center gap-2">
            <select value={durum} onChange={e => setDurum(e.target.value)}
              className="flex-1 text-xs rounded-lg bg-white/5 border border-white/10 px-2 py-2 outline-none text-on-surface">
              {DURUMLAR.map(o => <option key={o.key} value={o.key} className="bg-surface">{o.label}</option>)}
            </select>
            <button onClick={() => void ekle()} disabled={kaydediyor || (!not.trim() && durum === basvuru.durum)}
              className="px-4 py-2 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40">
              Ekle
            </button>
          </div>
        </div>

        {/* Geçmiş */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {kayitlar.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-6">Henüz not eklenmemiş.</p>
          ) : (
            kayitlar.map((k, i) => {
              const d = durumBilgi(k.durum);
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    {i < kayitlar.length - 1 && <span className="flex-1 w-px bg-white/10 my-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.cls}`}>{d.label}</span>
                      <span className="text-[11px] text-on-surface-variant">{fmt(k.tarih)}</span>
                    </div>
                    {k.not && <p className="text-sm text-on-surface mt-1 whitespace-pre-line">{k.not}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
