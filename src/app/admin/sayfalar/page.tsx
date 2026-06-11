"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/RichEditor"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-surface-dim border border-white/10 animate-pulse" />,
});

interface Sayfa {
  id: string;
  slug: string;
  baslik: string;
  icerik: string;
  aktif: boolean;
  sira: number;
}

export default function AdminSayfalarPage() {
  const [sayfalar, setSayfalar] = useState<Sayfa[]>([]);
  const [loading, setLoading] = useState(true);
  const [duzenlenen, setDuzenlenen] = useState<Sayfa | null>(null);
  const [yeniBaslik, setYeniBaslik] = useState("");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const j = await (await fetch("/api/admin/sayfalar")).json();
    if (j.ok) setSayfalar(j.sayfalar);
    setLoading(false);
  }

  async function olustur() {
    if (!yeniBaslik.trim()) return;
    const j = await (await fetch("/api/admin/sayfalar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baslik: yeniBaslik.trim() }),
    })).json();
    if (j.ok) {
      setYeniBaslik("");
      setSayfalar(p => [...p, j.sayfa]);
      setDuzenlenen(j.sayfa);
    }
  }

  async function sil(id: string) {
    if (!confirm("Bu sayfayı silmek istediğine emin misin?")) return;
    await fetch(`/api/admin/sayfalar/${id}`, { method: "DELETE" });
    setSayfalar(p => p.filter(s => s.id !== id));
    if (duzenlenen?.id === id) setDuzenlenen(null);
  }

  if (duzenlenen) {
    return <SayfaDuzenle sayfa={duzenlenen} onClose={() => setDuzenlenen(null)} onSaved={(s) => {
      setSayfalar(p => p.map(x => x.id === s.id ? s : x));
      setDuzenlenen(null);
    }} />;
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>Özel Sayfalar</h3>
        <p className="text-xs text-on-surface-variant mb-5">Hakkımızda, KVKK, Gizlilik gibi kurumsal sayfaları zengin metin editörüyle yönetin. Footer'da otomatik listelenir.</p>

        <div className="flex gap-2 mb-5">
          <input value={yeniBaslik} onChange={e => setYeniBaslik(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void olustur(); }}
            placeholder="Yeni sayfa başlığı (örn. Çerez Politikası)"
            className="flex-1 bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
          <button onClick={() => void olustur()} disabled={!yeniBaslik.trim()}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
            Sayfa Ekle
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8"><span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span></div>
        ) : sayfalar.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">Henüz sayfa eklenmemiş.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {sayfalar.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-medium truncate">{s.baslik}</p>
                  <p className="text-xs text-on-surface-variant">/sayfa/{s.slug}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.aktif ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-on-surface-variant"}`}>
                  {s.aktif ? "Yayında" : "Gizli"}
                </span>
                <a href={`/sayfa/${s.slug}`} target="_blank" rel="noopener noreferrer" title="Önizle"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-white/10">
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
                <button onClick={() => setDuzenlenen(s)} title="Düzenle"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button onClick={() => void sil(s.id)} title="Sil"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SayfaDuzenle({ sayfa, onClose, onSaved }: { sayfa: Sayfa; onClose: () => void; onSaved: (s: Sayfa) => void }) {
  const [baslik, setBaslik] = useState(sayfa.baslik);
  const [icerik, setIcerik] = useState(sayfa.icerik);
  const [aktif, setAktif] = useState(sayfa.aktif);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function kaydet() {
    setSaving(true); setMsg(null);
    const j = await (await fetch(`/api/admin/sayfalar/${sayfa.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baslik, icerik, aktif }),
    })).json();
    setSaving(false);
    if (j.ok) { setMsg({ ok: true, text: "Kaydedildi." }); onSaved(j.sayfa); }
    else setMsg({ ok: false, text: j.error || "Kaydedilemedi." });
  }

  return (
    <div className="space-y-4 max-w-[1000px]">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg glass-card hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Sayfa Düzenle</h3>
          <p className="text-xs text-on-surface-variant">/sayfa/{sayfa.slug}</p>
        </div>
        <button onClick={() => setAktif(a => !a)}
          className={`text-xs px-3 py-1.5 rounded-lg ${aktif ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-on-surface-variant"}`}>
          {aktif ? "Yayında" : "Gizli"}
        </button>
        <button onClick={() => void kaydet()} disabled={saving}
          className="px-5 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-60">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Sayfa Başlığı</label>
          <input value={baslik} onChange={e => setBaslik(e.target.value)}
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">İçerik</label>
          <RichEditor value={icerik} onChange={setIcerik} />
        </div>
        {msg && (
          <p className={`text-xs flex items-center gap-1 ${msg.ok ? "text-green-400" : "text-red-400"}`}>
            <span className="material-symbols-outlined text-sm">{msg.ok ? "check_circle" : "error"}</span>{msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
