"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ModulIkon } from "@/components/ModulIkon";

type Tip = "GALERI" | "TEXT" | "VIDEO" | "LINK" | "GORSEL" | "FORM" | "TEK_GORSEL" | "HTML" | "SSS" | "HERO" | "BASVURU";
type IkonAlan = { ikon: string; ikonAd: string; butonRenk: string; ikonRenk: string };
interface Tanim extends IkonAlan { id: string; ad: string; tip: Tip }
interface Icerik {
  metin?: string; gorsel?: string; videoUrl?: string; aciklama?: string; url?: string; butonAdi?: string; gonderButon?: string;
  gorseller?: { url: string }[];
  baslik?: string; link?: string; kod?: string; sorular?: { soru: string; cevap: string }[];
  arkaplan?: string; html?: string; hizalama?: string;
}
interface Modul {
  id: string;
  tip: Tip;
  baslik: string;
  aktif: boolean;
  sira: number;
  icerik: Icerik;
  tanim?: ({ ad: string } & IkonAlan) | null;
}

const TIP_ETIKET: Record<Tip, string> = { GALERI: "Galeri", TEXT: "Text Bilgi", VIDEO: "Video", LINK: "URL / Link", GORSEL: "Görsel", FORM: "İletişim Formu", TEK_GORSEL: "Tek Görsel", HTML: "Özel HTML", SSS: "Sık Sorulan Sorular", HERO: "Tanıtım Hero Banner", BASVURU: "Başvuru Formu" };

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/me/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error ?? "Yükleme hatası");
  return j.url as string;
}

function GorselButon({ onChange, label }: { onChange: (u: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [yuk, setYuk] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          setYuk(true);
          try { onChange(await uploadFile(f)); } catch (err) { alert(err instanceof Error ? err.message : "Hata"); }
          setYuk(false);
          if (ref.current) ref.current.value = "";
        }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={yuk}
        className="px-3 py-2 rounded-xl glass-card text-xs text-on-surface flex items-center gap-1.5 disabled:opacity-60">
        <span className="material-symbols-outlined text-sm">{yuk ? "progress_activity" : "upload"}</span>
        {yuk ? "..." : label}
      </button>
    </>
  );
}

