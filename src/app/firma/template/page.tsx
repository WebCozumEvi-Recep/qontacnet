"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { temaLimiti, paketLabel } from "@/lib/labels";
import ModulYonetimi from "@/components/firma/ModulYonetimi";
import { TemplateGalleryCard } from "@/components/templates/TemplateGalleryCard";
import { MiniCardPreview } from "@/components/templates/MiniCardPreview";
import {
  DB_MODULE_TO_CHIP,
  MOCK_DESCRIPTIONS,
  type CardTemplateItem,
  type TemplateModuleChip,
} from "@/lib/template-design";

const PRESET_COLORS = [
  { name: "Gold", color: "#d4af37" },
  { name: "Purple", color: "#6001d1" },
  { name: "Mint", color: "#42faba" },
  { name: "Coral", color: "#ff6b6b" },
  { name: "Sun", color: "#ffd93d" },
  { name: "Lavender", color: "#a29bfe" },
  { name: "Orange", color: "#ff9f43" },
  { name: "Pink", color: "#fd79a8" },
];

interface ApiTemplate {
  id: string;
  ad: string;
  renk: string;
  aktif: boolean;
}

const MOCK_MEMBER_USAGE: Record<string, number> = {
  // design placeholder until API returns usage counts
};

async function fetchModules(templateId: string): Promise<TemplateModuleChip[]> {
  const r = await fetch(`/api/firma/moduller?templateId=${templateId}`);
  const j = await r.json();
  if (!j.ok) return [];
  return (j.moduller as { id: string; tip: string; baslik: string }[]).map(m => ({
    id: m.id,
    type: DB_MODULE_TO_CHIP[m.tip] ?? "ABOUT",
    title: m.baslik,
  }));
}

