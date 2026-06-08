"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const PRESET_COLORS = [
  { name: "Cyber Blue", color: "#00d4ff" },
  { name: "Neon Purple", color: "#6001d1" },
  { name: "Mint Green", color: "#42faba" },
  { name: "Sunset Red", color: "#ff6b6b" },
  { name: "Gold", color: "#ffd93d" },
  { name: "Lavender", color: "#a29bfe" },
  { name: "Orange", color: "#ff9f43" },
  { name: "Pink", color: "#fd79a8" },
];

interface Template { id: string; ad: string; renk: string; aktif: boolean }

function PhonePreview({ color, firmaAdi, isim, unvan }: { color: string; firmaAdi: string; isim: string; unvan: string }) {
  return (
    <div className="relative mx-auto" style={{ width: 220 }}>
      {/* Telefon çerçevesi */}
      <div className="rounded-[2.5rem] border-4 border-white/20 overflow-hidden shadow-2xl" style={{ background: "#050816" }}>
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-5 rounded-full bg-black/60" />
        </div>
        {/* Ekran içeriği */}
        <div className="px-3 pb-4 space-y-2.5" style={{ minHeight: 380 }}>
          {/* Gradient header */}
          <div className="h-16 rounded-xl relative overflow-hidden mb-1" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}30 0%, transparent 80%)`, border: `1px solid ${color}20` }}>
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5 pt-2">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: `${color}60`, background: `${color}20` }}>
                <span className="material-symbols-outlined text-lg" style={{ color }}>person</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-xs font-bold leading-tight">{isim}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color, fontSize: 10 }}>{unvan}</p>
            <p className="text-white/40 mt-0.5" style={{ fontSize: 9 }}>{firmaAdi}</p>
          </div>
          {/* Butonlar */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="py-2 rounded-xl text-center text-xs font-bold" style={{ background: color, color: "#000", fontSize: 9 }}>Kaydet</div>
            <div className="py-2 rounded-xl text-center text-xs glass-card text-white/70" style={{ fontSize: 9 }}>Tanış</div>
          </div>
          {/* İletişim satırları */}
          {["call", "mail", "link"].map((icon, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-xl glass-card">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                <span className="material-symbols-outlined" style={{ color, fontSize: 12 }}>{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 rounded w-12 opacity-30 bg-white/50" />
              </div>
            </div>
          ))}
          {/* Footer */}
          <div className="text-center pt-1">
            <p className="font-bold tracking-widest text-white/20" style={{ fontFamily: "Sora, sans-serif", fontSize: 8 }}>QONTAC</p>
          </div>
        </div>
      </div>
      {/* Glow */}
      <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none" style={{ boxShadow: `0 0 60px ${color}25` }} />
    </div>
  );
}

function TemplateCard({ t, onActivate, onEdit, onDelete, busy }: {
  t: Template; onActivate: () => void; onEdit: () => void; onDelete: () => void; busy: boolean;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 flex flex-col gap-4 transition-all ${t.aktif ? "border border-primary/40 shadow-lg shadow-primary/10" : ""}`}>
      {t.aktif && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 w-fit">
          <span className="material-symbols-outlined text-sm">check_circle</span>Aktif Tema
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/10" style={{ background: t.renk }} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-on-surface truncate">{t.ad}</p>
          <p className="text-xs text-on-surface-variant">{t.renk}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {!t.aktif && (
          <button onClick={onActivate} disabled={busy}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary-container text-on-primary-container hover:scale-[1.02] transition-all disabled:opacity-50">
            Temayı Uygula
          </button>
        )}
        <button onClick={onEdit}
          className={`${t.aktif ? "flex-1" : ""} py-2 px-3 glass-card rounded-xl text-xs text-on-surface-variant hover:text-primary transition-all`}>
          Düzenle
        </button>
        <button onClick={onDelete}
          className="py-2 px-3 glass-card rounded-xl text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function TemplatePage() {
  const { user } = useAuth();
  const firma = user?.data as { ad?: string } | undefined;
  const firmaAdi = firma?.ad ?? "Firma Adı";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modal state
  const [modal, setModal] = useState<null | "new" | string>(null); // null | "new" | templateId
  const [formAd, setFormAd] = useState("");
  const [formRenk, setFormRenk] = useState("#00d4ff");

  // Preview rengi (hangi renk önizlemede gösteriliyor)
  const [previewRenk, setPreviewRenk] = useState("#00d4ff");

  const load = async () => {
    const j = await fetch("/api/firma/templates").then(r => r.json());
    if (j.ok) {
      setTemplates(j.templates);
      const aktif = j.templates.find((t: Template) => t.aktif);
      if (aktif) setPreviewRenk(aktif.renk);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setFormAd(""); setFormRenk("#00d4ff"); setModal("new"); };
  const openEdit = (t: Template) => { setFormAd(t.ad); setFormRenk(t.renk); setModal(t.id); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!formAd.trim()) return;
    setBusy(true);
    try {
      if (modal === "new") {
        await fetch("/api/firma/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: formAd, renk: formRenk }) });
      } else {
        await fetch("/api/firma/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: modal, ad: formAd, renk: formRenk }) });
      }
      await load();
      closeModal();
    } finally { setBusy(false); }
  };

  const handleActivate = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/firma/templates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, aktif: true }) });
      await load();
    } finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şablon silinecek. Emin misiniz?")) return;
    setBusy(true);
    try {
      await fetch("/api/firma/templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
    } finally { setBusy(false); }
  };

  const aktifTemplate = templates.find(t => t.aktif);

  return (
    <div className="max-w-[1100px]">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sol: Tema listesi */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart Temaları</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Aktif tema tüm üyelerin kartına yansır</p>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
              <span className="material-symbols-outlined text-base">add</span>Yeni Tema
            </button>
          </div>

          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">Yükleniyor...</div>
          ) : templates.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 block">palette</span>
              <p className="text-sm text-on-surface-variant">Henüz tema yok.</p>
              <button onClick={openNew} className="text-xs text-primary hover:underline">Hemen oluştur →</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {templates.map(t => (
                <TemplateCard key={t.id} t={t} busy={busy}
                  onActivate={() => { handleActivate(t.id); setPreviewRenk(t.renk); }}
                  onEdit={() => openEdit(t)}
                  onDelete={() => handleDelete(t.id)} />
              ))}
            </div>
          )}

          {/* Hazır paletler */}
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Hazır Renk Paletleri</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map(p => (
                <button key={p.color} onClick={() => { setFormAd(p.name); setFormRenk(p.color); setModal("new"); }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all group">
                  <div className="w-8 h-8 rounded-full group-hover:scale-110 transition-all" style={{ background: p.color }} />
                  <p className="text-xs text-on-surface-variant" style={{ fontSize: 10 }}>{p.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: Canlı önizleme */}
        <div className="lg:w-72 flex flex-col items-center gap-5">
          <div className="glass-card rounded-2xl p-5 w-full text-center space-y-4 sticky top-6">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Canlı Önizleme</p>
              {aktifTemplate ? (
                <p className="text-xs text-primary">Aktif: {aktifTemplate.ad}</p>
              ) : (
                <p className="text-xs text-on-surface-variant/50">Tema seçilmedi</p>
              )}
            </div>
            <PhonePreview
              color={previewRenk}
              firmaAdi={firmaAdi}
              isim="Ad Soyad"
              unvan="Unvan · Departman"
            />
            <p className="text-xs text-on-surface-variant/50 leading-relaxed">
              Bu görünüm tüm üyelerinizin kart sayfasına yansır
            </p>
            {aktifTemplate && (
              <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <div className="w-3 h-3 rounded-full" style={{ background: aktifTemplate.renk }} />
                <span>{aktifTemplate.renk}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Yeni / Düzenle */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                {modal === "new" ? "Yeni Tema Oluştur" : "Temayı Düzenle"}
              </h3>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant mb-1.5 block">Tema Adı</label>
                <input value={formAd} onChange={e => setFormAd(e.target.value)}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none"
                  placeholder="Örn: Kurumsal Mavi" autoFocus />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant mb-2 block">Renk</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {PRESET_COLORS.map(p => (
                    <button key={p.color} onClick={() => setFormRenk(p.color)}
                      className="w-8 h-8 rounded-full transition-all hover:scale-110 flex-shrink-0"
                      style={{ background: p.color, boxShadow: formRenk === p.color ? `0 0 0 3px #0f1321, 0 0 0 5px ${p.color}` : "none" }} />
                  ))}
                  <label className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-all" title="Özel renk">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">colorize</span>
                    <input type="color" value={formRenk} onChange={e => setFormRenk(e.target.value)} className="sr-only" />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border border-white/10" style={{ background: formRenk }} />
                  <span className="text-xs text-on-surface-variant font-mono">{formRenk}</span>
                </div>
              </div>

              {/* Mini önizleme */}
              <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: "#050816" }}>
                <div className="p-3 flex items-center gap-3" style={{ background: `radial-gradient(ellipse at 50% 0%, ${formRenk}20 0%, transparent 80%)` }}>
                  <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: `${formRenk}60`, background: `${formRenk}20` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: formRenk }}>person</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Ad Soyad</p>
                    <p className="text-xs font-medium" style={{ color: formRenk }}>Unvan</p>
                  </div>
                </div>
                <div className="px-3 py-2 grid grid-cols-2 gap-2">
                  <div className="py-1.5 rounded-lg text-center text-xs font-bold" style={{ background: formRenk, color: "#000" }}>Kaydet</div>
                  <div className="py-1.5 rounded-lg text-center text-xs text-white/50 border border-white/10">Tanış</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 glass-card rounded-xl text-on-surface-variant text-sm">İptal</button>
              <button onClick={handleSave} disabled={!formAd.trim() || busy}
                className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold disabled:opacity-50">
                {busy ? "Kaydediliyor..." : modal === "new" ? "Oluştur & Uygula" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