function ModulEditor({ modul, onChange }: { modul: Modul; onChange: (icerik: Icerik) => void }) {
  const i = modul.icerik ?? {};
  if (modul.tip === "TEXT") {
    return (
      <div className="space-y-3">
        <textarea value={i.metin ?? ""} onChange={e => onChange({ ...i, metin: e.target.value })}
          placeholder="Paylaşmak istediğin bilgi..." rows={4}
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        <div className="flex items-center gap-3 flex-wrap">
          {i.gorsel && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.gorsel} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
          )}
          <GorselButon label={i.gorsel ? "Görseli Değiştir" : "Görsel Ekle (opsiyonel)"} onChange={u => onChange({ ...i, gorsel: u })} />
          {i.gorsel && <button type="button" onClick={() => onChange({ ...i, gorsel: "" })} className="text-xs text-red-400 hover:text-red-300">Kaldır</button>}
        </div>
      </div>
    );
  }
  if (modul.tip === "VIDEO") {
    return (
      <div className="space-y-3">
        <input value={i.videoUrl ?? ""} onChange={e => onChange({ ...i, videoUrl: e.target.value })}
          placeholder="YouTube veya Vimeo linki"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={i.aciklama ?? ""} onChange={e => onChange({ ...i, aciklama: e.target.value })}
          placeholder="Açıklama (opsiyonel)"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
      </div>
    );
  }
  if (modul.tip === "LINK") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Açıklama (butonun üstünde görünür)</label>
          <textarea value={i.aciklama ?? ""} onChange={e => onChange({ ...i, aciklama: e.target.value })}
            placeholder="ör. Menümüzü görmek için tıklayın" rows={2}
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Buton adı</label>
          <input value={i.butonAdi ?? ""} onChange={e => onChange({ ...i, butonAdi: e.target.value })}
            placeholder="ör. Menüyü Aç"
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Bağlantı (URL)</label>
          <input value={i.url ?? ""} onChange={e => onChange({ ...i, url: e.target.value })}
            placeholder="https://..."
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <p className="text-[11px] text-on-surface-variant/60">Kartta ikona tıklanınca popup açılır; butona basınca bu bağlantı yeni sekmede gider.</p>
      </div>
    );
  }
  if (modul.tip === "GORSEL") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {i.gorsel && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.gorsel} alt="" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
          )}
          <GorselButon label={i.gorsel ? "Görseli Değiştir" : "Görsel Yükle"} onChange={u => onChange({ ...i, gorsel: u })} />
          {i.gorsel && <button type="button" onClick={() => onChange({ ...i, gorsel: "" })} className="text-xs text-red-400 hover:text-red-300">Kaldır</button>}
        </div>
        <input value={i.aciklama ?? ""} onChange={e => onChange({ ...i, aciklama: e.target.value })}
          placeholder="Açıklama (opsiyonel)"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={i.url ?? ""} onChange={e => onChange({ ...i, url: e.target.value })}
          placeholder="Tıklanınca gidilecek bağlantı (opsiyonel) — https://..."
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
      </div>
    );
  }
  if (modul.tip === "FORM") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Açıklama (formun üstünde görünür)</label>
          <textarea value={i.aciklama ?? ""} onChange={e => onChange({ ...i, aciklama: e.target.value })}
            placeholder="ör. Bize bilgilerinizi bırakın, size dönüş yapalım" rows={2}
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Gönder butonu yazısı</label>
          <input value={i.gonderButon ?? ""} onChange={e => onChange({ ...i, gonderButon: e.target.value })}
            placeholder="ör. Gönder / Bende bu işi yapmak istiyorum"
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <p className="text-[11px] text-on-surface-variant/60">Ziyaretçiler ad, e-posta, telefon ve mesaj bırakır. Gelen bilgiler firmanın <b>Başvurular</b> ekranına düşer.</p>
      </div>
    );
  }
  if (modul.tip === "BASVURU") {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Açıklama (formun üstünde görünür)</label>
          <textarea value={i.aciklama ?? ""} onChange={e => onChange({ ...i, aciklama: e.target.value })}
            placeholder="ör. Ekibime katılmak için bilgilerini bırak" rows={2}
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-y" />
        </div>
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Gönder butonu yazısı</label>
          <input value={i.gonderButon ?? ""} onChange={e => onChange({ ...i, gonderButon: e.target.value })}
            placeholder="ör. Başvur"
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <p className="text-[11px] text-on-surface-variant/60">Ziyaretçi <b>Ad Soyad, Telefon, E-posta, Şehir</b> bırakır. Gelen bilgiler firmanın <b>Başvurular</b> ekranına düşer.</p>
      </div>
    );
  }
  if (modul.tip === "TEK_GORSEL") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {i.gorsel && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.gorsel} alt="" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
          )}
          <GorselButon label={i.gorsel ? "Görseli Değiştir" : "Görsel Yükle"} onChange={u => onChange({ ...i, gorsel: u })} />
          {i.gorsel && <button type="button" onClick={() => onChange({ ...i, gorsel: "" })} className="text-xs text-red-400 hover:text-red-300">Kaldır</button>}
        </div>
        <input value={i.baslik ?? ""} onChange={e => onChange({ ...i, baslik: e.target.value })}
          placeholder="Görsel altı yazı (opsiyonel)"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={i.link ?? ""} onChange={e => onChange({ ...i, link: e.target.value })}
          placeholder="Tıklanınca gidilecek bağlantı (opsiyonel) — https://..."
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
      </div>
    );
  }
  if (modul.tip === "HTML") {
    return (
      <div className="space-y-2">
        <label className="text-xs text-on-surface-variant block">Özel HTML kodu</label>
        <textarea value={i.kod ?? ""} onChange={e => onChange({ ...i, kod: e.target.value })}
          placeholder="<div>...</div>" rows={6}
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-on-surface outline-none focus:border-primary resize-y" />
        <p className="text-[11px] text-on-surface-variant/60">Kartta ikona tıklanınca bu HTML popup içinde gösterilir.</p>
      </div>
    );
  }
  if (modul.tip === "SSS") {
    const sorular = i.sorular ?? [];
    const setSoru = (idx: number, patch: Partial<{ soru: string; cevap: string }>) =>
      onChange({ ...i, sorular: sorular.map((s, x) => (x === idx ? { ...s, ...patch } : s)) });
    return (
      <div className="space-y-3">
        {sorular.map((s, idx) => (
          <div key={idx} className="bg-surface-dim border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input value={s.soru} onChange={e => setSoru(idx, { soru: e.target.value })} placeholder="Soru"
                className="flex-1 bg-transparent border-b border-white/10 px-1 py-1.5 text-sm text-on-surface outline-none focus:border-primary" />
              <button type="button" onClick={() => onChange({ ...i, sorular: sorular.filter((_, x) => x !== idx) })}
                className="text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-base">delete</span></button>
            </div>
            <textarea value={s.cevap} onChange={e => setSoru(idx, { cevap: e.target.value })} placeholder="Cevap" rows={2}
              className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-sm text-on-surface outline-none focus:border-primary resize-y" />
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...i, sorular: [...sorular, { soru: "", cevap: "" }] })}
          className="px-3 py-2 rounded-xl glass-card text-xs text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">add</span>Soru Ekle
        </button>
      </div>
    );
  }
  if (modul.tip === "HERO") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {i.arkaplan && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.arkaplan} alt="" className="w-24 h-16 rounded-xl object-cover border border-white/10" />
          )}
          <GorselButon label={i.arkaplan ? "Arka Planı Değiştir" : "Arka Plan Görseli"} onChange={u => onChange({ ...i, arkaplan: u })} />
          {i.arkaplan && <button type="button" onClick={() => onChange({ ...i, arkaplan: "" })} className="text-xs text-red-400 hover:text-red-300">Kaldır</button>}
        </div>
        <textarea value={i.html ?? ""} onChange={e => onChange({ ...i, html: e.target.value })}
          placeholder="Tanıtım metni / HTML — ör. <h3>Kampanya</h3><p>%20 indirim</p>" rows={4}
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-on-surface outline-none focus:border-primary resize-y" />
        <div>
          <label className="text-xs text-on-surface-variant mb-1 block">Metin hizalama</label>
          <select value={i.hizalama ?? "center"} onChange={e => onChange({ ...i, hizalama: e.target.value })}
            className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary">
            <option value="left">Sola</option>
            <option value="center">Ortala</option>
            <option value="right">Sağa</option>
          </select>
        </div>
      </div>
    );
  }
  // GALERI
  const gorseller = i.gorseller ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {gorseller.map((g, idx) => (
          <div key={idx} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
            <button type="button" onClick={() => onChange({ ...i, gorseller: gorseller.filter((_, x) => x !== idx) })}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ))}
      </div>
      <GorselButon label="Görsel Ekle" onChange={u => onChange({ ...i, gorseller: [...gorseller, { url: u }] })} />
    </div>
  );
}

