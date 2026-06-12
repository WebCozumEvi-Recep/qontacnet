"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { temaLimiti, paketLabel } from "@/lib/labels";
import ModulYonetimi from "@/components/firma/ModulYonetimi";

const PRESET_COLORS = [
  { name: "Cyber Blue", color: "#d4af37" },
  { name: "Neon Purple", color: "#6001d1" },
  { name: "Mint Green", color: "#42faba" },
  { name: "Sunset Red", color: "#ff6b6b" },
  { name: "Gold", color: "#ffd93d" },
  { name: "Lavender", color: "#a29bfe" },
  { name: "Orange", color: "#ff9f43" },
  { name: "Pink", color: "#fd79a8" },
];

interface Template { id: string; ad: string; renk: string; aktif: boolean }

export default function TemplatePage() {
  const { user } = useAuth();
  const firma = user?.data as { ad?: string; paket?: string } | undefined;
  const paket = firma?.paket ?? "BASLANGIC";
  const limit = temaLimiti[paket] ?? 1;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [seciliId, setSeciliId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState<null | "new" | string>(null);
  const [formAd, setFormAd] = useState("");
  const [formRenk, setFormRenk] = useState("#d4af37");
  const [limitUyari, setLimitUyari] = useState("");

  const [onizle, setOnizle] = useState(false);
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);

  const load = async () => {
    const j = await fetch("/api/firma/templates").then(r => r.json());
    if (j.ok) {
      setTemplates(j.templates);
      const aktif = j.templates.find((t: Template) => t.aktif) ?? j.templates[0];
      setSeciliId(prev => prev && j.templates.some((t: Template) => t.id === prev) ? prev : (aktif?.id ?? ""));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Canlı önizleme için bir üye kartı bul
  useEffect(() => {
    fetch("/api/firma/stats").then(r => r.json()).then(j => {
      if (j.ok && j.topMembers?.length) setPreviewMemberId(j.topMembers[0].id);
    }).catch(() => {});
  }, []);

  const openNew = () => {
    if (templates.length >= limit) {
      setLimitUyari(`${paketLabel[paket]} paketi en fazla ${limit} tema oluşturmanıza izin verir. Daha fazlası için paketinizi yükseltin.`);
      return;
    }
    setFormAd(""); setFormRenk("#d4af37"); setModal("new");
  };
  const openEdit = (t: Template) => { setFormAd(t.ad); setFormRenk(t.renk); setModal(t.id); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!formAd.trim()) return;
    setBusy(true);
    try {
      if (modal === "new") {
        const r = await fetch("/api/firma/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: formAd, renk: formRenk }) }).then(r => r.json());
        if (!r.ok) { setLimitUyari(r.error ?? "Oluşturulamadı."); setBusy(false); closeModal(); return; }
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
    if (!confirm("Bu şablon ve içindeki tüm modüller silinecek. Emin misiniz?")) return;
    setBusy(true);
    try {
      await fetch("/api/firma/templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await load();
    } finally { setBusy(false); }
  };

  const secili = templates.find(t => t.id === seciliId);
  const aktifTemplate = templates.find(t => t.aktif);

  return (
    <div className="max-w-[1100px] space-y-8">
      {/* ÜST: Kart Temaları */}
      <section className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart Temaları</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Aktif tema tüm üyelerin kartına yansır · {templates.length}/{limit === Infinity ? "∞" : limit} tema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOnizle(true)}
              className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
              <span className="material-symbols-outlined text-base">smartphone</span>Canlı Önizle
            </button>
            {templates.length < limit && (
              <button onClick={openNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
                <span className="material-symbols-outlined text-base">add</span>Yeni Tema
              </button>
            )}
          </div>
        </div>

        {limitUyari && (
          <div className="glass-card rounded-xl p-4 border border-amber-400/30 bg-amber-400/5 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-400 text-lg">workspace_premium</span>
            <p className="text-sm text-amber-200 flex-1">{limitUyari}</p>
            <button onClick={() => setLimitUyari("")} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined text-base">close</span></button>
          </div>
        )}

        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm">Yükleniyor...</div>
        ) : templates.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 block">palette</span>
            <p className="text-sm text-on-surface-variant">Henüz tema yok.</p>
            <button onClick={openNew} className="text-xs text-primary hover:underline">Hemen oluştur →</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
              const isSecili = t.id === seciliId;
              return (
                <div key={t.id}
                  onClick={() => setSeciliId(t.id)}
                  className={`glass-card rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all ${isSecili ? "ring-2 ring-primary" : "hover:bg-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 border border-white/10" style={{ background: t.renk }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface truncate">{t.ad}</p>
                      <p className="text-xs text-on-surface-variant">{t.renk}</p>
                    </div>
                    {t.aktif && (
                      <span className="text-[10px] font-semibold text-tertiary bg-tertiary/10 border border-tertiary/20 rounded-full px-2 py-0.5">AKTİF</span>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {!t.aktif && (
                      <button onClick={() => handleActivate(t.id)} disabled={busy}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-primary-container text-on-primary-container hover:scale-[1.02] transition-all disabled:opacity-50">
                        Uygula
                      </button>
                    )}
                    <button onClick={() => openEdit(t)}
                      className={`${t.aktif ? "flex-1" : ""} py-1.5 px-3 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all`}>
                      Düzenle
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="py-1.5 px-2.5 glass-card rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ALT: Seçili şablonun modülleri */}
      {secili && (
        <section className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-on-surface-variant">Düzenlenen şablon:</span>
            <span className="flex items-center gap-2 font-semibold text-on-surface">
              <span className="w-3 h-3 rounded-full" style={{ background: secili.renk }} />
              {secili.ad}
            </span>
          </div>
          <ModulYonetimi templateId={secili.id} aktif={secili.aktif} />
        </section>
      )}

      {/* Modal: Yeni / Düzenle */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
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

      {/* Canlı Önizleme — gerçek telefon görünümü */}
      {onizle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setOnizle(false)}>
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-white">
              <span className="text-sm font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>Canlı Önizleme</span>
              {aktifTemplate && <span className="text-xs text-white/60">Aktif tema: {aktifTemplate.ad}</span>}
              <button onClick={() => setOnizle(false)} className="text-white/70 hover:text-white ml-2"><span className="material-symbols-outlined">close</span></button>
            </div>
            {/* Telefon çerçevesi */}
            <div className="rounded-[2.5rem] border-[6px] border-white/15 overflow-hidden shadow-2xl bg-black" style={{ width: 340, height: 680 }}>
              {previewMemberId ? (
                <iframe src={`/kart/${previewMemberId}`} title="Canlı önizleme" className="w-full h-full border-0" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 gap-3" style={{ background: "#050816" }}>
                  <span className="material-symbols-outlined text-4xl text-white/30">person_off</span>
                  <p className="text-sm text-white/60">Önizleme için en az bir aktif üye kartı gerekli.</p>
                </div>
              )}
            </div>
            <p className="text-xs text-white/50 max-w-xs text-center">
              Bu, üyelerinizin gerçek kart sayfasıdır — aktif şablonun renk ve modülleri burada görünür.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