export default function TemplatePage() {
  const { user } = useAuth();
  const firma = user?.data as { ad?: string; paket?: string } | undefined;
  const paket = firma?.paket ?? "BASLANGIC";
  const limit = temaLimiti[paket] ?? 1;

  const [items, setItems] = useState<CardTemplateItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState<null | "new" | string>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#d4af37");
  const [formDescription, setFormDescription] = useState("");
  const [limitWarning, setLimitWarning] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const load = async () => {
    const j = await fetch("/api/firma/templates").then(r => r.json());
    if (!j.ok) { setLoading(false); return; }

    const enriched = await Promise.all(
      (j.templates as ApiTemplate[]).map(async (t, idx) => ({
        id: t.id,
        name: t.ad,
        color: t.renk,
        description: MOCK_DESCRIPTIONS[t.id] ?? MOCK_DESCRIPTIONS.default,
        modules: await fetchModules(t.id),
        memberCount: MOCK_MEMBER_USAGE[t.id] ?? [12, 8, 3, 0][idx] ?? 0,
        isDefault: t.aktif,
      })),
    );

    setItems(enriched);
    setSelectedId(prev =>
      prev && enriched.some(x => x.id === prev) ? prev : (enriched[0]?.id ?? ""),
    );
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const selected = items.find(t => t.id === selectedId);

  const openNew = () => {
    if (items.length >= limit) {
      setLimitWarning(
        `${paketLabel[paket]} paketi en fazla ${limit} şablon oluşturmanıza izin verir.`,
      );
      return;
    }
    setFormName("");
    setFormColor("#d4af37");
    setFormDescription("");
    setModal("new");
  };

  const openEdit = (t: CardTemplateItem) => {
    setFormName(t.name);
    setFormColor(t.color);
    setFormDescription(t.description);
    setModal(t.id);
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!formName.trim()) return;
    setBusy(true);
    try {
      if (modal === "new") {
        const r = await fetch("/api/firma/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad: formName, renk: formColor }),
        }).then(r => r.json());
        if (!r.ok) {
          setLimitWarning(r.error ?? "Oluşturulamadı.");
          setBusy(false);
          closeModal();
          return;
        }
      } else {
        await fetch("/api/firma/templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: modal, ad: formName, renk: formColor }),
        });
      }
      await load();
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setBusy(true);
    try {
      await fetch("/api/firma/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, aktif: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu şablon ve içindeki tüm modüller silinecek. Emin misiniz?")) return;
    setBusy(true);
    try {
      await fetch("/api/firma/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const refreshSelectedModules = async () => {
    if (!selectedId) return;
    const modules = await fetchModules(selectedId);
    setItems(prev => prev.map(t => (t.id === selectedId ? { ...t, modules } : t)));
  };

  return (
    <div className="max-w-[1100px] space-y-8">
      {/* Hero / explain */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">collections_bookmark</span>
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Hazır Kart Şablonları
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Her şablon modüllerle birlikte hazır bir kart düzenidir. Üyeleriniz panelden bu şablonlardan birini seçer;
            kurumsal içerik otomatik kartlarına yansır.
          </p>
        </div>
        <div className="text-xs text-on-surface-variant bg-white/5 rounded-xl px-3 py-2 border border-white/10 whitespace-nowrap">
          {items.length} / {limit === Infinity ? "∞" : limit} şablon
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Şablon kütüphaneniz</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Düzenlemek için bir şablon seçin · üyeler listeden seçim yapar
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-base">smartphone</span>
                Önizle
              </button>
            )}
            {items.length < limit && (
              <button
                type="button"
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Yeni Şablon
              </button>
            )}
          </div>
        </div>

        {limitWarning && (
          <div className="glass-card rounded-xl p-4 border border-amber-400/30 bg-amber-400/5 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-400 text-lg">workspace_premium</span>
            <p className="text-sm text-amber-200 flex-1">{limitWarning}</p>
            <button type="button" onClick={() => setLimitWarning("")} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">Yükleniyor...</div>
        ) : items.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/25 block">view_carousel</span>
            <div>
              <p className="text-sm text-on-surface font-medium">Henüz hazır şablon yok</p>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                İlk şablonunuzu oluşturun, modülleri ekleyin — üyeleriniz kartlarında kullanmaya başlasın.
              </p>
            </div>
            <button type="button" onClick={openNew} className="text-sm text-primary hover:underline font-medium">
              İlk şablonu oluştur →
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(t => (
              <div key={t.id} className="space-y-2">
                <TemplateGalleryCard
                  item={t}
                  selected={t.id === selectedId}
                  onSelect={() => setSelectedId(t.id)}
                  showActions={false}
                />
                <div className="flex gap-2 px-1" onClick={e => e.stopPropagation()}>
                  {!t.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(t.id)}
                      disabled={busy}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-medium glass-card text-on-surface-variant hover:text-primary transition-all disabled:opacity-50"
                    >
                      Varsayılan yap
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] glass-card text-on-surface-variant hover:text-primary transition-all"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="py-1.5 px-2.5 glass-card rounded-lg text-red-400/70 hover:text-red-400 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <section className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-on-surface-variant">Modüller:</span>
              <span className="flex items-center gap-2 font-semibold text-on-surface">
                <span className="w-3 h-3 rounded-full" style={{ background: selected.color }} />
                {selected.name}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Bu modüller şablonu seçen tüm üyelerin kartında görünür
            </p>
          </div>
          <ModulYonetimi
            templateId={selected.id}
            aktif
            onModulesChange={refreshSelectedModules}
          />
        </section>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
                {modal === "new" ? "Yeni Hazır Şablon" : "Şablonu Düzenle"}
              </h3>
              <button type="button" onClick={closeModal} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant mb-1.5 block">Şablon adı</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none"
                  placeholder="Örn: Etkinlik Kampanyası"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant mb-1.5 block">Kısa açıklama (üyeler görür)</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface text-sm focus:border-primary outline-none resize-none"
                  placeholder="Bu şablon kimler için uygun?"
                />
                <p className="text-[10px] text-on-surface-variant/50 mt-1">Backend bağlanınca kaydedilecek</p>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant mb-2 block">Tema rengi</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {PRESET_COLORS.map(p => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setFormColor(p.color)}
                      className="w-8 h-8 rounded-full transition-all hover:scale-110 flex-shrink-0"
                      style={{
                        background: p.color,
                        boxShadow: formColor === p.color ? `0 0 0 3px #0f1321, 0 0 0 5px ${p.color}` : "none",
                      }}
                      title={p.name}
                    />
                  ))}
                  <label className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-all">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">colorize</span>
                    <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="sr-only" />
                  </label>
                </div>
              </div>

              <MiniCardPreview
                name={formName || "Yeni Şablon"}
                color={formColor}
                modules={selected?.modules ?? []}
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 py-3 glass-card rounded-xl text-on-surface-variant text-sm">
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formName.trim() || busy}
                className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Kaydediliyor..." : modal === "new" ? "Oluştur" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="flex flex-col lg:flex-row items-center gap-8 max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-[280px]">
              <MiniCardPreview
                name={selected.name}
                color={selected.color}
                modules={selected.modules}
                memberName="Örnek Üye"
                role="Temsilci"
              />
            </div>
            <div className="flex-1 text-white space-y-4">
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>{selected.name}</h3>
                <p className="text-sm text-white/60 mt-1">{selected.description}</p>
              </div>
              <p className="text-sm text-white/70">
                Üyeler bu şablonu seçtiğinde profil kutusu rengi ve kurumsal modüller böyle görünür.
                Kişisel modüller üyenin kendi ekledikleriyle birleşir.
              </p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2.5 glass-card rounded-xl text-sm text-white/80 hover:text-white"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