export default function ModullerimPage() {
  const { user } = useAuth();
  const [tanimlar, setTanimlar] = useState<Tanim[]>([]);
  const [moduller, setModuller] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me/modul-tanimlar").then(r => r.json()),
      fetch("/api/me/moduller").then(r => r.json()),
    ]).then(([t, m]) => {
      if (t.ok) setTanimlar(t.tanimlar);
      if (m.ok) setModuller(m.moduller);
    }).finally(() => setLoading(false));
  }, []);

  const ekle = async (tanimId: string) => {
    const r = await fetch("/api/me/moduller", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanimId }),
    });
    const j = await r.json();
    if (j.ok) setModuller(m => [...m, j.modul]);
    else alert(j.error ?? "Eklenemedi");
  };

  const kaydet = async (id: string, patch: Partial<Pick<Modul, "baslik" | "icerik" | "aktif">>) => {
    setSavingId(id);
    await fetch(`/api/me/moduller/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(s => (s === id ? null : s)), 2000);
  };

  const sil = async (id: string) => {
    if (!confirm("Bu modül silinsin mi?")) return;
    setModuller(m => m.filter(x => x.id !== id));
    await fetch(`/api/me/moduller/${id}`, { method: "DELETE" });
  };

  const setLocal = (id: string, patch: Partial<Modul>) =>
    setModuller(m => m.map(x => (x.id === id ? { ...x, ...patch } : x)));

  if (loading) return <div className="flex justify-center py-16"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></div>;

  return (
    <div className="max-w-[800px] space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="hidden lg:block text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Modüllerim</h2>
          <p className="text-sm text-on-surface-variant mt-1">Kartında görünecek modülleri ekle ve içeriğini doldur.</p>
        </div>
        <Link href={`/kart/${user?.id}`} target="_blank"
          className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm text-on-surface-variant hover:text-primary transition-all">
          <span className="material-symbols-outlined text-base">open_in_new</span>Kartı Görüntüle
        </Link>
      </div>

      {/* Katalog */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-3" style={{ fontFamily: "Sora, sans-serif" }}>Modül Ekle</h3>
        {tanimlar.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Şu an eklenebilecek modül yok.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tanimlar.map(t => (
              <button key={t.id} onClick={() => ekle(t.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-sm text-on-surface hover:bg-white/5 transition-all">
                <ModulIkon veri={t} size={28} />
                {t.ad}
                <span className="material-symbols-outlined text-sm text-on-surface-variant">add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Eklenmiş modüller */}
      {moduller.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-8">Henüz modül eklemedin. Yukarıdan seç.</p>
      ) : (
        <div className="space-y-4">
          {moduller.map(m => (
            <div key={m.id} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <ModulIkon veri={m.tanim ?? {}} size={32} />
                <input value={m.baslik}
                  onChange={e => setLocal(m.id, { baslik: e.target.value })}
                  onBlur={() => kaydet(m.id, { baslik: m.baslik })}
                  className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none border-b border-transparent focus:border-white/20 py-1" />
                <span className="text-xs text-on-surface-variant">{TIP_ETIKET[m.tip]}</span>
                <button onClick={() => { const v = !m.aktif; setLocal(m.id, { aktif: v }); kaydet(m.id, { aktif: v }); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${m.aktif ? "bg-tertiary/15 text-tertiary" : "bg-white/5 text-on-surface-variant"}`}>
                  {m.aktif ? "Aktif" : "Pasif"}
                </button>
                <button onClick={() => sil(m.id)} className="text-red-400 hover:text-red-300">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>

              <ModulEditor modul={m} onChange={ic => setLocal(m.id, { icerik: ic })} />

              <div className="flex items-center justify-end gap-3">
                {savedId === m.id && <span className="text-xs text-tertiary">Kaydedildi ✓</span>}
                <button onClick={() => kaydet(m.id, { baslik: m.baslik, icerik: m.icerik })} disabled={savingId === m.id}
                  className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
                  <span className={`material-symbols-outlined text-base ${savingId === m.id ? "animate-spin" : ""}`}>{savingId === m.id ? "progress_activity" : "save"}</span>
                  Kaydet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
