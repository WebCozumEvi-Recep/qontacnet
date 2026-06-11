"use client";
import { useEffect, useRef, useState } from "react";

type Tip = "HAKKIMIZDA" | "GALERI" | "VIDEO" | "FORM" | "HTML" | "TEK_GORSEL" | "SSS" | "HERO";
type Galeri = { url: string; baslik?: string; aciklama?: string };
type Sss = { soru: string; cevap: string };
type Icerik = Record<string, unknown>;
interface Modul {
  id: string;
  tip: Tip;
  baslik: string;
  aktif: boolean;
  sira: number;
  icerik: Icerik;
}

const TIP_META: Record<Tip, { etiket: string; ikon: string; renk: string }> = {
  HAKKIMIZDA: { etiket: "Hakkımızda", ikon: "info", renk: "#00d4ff" },
  GALERI: { etiket: "Kampanya Galerisi", ikon: "photo_library", renk: "#ff9f43" },
  VIDEO: { etiket: "Kurumsal Video", ikon: "smart_display", renk: "#fd79a8" },
  FORM: { etiket: "Başvuru Formu", ikon: "edit_note", renk: "#42faba" },
  HTML: { etiket: "Özel HTML", ikon: "code", renk: "#a29bfe" },
  TEK_GORSEL: { etiket: "Tek Görsel", ikon: "image", renk: "#ffd93d" },
  SSS: { etiket: "Sık Sorulan Sorular", ikon: "quiz", renk: "#6dd5ed" },
  HERO: { etiket: "Tanıtım Banner (Hero)", ikon: "wallpaper", renk: "#ff6b6b" },
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/firma/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? "Yükleme hatası");
  return j.url as string;
}

interface Template { id: string; ad: string; renk: string; aktif: boolean }

