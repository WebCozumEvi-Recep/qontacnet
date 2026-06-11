"use client";
import { useEffect, useState } from "react";

interface Basvuru {
  id: string;
  ad: string;
  email: string;
  telefon: string;
  mesaj: string;
  okundu: boolean;
  createdAt: string;
}

export default function BasvurularPage() {
  const [items, setItems] = useState<Basvuru[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/firma/basvurular");
    const j = await r.json();
    if (j.ok) setItems(j.basvurular);
    setLoading(false);
  }

  async function isaretle(id: string, okundu: boolean) {
    setItems(prev => prev.map(b => b.id === id ? { ...b, okundu } : b));
    await fetch(`/api/firma/basvurular/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ okundu }),
    });
  }

  async function sil(id: string) {
    if (!confirm("Bu başvuruyu silmek istediğine emin misin?")) return;
    await fetch(`/api/firma/basvurular/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(b => b.id !== id));
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
      <div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Başvurular</h2>
        <p className="text-sm text-on-surface-variant mt-1">Üye kartlarındaki başvuru formundan gelen mesajlar.</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">inbox</span>
          <p className="text-sm text-on-surface-variant">Henüz başvuru gelmemiş.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(b => (
            <div key={b.id} className={`glass-card rounded-2xl p-4 ${b.okundu ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-on-surface">{b.ad}</p>
                    {!b.okundu && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">YENİ</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{new Date(b.createdAt).toLocaleString("tr-TR")}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant flex-wrap">
                    {b.email && <a href={`mailto:${b.email}`} className="hover:text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">mail</span>{b.email}</a>}
                    {b.telefon && <a href={`tel:${b.telefon}`} className="hover:text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">call</span>{b.telefon}</a>}
                  </div>
                  {b.mesaj && <p className="text-sm text-on-surface-variant mt-3 whitespace-pre-line border-t border-white/5 pt-3">{b.mesaj}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => isaretle(b.id, !b.okundu)}
                    className="px-3 py-1.5 text-xs rounded-lg glass-card text-on-surface-variant hover:text-on-surface">
                    {b.okundu ? "Okunmadı işaretle" : "Okundu işaretle"}
                  </button>
                  <button onClick={() => sil(b.id)} className="px-3 py-1.5 text-xs rounded-lg text-red-400 hover:bg-red-500/10">
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
