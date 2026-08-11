"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ModulIkon, IkonGaleri, modulIkonVerisi } from "@/components/ModulIkon";
import { UyeModulLightbox, uyeModulDolu, type UyeModul } from "@/components/UyeModulLightbox";
import { BrandGlyph, type BrandKey } from "@/components/BrandGlyph";

type Tip = "GALERI" | "TEXT" | "VIDEO" | "LINK" | "GORSEL" | "FORM" | "TEK_GORSEL" | "HTML" | "SSS" | "HERO" | "BASVURU";
type IkonAlan = { ikon: string; ikonAd: string; butonRenk: string; ikonRenk: string };
interface Tanim extends IkonAlan { id: string; ad: string; tip: Tip }
interface Icerik {
  metin?: string; gorsel?: string; videoUrl?: string; aciklama?: string; url?: string; butonAdi?: string; gonderButon?: string;
  gorseller?: { url: string }[];
  baslik?: string; link?: string; kod?: string; sorular?: { soru: string; cevap: string }[];
  arkaplan?: string; html?: string; hizalama?: string;
  /** Üyenin bu modül için seçtiği Material Symbols ikonu (tanımdakinin yerine geçer). */
  ikonAd?: string;
  /** Seçilen ikonun yuvarlak zemin ve ikon rengi (boşsa tanımın rengi kullanılır). */
  butonRenk?: string; ikonRenk?: string;
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

interface KartVeri {
  id: string; ad: string; soyad: string; unvan: string; firmaAdi: string; takim?: string; kartRenk: string;
  telefon: string; email: string; whatsapp: string; linkedin: string; instagram: string; website: string;
  biyografi: string; avatar?: string; kartArkaplan?: string;
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

// Public kart sayfasının küçültülmüş simülasyonu: profil kutusu + aksiyon butonları + modül ikonları.
// Veri /api/kart'tan gelir; profildeki "Kartta göster" izinleri orada uygulanmış olur.
function KartOnizleme({ kart, moduller, onModul }: { kart: KartVeri; moduller: UyeModul[]; onModul: (m: UyeModul) => void }) {
  const color = kart.kartRenk;

  const saveContact = () => {
    const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${kart.ad} ${kart.soyad}\nTITLE:${kart.unvan}\nORG:${kart.firmaAdi}\nTEL:${kart.telefon}\nEMAIL:${kart.email}\nURL:https://qontac.net/kart/${kart.id}\nEND:VCARD`;
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kart.ad}_${kart.soyad}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  type Action = { icon: string; label: string; onClick?: () => void; href?: string; bg: string; brand?: BrandKey };
  const actions: Action[] = [
    { icon: "person_add", label: "Rehbere Kaydet", onClick: saveContact, bg: "#ffd93d" },
    { icon: "handshake", label: "Tanışalım (kartta form açar)", href: `/kart/${kart.id}`, bg: "rgba(255,255,255,0.08)" },
    kart.telefon && { icon: "call", label: "Ara", href: `tel:${kart.telefon}`, bg: "#d4af37" },
    kart.email && { icon: "mail", label: "E-Posta", href: `mailto:${kart.email}`, bg: "#ff9f43" },
    kart.whatsapp && { icon: "chat", brand: "whatsapp" as BrandKey, label: "WhatsApp", href: `https://wa.me/${kart.whatsapp.replace(/\s/g, "")}`, bg: "#25d366" },
    kart.linkedin && { icon: "link", brand: "linkedin" as BrandKey, label: "LinkedIn", href: `https://${kart.linkedin.replace(/^https?:\/\//, "")}`, bg: "#0077b5" },
    kart.instagram && { icon: "photo_camera", brand: "instagram" as BrandKey, label: "Instagram", href: `https://instagram.com/${kart.instagram.replace("@", "")}`, bg: "#e1306c" },
    kart.website && { icon: "public", label: "Website", href: `https://${kart.website.replace(/^https?:\/\//, "")}`, bg: "#a29bfe" },
    { icon: "qr_code_2", label: "QR Kod (kartta açılır)", href: `/kart/${kart.id}`, bg: "#1a1a2e" },
  ].filter(Boolean) as Action[];

  return (
    <div className="rounded-2xl p-3" style={{ background: "#050816" }}>
      {/* Profil kutusu */}
      <div className="glass-card rounded-3xl p-4 mb-3 text-center relative overflow-hidden">
        {kart.kartArkaplan && (
          <>
            <div className="absolute inset-0 pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url(${kart.kartArkaplan})` }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(5,8,22,0.45) 0%, rgba(5,8,22,0.78) 100%)" }} />
          </>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}15 0%, transparent 60%)` }} />
        <div className="relative z-10 inline-block mb-2">
          <div className="w-16 h-16 rounded-full border-2 overflow-hidden flex items-center justify-center mx-auto" style={{ borderColor: `${color}50`, background: `${color}15` }}>
            {kart.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kart.avatar} alt={`${kart.ad} ${kart.soyad}`} className="w-full h-full object-cover object-center" />
            ) : (
              <span className="material-symbols-outlined text-3xl" style={{ color }}>person</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border border-background flex items-center justify-center" style={{ background: color }}>
            <span className="material-symbols-outlined text-[12px] text-black">verified</span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-base font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{kart.ad} {kart.soyad}</p>
          <p className="text-xs font-medium" style={{ color }}>{kart.unvan}</p>
          <p className="text-xs text-on-surface-variant">{kart.takim || kart.firmaAdi}</p>
          {kart.biyografi && (
            <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed border-t border-white/10 pt-2">{kart.biyografi}</p>
          )}
        </div>
      </div>

      {/* Aksiyon butonları + modül ikonları — karttaki grid'in küçük hali */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center px-1">
        {actions.map(a => {
          const cls = "w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg";
          const style = { background: a.bg, color: a.bg === "#ffd93d" ? "#000" : "#fff" };
          const inner = a.brand
            ? <BrandGlyph brand={a.brand} size={18} />
            : <span className="material-symbols-outlined text-lg">{a.icon}</span>;
          return a.href ? (
            <a key={a.label} href={a.href} target={a.href.startsWith("http") || a.href.startsWith("/") ? "_blank" : undefined} rel="noreferrer" aria-label={a.label} title={a.label} className={cls} style={style}>
              {inner}
            </a>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} aria-label={a.label} title={a.label} className={cls} style={style}>
              {inner}
            </button>
          );
        })}
        {moduller.map(m => (
          <button key={m.id} type="button" onClick={() => onModul(m)} aria-label={m.baslik} title={m.baslik}
            className="hover:scale-110 active:scale-95 transition-transform shadow-lg rounded-full">
            <ModulIkon veri={modulIkonVerisi(m)} size={44} />
          </button>
        ))}
      </div>
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
  const [aktifModul, setAktifModul] = useState<UyeModul | null>(null);
  const [kart, setKart] = useState<KartVeri | null>(null);
  // İkon galerisi açık olan modülün kimliği
  const [ikonSecilen, setIkonSecilen] = useState<string | null>(null);

  // Önizleme için kartın public halini çek (show* filtreleri uygulanmış gelir)
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/kart/${user.id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setKart(j.card); })
      .catch(() => {});
  }, [user?.id]);

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

  // Kartta görünecek hali: aktif ve içeriği dolu modüller
  const toUye = (m: Modul): UyeModul => ({ id: m.id, tip: m.tip, baslik: m.baslik, icerik: m.icerik as unknown as Record<string, unknown>, tanim: m.tanim ?? null });
  const yayindakiler = moduller.filter(m => m.aktif).map(toUye).filter(uyeModulDolu);

  return (
    <div className="max-w-[1120px] grid xl:grid-cols-[1fr_300px] gap-6 items-start">
    <div className="space-y-6">
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
                {/* İkona tıklayınca galeri açılır — üye modülünün simgesini kendi seçer. */}
                <button type="button" onClick={() => setIkonSecilen(m.id)} title="İkonu değiştir"
                  className="relative group rounded-full shrink-0">
                  <ModulIkon veri={modulIkonVerisi(m)} size={32} />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-dim border border-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary" style={{ fontSize: 11 }}>edit</span>
                  </span>
                </button>
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
                <button type="button" onClick={() => setIkonSecilen(m.id)}
                  className="mr-auto px-3 py-2 rounded-xl glass-card text-xs text-on-surface flex items-center gap-1.5 hover:bg-white/5 transition-all">
                  <span className="material-symbols-outlined text-sm">{m.icerik?.ikonAd || m.tanim?.ikonAd || "widgets"}</span>
                  İkon Seç
                </button>
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

    {/* Sağ: Kart önizlemesi — kartın public hali birebir simüle edilir */}
    <div className="glass-card rounded-2xl p-4 xl:sticky xl:top-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart Önizlemesi</h3>
        {kart && (
          <a href={`/kart/${kart.id}`} target="_blank" rel="noreferrer" title="Kartı yeni sekmede aç"
            className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </a>
        )}
      </div>
      <p className="text-xs text-on-surface-variant mb-4">Ziyaretçinin gördüğü kart. Buton ve ikonlar karttaki gibi çalışır.</p>
      {!kart ? (
        <div className="flex justify-center py-8"><span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span></div>
      ) : (
        <KartOnizleme kart={kart} moduller={yayindakiler} onModul={setAktifModul} />
      )}
    </div>

    {ikonSecilen && (() => {
      const m = moduller.find(x => x.id === ikonSecilen);
      if (!m) return null;
      // Seçim anında kaydedilir — ayrıca "Kaydet"e basmak gerekmesin.
      const uygula = (ikonAd: string) => {
        const icerik = { ...(m.icerik ?? {}), ikonAd };
        setLocal(m.id, { icerik });
        kaydet(m.id, { icerik });
      };
      const renkUygula = (patch: { butonRenk?: string; ikonRenk?: string }) => {
        const icerik = { ...(m.icerik ?? {}), ...patch };
        setLocal(m.id, { icerik });
        kaydet(m.id, { icerik });
      };
      return (
        <IkonGaleri
          secili={m.icerik?.ikonAd}
          onSec={uygula}
          onVarsayilan={() => {
            // Seçim tümüyle temizlenir; modül yeniden tanımın ikon ve renklerine döner.
            const icerik = { ...(m.icerik ?? {}), ikonAd: "", butonRenk: "", ikonRenk: "" };
            setLocal(m.id, { icerik });
            kaydet(m.id, { icerik });
          }}
          renkler={m.icerik?.ikonAd ? {
            butonRenk: m.icerik?.butonRenk || m.tanim?.butonRenk || "#d4af37",
            ikonRenk: m.icerik?.ikonRenk || m.tanim?.ikonRenk || "#000000",
            onDegis: renkUygula,
          } : undefined}
          onKapat={() => setIkonSecilen(null)}
        />
      );
    })()}

    {aktifModul && kart && (
      <UyeModulLightbox modul={aktifModul} color={kart.kartRenk} memberId={kart.id} iletisimAdi={kart.ad} onClose={() => setAktifModul(null)} />
    )}
    </div>
  );
}