export default function SayfaModulleri() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [moduller, setModuller] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showTipMenu, setShowTipMenu] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/firma/templates");
      const j = await r.json();
      if (j.ok) {
        const list: Template[] = j.templates;
        setTemplates(list);
        const aktif = list.find(t => t.aktif) ?? list[0];
        if (aktif) setTemplateId(aktif.id);
        else setLoading(false);
      } else setLoading(false);
    })();
  }, []);

  useEffect(() => { if (templateId) void load(); }, [templateId]);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/firma/moduller?templateId=${templateId}`);
    const j = await r.json();
    if (j.ok) setModuller(j.moduller);
    setLoading(false);
  }

  async function ekle(tip: Tip) {
    setAdding(true); setShowTipMenu(false);
    const r = await fetch("/api/firma/moduller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tip, templateId }),
    });
    const j = await r.json();
    if (j.ok) setModuller(prev => [...prev, j.modul]);
    setAdding(false);
  }

  async function sil(id: string) {
    if (!confirm("Bu modülü silmek istediğine emin misin?")) return;
    const r = await fetch(`/api/firma/moduller/${id}`, { method: "DELETE" });
    if ((await r.json()).ok) setModuller(prev => prev.filter(m => m.id !== id));
  }

  async function guncelle(id: string, patch: Partial<Modul>) {
    setModuller(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    await fetch(`/api/firma/moduller/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function sirala(yeni: Modul[]) {
    setModuller(yeni);
    await fetch("/api/firma/moduller/sira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: yeni.map(m => m.id) }),
    });
  }

  function tasi(id: string, yon: -1 | 1) {
    const idx = moduller.findIndex(m => m.id === id);
    const hedef = idx + yon;
    if (idx < 0 || hedef < 0 || hedef >= moduller.length) return;
    const yeni = [...moduller];
    [yeni[idx], yeni[hedef]] = [yeni[hedef], yeni[idx]];
    void sirala(yeni);
  }

  const aktifTemplate = templates.find(t => t.aktif);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Sayfa Modülleri
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Her şablon için ayrı modüller tanımla. Üyelerin kartvizitinde <span className="text-on-surface">aktif şablonun</span> modülleri görünür.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTipMenu(s => !s)}
            disabled={adding}
            className="px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Modül Ekle
          </button>
          {showTipMenu && (
            <div className="absolute right-0 mt-2 z-20 w-60 glass-card rounded-xl p-2 space-y-1" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)" }}>
              {(Object.keys(TIP_META) as Tip[]).map(t => (
                <button key={t} onClick={() => ekle(t)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 text-left">
                  <span className="material-symbols-outlined text-base" style={{ color: TIP_META[t].renk }}>{TIP_META[t].ikon}</span>
                  <span className="text-sm text-on-surface">{TIP_META[t].etiket}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">style</span>
          <p className="text-sm text-on-surface-variant">Henüz şablonun yok. Önce <a href="/firma/template" className="text-primary underline">Şablonlar</a> bölümünden bir şablon oluştur.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant px-2">Şablon:</span>
          {templates.map(t => (
            <button key={t.id} onClick={() => setTemplateId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${templateId === t.id ? "bg-primary-container text-on-primary-container" : "glass-card text-on-surface-variant hover:text-on-surface"}`}>
              <span className="w-3 h-3 rounded-full" style={{ background: t.renk }} />
              {t.ad}
              {t.aktif && <span className="text-[10px] bg-tertiary/20 text-tertiary px-1.5 py-0.5 rounded">AKTİF</span>}
            </button>
          ))}
          {aktifTemplate && templateId !== aktifTemplate.id && (
            <span className="ml-auto text-[11px] text-amber-300 px-2">
              Düzenlediğin şablon aktif değil — modüller kartvizitte görünmez.
            </span>
          )}
        </div>
      )}

      {templates.length > 0 && (loading ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
        </div>
      ) : moduller.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">view_carousel</span>
          <p className="text-sm text-on-surface-variant">Henüz modül eklenmemiş. Üst sağdaki butonla ilk modülünü ekle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moduller.map((m, idx) => (
            <ModulKart
              key={m.id}
              modul={m}
              ilk={idx === 0}
              son={idx === moduller.length - 1}
              onYukari={() => tasi(m.id, -1)}
              onAsagi={() => tasi(m.id, 1)}
              onSil={() => sil(m.id)}
              onGuncelle={(p) => guncelle(m.id, p)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ModulKart({ modul, ilk, son, onYukari, onAsagi, onSil, onGuncelle }: {
  modul: Modul;
  ilk: boolean;
  son: boolean;
  onYukari: () => void;
  onAsagi: () => void;
  onSil: () => void;
  onGuncelle: (p: Partial<Modul>) => void;
}) {
  const [acik, setAcik] = useState(false);
  const meta = TIP_META[modul.tip];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <button onClick={onYukari} disabled={ilk} className="text-on-surface-variant disabled:opacity-30 hover:text-primary">
            <span className="material-symbols-outlined text-lg">expand_less</span>
          </button>
          <button onClick={onAsagi} disabled={son} className="text-on-surface-variant disabled:opacity-30 hover:text-primary">
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.renk}20` }}>
          <span className="material-symbols-outlined text-xl" style={{ color: meta.renk }}>{meta.ikon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-on-surface-variant">{meta.etiket}</p>
          <input
            value={modul.baslik}
            onChange={e => onGuncelle({ baslik: e.target.value })}
            placeholder={meta.etiket}
            className="bg-transparent text-sm font-semibold text-on-surface outline-none w-full"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
          <input type="checkbox" checked={modul.aktif} onChange={e => onGuncelle({ aktif: e.target.checked })} />
          Aktif
        </label>
        <button onClick={() => setAcik(a => !a)} className="px-3 py-1.5 text-xs rounded-lg glass-card text-on-surface-variant hover:text-on-surface">
          {acik ? "Kapat" : "Düzenle"}
        </button>
        <button onClick={onSil} className="text-red-400 hover:text-red-300">
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
      {acik && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {modul.tip === "HAKKIMIZDA" && (
            <HakkimizdaEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "GALERI" && (
            <GaleriEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "VIDEO" && (
            <VideoEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "FORM" && (
            <FormEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "HTML" && (
            <HtmlEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "TEK_GORSEL" && (
            <TekGorselEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "SSS" && (
            <SssEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
          {modul.tip === "HERO" && (
            <HeroEditor icerik={modul.icerik} onChange={icerik => onGuncelle({ icerik })} />
          )}
        </div>
      )}
    </div>
  );
}

function fieldInput(label: string, value: string, onChange: (v: string) => void, opts: { area?: boolean; ph?: string } = {}) {
  return (
    <div>
      <label className="text-xs text-on-surface-variant mb-1 block">{label}</label>
      {opts.area ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={opts.ph}
          rows={5}
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={opts.ph}
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all" />
      )}
    </div>
  );
}

function GorselYukle({ url, onChange, label = "Görsel" }: { url: string; onChange: (u: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  return (
    <div>
      <label className="text-xs text-on-surface-variant mb-1 block">{label}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            setYukleniyor(true);
            try { onChange(await uploadFile(f)); } catch (err) { alert(err instanceof Error ? err.message : "Hata"); }
            setYukleniyor(false);
            if (ref.current) ref.current.value = "";
          }} />
        <button type="button" onClick={() => ref.current?.click()}
          disabled={yukleniyor}
          className="px-3 py-2 rounded-xl glass-card text-xs text-on-surface flex items-center gap-2 disabled:opacity-60">
          <span className="material-symbols-outlined text-sm">{yukleniyor ? "progress_activity" : "upload"}</span>
          {yukleniyor ? "Yükleniyor..." : url ? "Değiştir" : "Yükle"}
        </button>
        {url && (
          <button type="button" onClick={() => onChange("")}
            className="px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300">
            Kaldır
          </button>
        )}
      </div>
    </div>
  );
}

function HakkimizdaEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const metin = String(icerik.metin ?? "");
  const gorsel = String(icerik.gorsel ?? "");
  return (
    <div className="space-y-3">
      <GorselYukle url={gorsel} onChange={u => onChange({ ...icerik, gorsel: u })} label="Kapak görseli (opsiyonel)" />
      {fieldInput("Metin", metin, v => onChange({ ...icerik, metin: v }), { area: true, ph: "Firmanızı tanıtın..." })}
    </div>
  );
}

function GaleriEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const gorseller = (Array.isArray(icerik.gorseller) ? icerik.gorseller : []) as Galeri[];
  const ref = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const ekle = async (files: FileList | null) => {
    if (!files) return;
    setYukleniyor(true);
    const yeni: Galeri[] = [];
    for (const f of Array.from(files)) {
      try { yeni.push({ url: await uploadFile(f), baslik: "", aciklama: "" }); } catch {}
    }
    onChange({ ...icerik, gorseller: [...gorseller, ...yeni] });
    setYukleniyor(false);
    if (ref.current) ref.current.value = "";
  };

  const sil = (i: number) => onChange({ ...icerik, gorseller: gorseller.filter((_, idx) => idx !== i) });
  const guncelle = (i: number, p: Partial<Galeri>) => onChange({
    ...icerik,
    gorseller: gorseller.map((g, idx) => idx === i ? { ...g, ...p } : g),
  });
  const tasi = (i: number, yon: -1 | 1) => {
    const hedef = i + yon;
    if (hedef < 0 || hedef >= gorseller.length) return;
    const arr = [...gorseller];
    [arr[i], arr[hedef]] = [arr[hedef], arr[i]];
    onChange({ ...icerik, gorseller: arr });
  };

  return (
    <div className="space-y-3">
      <div>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => ekle(e.target.files)} />
        <button type="button" onClick={() => ref.current?.click()} disabled={yukleniyor}
          className="px-4 py-2.5 rounded-xl glass-card text-sm text-on-surface flex items-center gap-2 disabled:opacity-60">
          <span className="material-symbols-outlined text-base">{yukleniyor ? "progress_activity" : "add_photo_alternate"}</span>
          {yukleniyor ? "Yükleniyor..." : "Görsel ekle"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {gorseller.map((g, i) => (
          <div key={i} className="glass-card rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt="" className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 space-y-2">
                <input value={g.baslik ?? ""} onChange={e => guncelle(i, { baslik: e.target.value })}
                  placeholder="Başlık" className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none" />
                <input value={g.aciklama ?? ""} onChange={e => guncelle(i, { aciklama: e.target.value })}
                  placeholder="Açıklama" className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => tasi(i, -1)} disabled={i === 0} className="text-on-surface-variant disabled:opacity-30">
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <button onClick={() => tasi(i, 1)} disabled={i === gorseller.length - 1} className="text-on-surface-variant disabled:opacity-30">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <span className="flex-1" />
              <button onClick={() => sil(i)} className="text-red-400 text-xs">Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const videoUrl = String(icerik.videoUrl ?? "");
  const aciklama = String(icerik.aciklama ?? "");
  return (
    <div className="space-y-3">
      {fieldInput("YouTube veya Vimeo linki", videoUrl, v => onChange({ ...icerik, videoUrl: v }), { ph: "https://youtube.com/watch?v=..." })}
      {fieldInput("Açıklama (opsiyonel)", aciklama, v => onChange({ ...icerik, aciklama: v }), { area: true })}
      {videoUrl && <p className="text-xs text-on-surface-variant">Önizleme kartın altında görünecek.</p>}
    </div>
  );
}

function FormEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const aciklama = String(icerik.aciklama ?? "");
  const gonderButon = String(icerik.gonderButon ?? "Gönder");
  return (
    <div className="space-y-3">
      {fieldInput("Form açıklaması", aciklama, v => onChange({ ...icerik, aciklama: v }), { area: true })}
      {fieldInput("Buton metni", gonderButon, v => onChange({ ...icerik, gonderButon: v }))}
      <p className="text-xs text-on-surface-variant">Form: ad, e-posta, telefon ve mesaj alanlarını içerir. Gelen başvurular &quot;Başvurular&quot; bölümünde listelenir.</p>
    </div>
  );
}

function HtmlEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const kod = String(icerik.kod ?? "");
  return (
    <div className="space-y-3">
      <p className="text-xs text-on-surface-variant">İstediğin HTML kodunu yazabilirsin. Stil için inline <code className="text-primary">style=&quot;...&quot;</code> kullan.</p>
      <textarea value={kod} onChange={e => onChange({ ...icerik, kod: e.target.value })}
        rows={10} spellCheck={false}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-on-surface text-xs font-mono outline-none focus:border-primary"
        placeholder='<div style="...">İçerik</div>' />
    </div>
  );
}

function TekGorselEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const url = String(icerik.url ?? "");
  const baslik = String(icerik.baslik ?? "");
  const link = String(icerik.link ?? "");
  return (
    <div className="space-y-3">
      <GorselYukle url={url} onChange={u => onChange({ ...icerik, url: u })} />
      {fieldInput("Başlık (opsiyonel)", baslik, v => onChange({ ...icerik, baslik: v }))}
      {fieldInput("Tıklanınca gidilecek link (opsiyonel)", link, v => onChange({ ...icerik, link: v }), { ph: "https://..." })}
    </div>
  );
}

function SssEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const sorular = (Array.isArray(icerik.sorular) ? icerik.sorular : []) as Sss[];
  const guncelle = (i: number, p: Partial<Sss>) => onChange({
    ...icerik,
    sorular: sorular.map((s, idx) => idx === i ? { ...s, ...p } : s),
  });
  const sil = (i: number) => onChange({ ...icerik, sorular: sorular.filter((_, idx) => idx !== i) });
  const ekle = () => onChange({ ...icerik, sorular: [...sorular, { soru: "", cevap: "" }] });
  const tasi = (i: number, yon: -1 | 1) => {
    const hedef = i + yon;
    if (hedef < 0 || hedef >= sorular.length) return;
    const arr = [...sorular];
    [arr[i], arr[hedef]] = [arr[hedef], arr[i]];
    onChange({ ...icerik, sorular: arr });
  };
  return (
    <div className="space-y-3">
      {sorular.map((s, i) => (
        <div key={i} className="glass-card rounded-xl p-3 space-y-2">
          <input value={s.soru} onChange={e => guncelle(i, { soru: e.target.value })} placeholder="Soru"
            className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary font-medium" />
          <textarea value={s.cevap} onChange={e => guncelle(i, { cevap: e.target.value })} rows={3} placeholder="Cevap"
            className="w-full bg-surface-dim border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary" />
          <div className="flex items-center gap-1">
            <button onClick={() => tasi(i, -1)} disabled={i === 0} className="text-on-surface-variant disabled:opacity-30">
              <span className="material-symbols-outlined text-base">expand_less</span>
            </button>
            <button onClick={() => tasi(i, 1)} disabled={i === sorular.length - 1} className="text-on-surface-variant disabled:opacity-30">
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>
            <span className="flex-1" />
            <button onClick={() => sil(i)} className="text-red-400 text-xs">Sil</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={ekle}
        className="px-4 py-2.5 rounded-xl glass-card text-sm text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-base">add</span>
        Soru ekle
      </button>
    </div>
  );
}

function HeroEditor({ icerik, onChange }: { icerik: Icerik; onChange: (i: Icerik) => void }) {
  const arkaplan = String(icerik.arkaplan ?? "");
  const html = String(icerik.html ?? "");
  const hizalama = String(icerik.hizalama ?? "center");
  const ref = useRef<HTMLDivElement>(null);

  const cmd = (komut: string, deger?: string) => {
    ref.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(komut, false, deger);
    if (ref.current) onChange({ ...icerik, html: ref.current.innerHTML });
  };

  return (
    <div className="space-y-3">
      <GorselYukle url={arkaplan} onChange={u => onChange({ ...icerik, arkaplan: u })} label="Arkaplan görseli" />
      <div>
        <label className="text-xs text-on-surface-variant mb-1 block">Metin hizalama</label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map(h => (
            <button key={h} onClick={() => onChange({ ...icerik, hizalama: h })}
              className={`px-3 py-1.5 rounded-lg text-xs ${hizalama === h ? "bg-primary-container text-on-primary-container" : "glass-card text-on-surface-variant"}`}>
              {h === "left" ? "Sol" : h === "center" ? "Orta" : "Sağ"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-on-surface-variant mb-1 block">Metin</label>
        <div className="flex gap-1 flex-wrap mb-2">
          {[
            { k: "bold", i: "format_bold" },
            { k: "italic", i: "format_italic" },
            { k: "underline", i: "format_underlined" },
          ].map(b => (
            <button key={b.k} type="button" onClick={() => cmd(b.k)} className="w-8 h-8 rounded-lg glass-card text-on-surface flex items-center justify-center hover:bg-white/10">
              <span className="material-symbols-outlined text-base">{b.i}</span>
            </button>
          ))}
          <button type="button" onClick={() => cmd("formatBlock", "<h2>")} className="px-2 h-8 rounded-lg glass-card text-on-surface text-xs">H2</button>
          <button type="button" onClick={() => cmd("formatBlock", "<h3>")} className="px-2 h-8 rounded-lg glass-card text-on-surface text-xs">H3</button>
          <button type="button" onClick={() => cmd("formatBlock", "<p>")} className="px-2 h-8 rounded-lg glass-card text-on-surface text-xs">P</button>
          <label className="w-8 h-8 rounded-lg glass-card flex items-center justify-center cursor-pointer">
            <input type="color" onChange={e => cmd("foreColor", e.target.value)} className="w-0 h-0 opacity-0" />
            <span className="material-symbols-outlined text-base">format_color_text</span>
          </label>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={e => onChange({ ...icerik, html: (e.target as HTMLDivElement).innerHTML })}
          className="min-h-[120px] bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <p className="text-[11px] text-on-surface-variant mt-1">İçerik kayıt için tıklamayı bırak (focus dışına çıkınca kaydedilir).</p>
      </div>
    </div>
  );
}
