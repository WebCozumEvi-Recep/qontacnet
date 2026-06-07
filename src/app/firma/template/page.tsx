"use client";
import { useEffect, useState } from "react";

const PRESET_COLORS = [
  { name: "Cyber Blue", color: "#00d4ff" }, { name: "Neon Purple", color: "#6001d1" },
  { name: "Mint Green", color: "#42faba" }, { name: "Sunset Red", color: "#ff6b6b" },
  { name: "Gold", color: "#ffd93d" }, { name: "Lavender", color: "#a29bfe" },
];

interface Template { id: string; ad: string; renk: string; aktif: boolean }

function CardMockup({ color, firmaAdi, label }: { color: string; firmaAdi: string; label: string }) {
  return (
    <div className="w-full aspect-[1.586/1] rounded-xl glass-card border-white/10 p-4 flex flex-col justify-between relative overflow-hidden" style={{ borderColor: `${color}30` }}>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20" style={{ background: color, filter: "blur(20px)" }} />
      <div className="absolute inset-0 shimmer opacity-10" />
      <div className="flex justify-between items-start relative z-10"><span className="font-bold text-sm tracking-widest" style={{ fontFamily: "Sora, sans-serif", color }}>QONTAC</span><span className="material-symbols-outlined text-xl" style={{ color }}>nfc</span></div>
      <div className="relative z-10"><p className="text-white font-semibold text-sm">{label}</p><p className="text-white/50 text-xs">{firmaAdi}</p></div>
    </div>
  );
}

export default function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#00d4ff");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isEditing = editingId !== null;
  const modalOpen = showCreate || isEditing;

  const load = () => fetch("/api/firma/templates").then(r => r.json()).then(j => { if (j.ok) setTemplates(j.templates); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openEdit = (id: string) => {
    const t = templates.find(t => t.id === id); if (!t) return;
    setEditingId(id); setNewName(t.ad); setNewColor(t.renk); setShowCreate(false);
  };
  const closeModal = () => { setShowCreate(false); setEditingId(null); setNewName(""); setNewColor("#00d4ff"); };

  const saveTemplate = async () => {
    if (!newName) return;
    setBusy(true);
    try {
      if (isEditing) {
        const res = await fetch("/api/firma/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ad: newName, renk: newColor }) });
        const j = await res.json(); if (j.ok) setSaved(editingId);
      } else {
        const res = await fetch("/api/firma/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: newName, renk: newColor }) });
        const j = await res.json(); if (j.ok) setSaved(j.template.id);
      }
      await load();
      closeModal();
      setTimeout(() => setSaved(null), 2000);
    } finally { setBusy(false); }
  };

  const toggleTemplate = async (id: string, aktif: boolean) => {
    await fetch("/api/firma/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, aktif: !aktif }) });
    load();
  };

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{templates.length} şablon · {templates.filter(t => t.aktif).length} aktif</p>
        <button onClick={() => { setEditingId(null); setNewName(""); setNewColor("#00d4ff"); setShowCreate(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all"><span className="material-symbols-outlined text-base">add</span>Yeni Şablon</button>
      </div>

      {loading ? <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Yükleniyor...</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`glass-card rounded-2xl p-5 space-y-4 transition-all ${!t.aktif ? "opacity-50" : ""} ${saved === t.id ? "border-primary/40" : ""}`}>
              <CardMockup color={t.renk} firmaAdi="Firma" label="Ad Soyad — Unvan" />
              <div>
                <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm text-on-surface">{t.ad}</span><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.renk }} /><span className="text-xs text-on-surface-variant">{t.renk}</span></div></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleTemplate(t.id, t.aktif)} className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${t.aktif ? "bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20" : "bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20"}`}>{t.aktif ? "Pasife Al" : "Aktif Et"}</button>
                <button onClick={() => openEdit(t.id)} className="flex-1 py-2 glass-card rounded-xl text-xs text-on-surface-variant hover:text-primary transition-all">Düzenle</button>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant md:col-span-2 lg:col-span-3">Henüz şablon yok. &quot;Yeni Şablon&quot; ile başlayın.</div>}
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Hazır Renk Paletleri</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRESET_COLORS.map(p => (
            <button key={p.name} type="button" onClick={() => { setEditingId(null); setNewName(p.name); setNewColor(p.color); setShowCreate(true); }} className="flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-all cursor-pointer text-left">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: p.color }} /><div><p className="text-sm text-on-surface">{p.name}</p><p className="text-xs text-on-surface-variant">{p.color}</p></div>
            </button>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{isEditing ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}</h3><button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button></div>
            <div className="space-y-4">
              <div><label className="text-xs text-on-surface-variant mb-1.5 block">Şablon Adı</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none" placeholder="Örn: Gece Mavisi" /></div>
              <div><label className="text-xs text-on-surface-variant mb-2 block">Renk Seç</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(p => (<button key={p.color} onClick={() => setNewColor(p.color)} className="w-8 h-8 rounded-full transition-all hover:scale-110" style={{ background: p.color, boxShadow: newColor === p.color ? `0 0 0 3px #0f1321, 0 0 0 5px ${p.color}` : "none" }} />))}
                  <label className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-on-surface-variant text-sm">palette</span><input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="sr-only" /></label>
                </div>
              </div>
              <CardMockup color={newColor} firmaAdi="Firma" label={newName || "Önizleme"} />
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 glass-card rounded-xl text-on-surface-variant text-sm">İptal</button>
                <button onClick={saveTemplate} disabled={!newName || busy} className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{busy ? "..." : isEditing ? "Kaydet" : "Oluştur"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
