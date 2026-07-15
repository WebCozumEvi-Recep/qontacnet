"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ModulIkon } from "@/components/ModulIkon";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";

const CARD_LOCALES: string[] = [...LOCALES];

interface Card {
  id: string;
  ad: string;
  soyad: string;
  unvan: string;
  firmaAdi: string;
  kartRenk: string;
  telefon: string;
  email: string;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  website: string;
  biyografi: string;
  avatar?: string;
  kartArkaplan?: string;
}

type Tip = "HAKKIMIZDA" | "GALERI" | "VIDEO" | "FORM" | "HTML" | "TEK_GORSEL" | "SSS" | "HERO";
interface Modul { id: string; tip: Tip; baslik: string; icerik: Record<string, unknown> }

// Sosyal ağ marka logoları (Material Symbols'un jenerik ikonları yerine).
type BrandKey = "whatsapp" | "linkedin" | "instagram";
const BRAND_PATHS: Record<BrandKey, string> = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.946c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.006c6.585 0 11.946-5.359 11.949-11.945a11.821 11.821 0 00-3.481-8.4z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
};

function BrandGlyph({ brand }: { brand: BrandKey }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d={BRAND_PATHS[brand]} />
    </svg>
  );
}

type UyeTip = "GALERI" | "TEXT" | "VIDEO" | "LINK" | "GORSEL" | "FORM" | "TEK_GORSEL" | "HTML" | "SSS" | "HERO" | "BASVURU";
interface UyeModul { id: string; tip: UyeTip; baslik: string; icerik: Record<string, unknown>; tanim?: { ikon: string; ikonAd: string; butonRenk: string; ikonRenk: string } | null }

function uyeModulDolu(m: UyeModul): boolean {
  const ic = m.icerik;
  if (m.tip === "TEXT") return Boolean(ic.metin || ic.gorsel);
  if (m.tip === "GALERI") return Array.isArray(ic.gorseller) && ic.gorseller.length > 0;
  if (m.tip === "LINK") return Boolean(ic.url);
  if (m.tip === "GORSEL") return Boolean(ic.gorsel);
  if (m.tip === "FORM" || m.tip === "BASVURU") return true;
  if (m.tip === "TEK_GORSEL") return Boolean(ic.gorsel);
  if (m.tip === "HTML") return Boolean(typeof ic.kod === "string" && ic.kod.trim());
  if (m.tip === "SSS") return Array.isArray(ic.sorular) && ic.sorular.length > 0;
  if (m.tip === "HERO") return Boolean(ic.arkaplan || ic.html);
  return Boolean(ic.videoUrl);
}

function disLink(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function KartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [moduller, setModuller] = useState<Modul[]>([]);
  const [uyeModuller, setUyeModuller] = useState<UyeModul[]>([]);
  const [aktifModul, setAktifModul] = useState<UyeModul | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [siteText, setSiteText] = useState("QONTAC");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState({ ad: "", email: "", telefon: "", sirket: "" });
  const [lang, setLang] = useState<string>("tr");

  // Dil kaynağı: ?lang= > NEXT_LOCALE çerezi > tr
  useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const cookieLang = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
    const picked = urlLang || cookieLang || "tr";
    if (CARD_LOCALES.includes(picked)) setLang(picked);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kart/${id}?lang=${lang}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) { setCard(j.card); setModuller(j.moduller ?? []); setUyeModuller(j.uyeModuller ?? []); }
        else setCard(null);
      })
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
    fetch("/api/site-info").then(r => r.json()).then(j => { if (j.ok) setSiteText(j.logoText || "QONTAC"); }).catch(() => {});
  }, [id, lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050816" }}>
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "#050816" }}>
        <span className="material-symbols-outlined text-on-surface-variant text-6xl">sentiment_dissatisfied</span>
        <h1 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kart bulunamadı</h1>
        <p className="text-sm text-on-surface-variant">Bu kart pasif veya mevcut değil.</p>
        <Link href="/" className="text-primary text-sm hover:underline mt-2">QONTAC ana sayfa →</Link>
      </div>
    );
  }

  const color = card.kartRenk;

  const saveContact = () => {
    const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${card.ad} ${card.soyad}\nTITLE:${card.unvan}\nORG:${card.firmaAdi}\nTEL:${card.telefon}\nEMAIL:${card.email}\nURL:https://qontac.net/kart/${card.id}\nEND:VCARD`;
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.ad}_${card.soyad}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError("");
    setLeadLoading(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uyeId: card.id, ...leadForm }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setLeadSaved(true);
      setTimeout(() => { setLeadSaved(false); setShowLeadForm(false); setLeadForm({ ad: "", email: "", telefon: "", sirket: "" }); }, 2500);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally {
      setLeadLoading(false);
    }
  };

  type Action = { icon: string; label: string; onClick?: () => void; href?: string; bg: string; brand?: BrandKey };
  const actions: Action[] = [
    { icon: "person_add", label: "Rehbere Kaydet", onClick: saveContact, bg: "#ffd93d" },
    { icon: "handshake", label: "Tanışalım", onClick: () => setShowLeadForm(true), bg: "rgba(255,255,255,0.08)" },
    card.telefon && { icon: "call", label: "Ara", href: `tel:${card.telefon}`, bg: "#d4af37" },
    card.email && { icon: "mail", label: "E-Posta", href: `mailto:${card.email}`, bg: "#ff9f43" },
    card.whatsapp && { icon: "chat", brand: "whatsapp", label: "WhatsApp", href: `https://wa.me/${card.whatsapp.replace(/\s/g, "")}`, bg: "#25d366" },
    card.linkedin && { icon: "link", brand: "linkedin", label: "LinkedIn", href: `https://${card.linkedin.replace(/^https?:\/\//, "")}`, bg: "#0077b5" },
    card.instagram && { icon: "photo_camera", brand: "instagram", label: "Instagram", href: `https://instagram.com/${card.instagram.replace("@", "")}`, bg: "#e1306c" },
    card.website && { icon: "public", label: "Website", href: `https://${card.website.replace(/^https?:\/\//, "")}`, bg: "#a29bfe" },
    { icon: "qr_code_2", label: "QR Kod", onClick: () => setShowQr(true), bg: "#1a1a2e" },
  ].filter(Boolean) as Action[];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#050816" }}>
      <div className="fixed top-0 left-0 w-full h-64 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}20 0%, transparent 70%)` }} />

      {/* Dil seçici */}
      <div className="fixed top-3 right-3 z-50 flex gap-1 rounded-full px-1.5 py-1 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
        {CARD_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              setLang(l);
              const u = new URL(window.location.href);
              u.searchParams.set("lang", l);
              window.history.replaceState({}, "", u);
            }}
            title={LOCALE_LABELS[l as keyof typeof LOCALE_LABELS].native}
            className={`w-7 h-7 rounded-full text-sm leading-none transition-all ${lang === l ? "ring-2 ring-white/70 scale-110" : "opacity-60 hover:opacity-100"}`}
          >
            {LOCALE_LABELS[l as keyof typeof LOCALE_LABELS].flag}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm mx-auto px-4 py-8 relative z-10">
        <div className="glass-card rounded-[2rem] p-6 mb-4 text-center relative overflow-hidden">
          {card.kartArkaplan && (
            <>
              <div className="absolute inset-0 pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url(${card.kartArkaplan})` }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(5,8,22,0.45) 0%, rgba(5,8,22,0.78) 100%)" }} />
            </>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}15 0%, transparent 60%)` }} />
          <div className="absolute inset-0 shimmer opacity-10" />
          <div className="relative z-10 inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center mx-auto" style={{ borderColor: `${color}50`, background: `${color}15` }}>
              {card.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar} alt={`${card.ad} ${card.soyad}`} className="w-full h-full object-cover object-center" />
              ) : (
                <span className="material-symbols-outlined text-5xl" style={{ color }}>person</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background flex items-center justify-center" style={{ background: color }}>
              <span className="material-symbols-outlined text-sm text-black">verified</span>
            </div>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>{card.ad} {card.soyad}</h1>
            <p className="text-sm font-medium mb-1" style={{ color }}>{card.unvan}</p>
            <p className="text-sm text-on-surface-variant">{card.firmaAdi}</p>
            {card.biyografi && (
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed border-t border-white/10 pt-3">{card.biyografi}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-4 gap-y-5 justify-items-center mb-5 px-2">
          {actions.map(a => {
            const cls = "w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform shadow-lg";
            const style = { background: a.bg, color: a.bg === "#ffd93d" ? "#000" : "#fff" };
            const inner = a.brand
              ? <BrandGlyph brand={a.brand} />
              : <span className="material-symbols-outlined text-xl">{a.icon}</span>;
            return a.href ? (
              <a key={a.label} href={a.href} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={a.label} title={a.label} className={cls} style={style}>
                {inner}
              </a>
            ) : (
              <button key={a.label} onClick={a.onClick} aria-label={a.label} title={a.label} className={cls} style={style}>
                {inner}
              </button>
            );
          })}
          {uyeModuller.filter(uyeModulDolu).map(m => (
            <button key={m.id} onClick={() => setAktifModul(m)} aria-label={m.baslik} title={m.baslik}
              className="hover:scale-110 active:scale-95 transition-transform shadow-lg rounded-full">
              <ModulIkon veri={m.tanim ?? {}} size={56} />
            </button>
          ))}
        </div>

        {moduller.length > 0 && (
          <div className="space-y-4 mb-6">
            {moduller.map(m => <ModulRender key={m.id} modul={m} color={color} memberId={card.id} firmaAdi={card.firmaAdi} />)}
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-all">
            <span className="font-bold tracking-widest" style={{ fontFamily: "Sora, sans-serif" }}>{siteText}</span>
            <span>·</span><span>Dijital Kartvizit Oluştur</span>
          </Link>
        </div>
      </div>

      {aktifModul && (
        <UyeModulLightbox modul={aktifModul} color={color} memberId={card.id} firmaAdi={card.firmaAdi} onClose={() => setAktifModul(null)} />
      )}

      {showQr && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6" onClick={() => setShowQr(false)}>
          <div className="rounded-3xl p-6 max-w-sm w-full text-center" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Kartı paylaş</p>
              <button onClick={() => setShowQr(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex justify-center">
              <div className="relative inline-flex items-center justify-center p-4 rounded-2xl border border-white/10" style={{ background: "#0f1321" }}>
                <QRCodeSVG
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  size={220}
                  bgColor="#0f1321"
                  fgColor={color}
                  level="H"
                  style={{ borderRadius: 8 }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div style={{ background: "rgba(15,19,33,0.82)", borderRadius: 8, padding: "4px 12px", backdropFilter: "blur(2px)" }}>
                    <span style={{ fontFamily: "'Dancing Script', 'Pacifico', cursive", fontSize: 17, color, letterSpacing: 0.5, whiteSpace: "nowrap", textShadow: `0 0 8px ${color}99` }}>
                      {card.ad} {card.soyad}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-bold text-on-surface mt-4">{card.ad} {card.soyad}</p>
            <p className="text-xs text-on-surface-variant">{card.unvan} · {card.firmaAdi}</p>
            <p className="text-[11px] text-on-surface-variant/70 mt-3">Bu QR kodu telefonunuzla okutarak kartı arkadaşlarınızla paylaşabilirsiniz.</p>
          </div>
        </div>
      )}

      {showLeadForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-0" onClick={() => setShowLeadForm(false)}>
          <div className="w-full max-w-sm rounded-t-3xl p-6 pb-8" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderBottom: "none" }} onClick={e => e.stopPropagation()}>
            {leadSaved ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-tertiary text-5xl block mb-3">check_circle</span>
                <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Bilgileriniz iletildi!</p>
                <p className="text-sm text-on-surface-variant mt-1">{card.ad} en kısa sürede sizinle iletişime geçecek.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Tanışalım</h3>
                    <p className="text-xs text-on-surface-variant">{card.ad} ile iletişim bilgilerinizi paylaşın</p>
                  </div>
                  <button onClick={() => setShowLeadForm(false)} className="text-on-surface-variant hover:text-on-surface transition-all">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  {[
                    { key: "ad", label: "Ad Soyad", placeholder: "Adınız", type: "text", required: true },
                    { key: "sirket", label: "Şirket", placeholder: "Çalıştığınız şirket", type: "text", required: false },
                    { key: "email", label: "E-Posta", placeholder: "email@example.com", type: "email", required: true },
                    { key: "telefon", label: "Telefon", placeholder: "+90 5xx xxx xx xx", type: "tel", required: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-on-surface-variant mb-1 block">{f.label}</label>
                      <input type={f.type} required={f.required}
                        value={leadForm[f.key as keyof typeof leadForm]}
                        onChange={e => setLeadForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all" />
                    </div>
                  ))}
                  {leadError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <span className="material-symbols-outlined text-sm">error</span>{leadError}
                    </div>
                  )}
                  <button type="submit" disabled={leadLoading}
                    className="w-full py-3.5 font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: color, color: "#000" }}>
                    {leadLoading ? (<><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Gönderiliyor...</>) : "Gönder"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function ModulRender({ modul, color, memberId, firmaAdi }: { modul: Modul; color: string; memberId: string; firmaAdi: string }) {
  if (modul.tip === "HAKKIMIZDA") {
    const metin = String(modul.icerik.metin ?? "");
    const gorsel = String(modul.icerik.gorsel ?? "");
    if (!metin && !gorsel) return null;
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        {gorsel && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gorsel} alt={modul.baslik} className="w-full h-40 object-cover" />
        )}
        <div className="p-5">
          <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">{metin}</p>
        </div>
      </div>
    );
  }
  if (modul.tip === "GALERI") {
    const gorseller = (Array.isArray(modul.icerik.gorseller) ? modul.icerik.gorseller : []) as { url: string; baslik?: string; aciklama?: string }[];
    if (gorseller.length === 0) return null;
    return <GaleriSlider baslik={modul.baslik} color={color} gorseller={gorseller} />;
  }
  if (modul.tip === "VIDEO") {
    const videoUrl = String(modul.icerik.videoUrl ?? "");
    const aciklama = String(modul.icerik.aciklama ?? "");
    const embed = videoUrl ? youtubeEmbed(videoUrl) : null;
    if (!embed) return null;
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="aspect-video">
          <iframe src={embed} className="w-full h-full" allowFullScreen title={modul.baslik} />
        </div>
        {aciklama && <p className="text-xs text-on-surface-variant p-4">{aciklama}</p>}
      </div>
    );
  }
  if (modul.tip === "FORM") {
    return <FormModul modul={modul} color={color} memberId={memberId} firmaAdi={firmaAdi} />;
  }
  if (modul.tip === "HTML") {
    const kod = String(modul.icerik.kod ?? "");
    if (!kod.trim()) return null;
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="text-sm text-on-surface" dangerouslySetInnerHTML={{ __html: kod }} />
      </div>
    );
  }
  if (modul.tip === "TEK_GORSEL") {
    const url = String(modul.icerik.url ?? "");
    const baslik = String(modul.icerik.baslik ?? "");
    const link = String(modul.icerik.link ?? "");
    if (!url) return null;
    const inner = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={baslik} className="w-full object-cover" />
        {baslik && <p className="text-sm text-on-surface p-4">{baslik}</p>}
      </>
    );
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        {link ? <a href={link} target="_blank" rel="noreferrer" className="block">{inner}</a> : inner}
      </div>
    );
  }
  if (modul.tip === "SSS") {
    const sorular = (Array.isArray(modul.icerik.sorular) ? modul.icerik.sorular : []) as { soru: string; cevap: string }[];
    if (sorular.length === 0) return null;
    return <SssAkordiyon baslik={modul.baslik} color={color} sorular={sorular} />;
  }
  if (modul.tip === "HERO") {
    const arkaplan = String(modul.icerik.arkaplan ?? "");
    const html = String(modul.icerik.html ?? "");
    const hizalama = String(modul.icerik.hizalama ?? "center");
    return (
      <div className="rounded-2xl overflow-hidden relative min-h-[200px] flex items-center"
        style={{ background: arkaplan ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${arkaplan}) center/cover` : "rgba(255,255,255,0.05)" }}>
        <div className="p-6 w-full text-white hero-content" style={{ textAlign: hizalama as "left" | "center" | "right" }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  return null;
}

// Üye modülü lightbox içinde gösterir (text→kopyala, galeri→slider, video→embed)
function UyeModulLightbox({ modul, color, memberId, firmaAdi, onClose }: { modul: UyeModul; color: string; memberId: string; firmaAdi: string; onClose: () => void }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const ic = modul.icerik as {
    metin?: string; gorsel?: string; videoUrl?: string; aciklama?: string; url?: string; butonAdi?: string; gonderButon?: string;
    gorseller?: { url: string; baslik?: string; aciklama?: string }[];
    baslik?: string; link?: string; kod?: string; sorular?: { soru: string; cevap: string }[];
    arkaplan?: string; html?: string; hizalama?: string;
  };

  const kopyala = (metin: string) => {
    navigator.clipboard.writeText(metin).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }).catch(() => {});
  };

  let body: React.ReactNode = null;
  if (modul.tip === "TEXT") {
    const metin = String(ic.metin ?? "");
    body = (
      <div className="space-y-3">
        {ic.gorsel && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic.gorsel} alt={modul.baslik} className="w-full rounded-xl object-cover" />
        )}
        {metin && (
          <button type="button" onClick={() => kopyala(metin)}
            className="w-full text-left bg-surface-dim border border-white/10 rounded-xl px-4 py-3 hover:border-white/25 transition-all">
            <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed">{metin}</p>
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: kopyalandi ? "#25d366" : undefined }}>
              <span className="material-symbols-outlined text-sm">{kopyalandi ? "check" : "content_copy"}</span>
              {kopyalandi ? "Kopyalandı" : "Kopyalamak için dokun"}
            </p>
          </button>
        )}
      </div>
    );
  } else if (modul.tip === "GALERI") {
    const gorseller = Array.isArray(ic.gorseller) ? ic.gorseller : [];
    body = <GaleriSlider color={color} gorseller={gorseller} />;
  } else if (modul.tip === "LINK") {
    const url = String(ic.url ?? "");
    body = (
      <div className="space-y-4 text-center">
        {ic.aciklama && <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">{ic.aciklama}</p>}
        {url && (
          <a href={disLink(url)} target="_blank" rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ background: color, color: "#000" }}>
            <span className="material-symbols-outlined text-base">open_in_new</span>
            {ic.butonAdi?.trim() || "Bağlantıyı Aç"}
          </a>
        )}
      </div>
    );
  } else if (modul.tip === "VIDEO") {
    const embed = ic.videoUrl ? youtubeEmbed(String(ic.videoUrl)) : null;
    body = embed ? (
      <div className="space-y-2">
        <div className="aspect-video rounded-xl overflow-hidden">
          <iframe src={embed} className="w-full h-full" allowFullScreen title={modul.baslik} />
        </div>
        {ic.aciklama && <p className="text-xs text-on-surface-variant">{ic.aciklama}</p>}
      </div>
    ) : <p className="text-sm text-on-surface-variant">Geçersiz video bağlantısı.</p>;
  } else if (modul.tip === "GORSEL") {
    const url = String(ic.url ?? "");
    body = (
      <div className="space-y-3">
        {ic.gorsel && (
          url ? (
            <a href={disLink(url)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ic.gorsel} alt={modul.baslik} className="w-full rounded-xl object-cover" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ic.gorsel} alt={modul.baslik} className="w-full rounded-xl object-cover" />
          )
        )}
        {ic.aciklama && <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed text-center">{ic.aciklama}</p>}
      </div>
    );
  } else if (modul.tip === "FORM") {
    body = <UyeFormModul memberId={memberId} modulId={modul.id} aciklama={String(ic.aciklama ?? "")} gonderButon={String(ic.gonderButon ?? "")} color={color} firmaAdi={firmaAdi} />;
  } else if (modul.tip === "BASVURU") {
    body = <UyeBasvuruModul memberId={memberId} modulId={modul.id} aciklama={String(ic.aciklama ?? "")} gonderButon={String(ic.gonderButon ?? "")} color={color} firmaAdi={firmaAdi} />;
  } else if (modul.tip === "TEK_GORSEL") {
    const link = String(ic.link ?? "");
    const inner = ic.gorsel ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ic.gorsel} alt={modul.baslik} className="w-full rounded-xl object-cover" />
    ) : null;
    body = (
      <div className="space-y-3">
        {link && inner ? <a href={disLink(link)} target="_blank" rel="noreferrer">{inner}</a> : inner}
        {ic.baslik && <p className="text-sm text-on-surface-variant text-center">{ic.baslik}</p>}
      </div>
    );
  } else if (modul.tip === "HTML") {
    body = <div className="text-sm text-on-surface" dangerouslySetInnerHTML={{ __html: String(ic.kod ?? "") }} />;
  } else if (modul.tip === "SSS") {
    const sorular = Array.isArray(ic.sorular) ? ic.sorular : [];
    body = <SssAkordiyon color={color} sorular={sorular} />;
  } else if (modul.tip === "HERO") {
    const arkaplan = String(ic.arkaplan ?? "");
    const html = String(ic.html ?? "");
    const hizalama = String(ic.hizalama ?? "center");
    body = (
      <div className="rounded-2xl overflow-hidden relative min-h-[180px] flex items-center"
        style={{ background: arkaplan ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${arkaplan}) center/cover` : "rgba(255,255,255,0.05)" }}>
        <div className="p-5 w-full text-white hero-content" style={{ textAlign: hizalama as "left" | "center" | "right" }}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-5 max-h-[85vh] overflow-auto"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ModulIkon veri={modul.tanim ?? {}} size={28} />
            <h3 className="text-sm font-semibold text-on-surface truncate" style={{ fontFamily: "Sora, sans-serif" }}>{modul.baslik}</h3>
          </div>
          <button onClick={onClose} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-xs flex-shrink-0">
            <span className="material-symbols-outlined">close</span>Kapat
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}

// Üye kartındaki iletişim / lead formu — misafirden veri toplar
function UyeFormModul({ memberId, modulId, aciklama, gonderButon, color, firmaAdi }: { memberId: string; modulId: string; aciklama: string; gonderButon: string; color: string; firmaAdi: string }) {
  const [form, setForm] = useState({ ad: "", email: "", telefon: "", mesaj: "" });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(""); setGonderiliyor(true);
    try {
      const r = await fetch("/api/kart/basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, modulId, ...form }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "Gönderilemedi.");
      setGonderildi(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally { setGonderiliyor(false); }
  };

  if (gonderildi) {
    return (
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-tertiary text-5xl block mb-3">check_circle</span>
        <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>İletildi!</p>
        <p className="text-sm text-on-surface-variant mt-1">{firmaAdi} en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );
  }

  return (
    <div>
      {aciklama && <p className="text-xs text-on-surface-variant mb-3">{aciklama}</p>}
      <form onSubmit={onSubmit} className="space-y-2.5">
        <input value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required placeholder="Ad Soyad"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="E-posta"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} type="tel" placeholder="Telefon"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <textarea value={form.mesaj} onChange={e => setForm({ ...form, mesaj: e.target.value })} rows={3} placeholder="Mesaj"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        {hata && <p className="text-xs text-red-400">{hata}</p>}
        <button type="submit" disabled={gonderiliyor}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: color, color: "#000" }}>
          {gonderiliyor ? "Gönderiliyor..." : (gonderButon.trim() || "Gönder")}
        </button>
      </form>
    </div>
  );
}

// Başvuru formu — Ad Soyad, Telefon, E-posta, Şehir toplar; şehir mesaja katılır
function UyeBasvuruModul({ memberId, modulId, aciklama, gonderButon, color, firmaAdi }: { memberId: string; modulId: string; aciklama: string; gonderButon: string; color: string; firmaAdi: string }) {
  const [form, setForm] = useState({ ad: "", email: "", telefon: "", sehir: "" });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(""); setGonderiliyor(true);
    try {
      const r = await fetch("/api/kart/basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId, modulId,
          ad: form.ad, email: form.email, telefon: form.telefon,
          mesaj: form.sehir ? `Şehir: ${form.sehir}` : "",
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "Gönderilemedi.");
      setGonderildi(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally { setGonderiliyor(false); }
  };

  if (gonderildi) {
    return (
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-tertiary text-5xl block mb-3">check_circle</span>
        <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Başvurun alındı!</p>
        <p className="text-sm text-on-surface-variant mt-1">{firmaAdi} en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );
  }

  return (
    <div>
      {aciklama && <p className="text-xs text-on-surface-variant mb-3">{aciklama}</p>}
      <form onSubmit={onSubmit} className="space-y-2.5">
        <input value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required placeholder="Ad Soyad"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} type="tel" required placeholder="Telefon"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="E-posta"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.sehir} onChange={e => setForm({ ...form, sehir: e.target.value })} placeholder="Şehir"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        {hata && <p className="text-xs text-red-400">{hata}</p>}
        <button type="submit" disabled={gonderiliyor}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: color, color: "#000" }}>
          {gonderiliyor ? "Gönderiliyor..." : (gonderButon.trim() || "Başvur")}
        </button>
      </form>
    </div>
  );
}

function SssAkordiyon({ color, sorular }: { baslik?: string; color: string; sorular: { soru: string; cevap: string }[] }) {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="space-y-2">
        {sorular.map((s, i) => {
          const open = acik === i;
          return (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setAcik(open ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-white/5">
                <span className="text-sm font-medium text-on-surface flex-1">{s.soru}</span>
                <span className="material-symbols-outlined text-base transition-transform" style={{ transform: open ? "rotate(180deg)" : "none", color }}>expand_more</span>
              </button>
              {open && s.cevap && (
                <div className="px-3 pb-3 text-xs text-on-surface-variant whitespace-pre-line leading-relaxed">{s.cevap}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Gorsel = { url: string; baslik?: string; aciklama?: string };

// Tam ekran, kaydırılabilir görüntü lightbox'ı
function GoruntuLightbox({ gorseller, start, color, onClose }: { gorseller: Gorsel[]; start: number; color: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(start);

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = start * ref.current.clientWidth;
  }, [start]);

  const goto = (i: number) => {
    if (!ref.current) return;
    const n = Math.max(0, Math.min(gorseller.length - 1, i));
    ref.current.scrollTo({ left: n * ref.current.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goto(idx + 1);
      else if (e.key === "ArrowLeft") goto(idx - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    if (!ref.current) return;
    setIdx(Math.round(ref.current.scrollLeft / ref.current.clientWidth));
  };
  const aktif = gorseller[idx];

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col" onClick={onClose}>
      <button onClick={onClose} aria-label="Kapat"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
        <span className="material-symbols-outlined">close</span>
      </button>
      <div ref={ref} onScroll={onScroll} onClick={e => e.stopPropagation()}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {gorseller.map((g, i) => (
          <div key={i} className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={g.baslik ?? ""} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        ))}
      </div>
      {gorseller.length > 1 && idx > 0 && (
        <button onClick={e => { e.stopPropagation(); goto(idx - 1); }} aria-label="Önceki"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
        </button>
      )}
      {gorseller.length > 1 && idx < gorseller.length - 1 && (
        <button onClick={e => { e.stopPropagation(); goto(idx + 1); }} aria-label="Sonraki"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-2xl">chevron_right</span>
        </button>
      )}
      <div className="pb-6 px-4 text-center" onClick={e => e.stopPropagation()}>
        {aktif?.baslik && <p className="text-sm text-white font-medium">{aktif.baslik}</p>}
        {aktif?.aciklama && <p className="text-xs text-white/60 mt-0.5">{aktif.aciklama}</p>}
        {gorseller.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {gorseller.map((_, i) => (
              <button key={i} onClick={() => goto(i)} aria-label={`Görsel ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === idx ? 18 : 6, background: i === idx ? color : "rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GaleriSlider({ color, gorseller }: { baslik?: string; color: string; gorseller: { url: string; baslik?: string; aciklama?: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const onScroll = () => {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    setIdx(Math.round(ref.current.scrollLeft / w));
  };

  const goto = (i: number) => {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    ref.current.scrollTo({ left: i * w, behavior: "smooth" });
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="relative -mx-2">
        <div
          ref={ref}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-2 pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {gorseller.map((g, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="flex-shrink-0 w-full snap-center text-left cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.baslik ?? ""} className="w-full aspect-square object-cover rounded-xl" />
              {g.baslik && <p className="text-sm text-on-surface mt-2 font-medium">{g.baslik}</p>}
              {g.aciklama && <p className="text-xs text-on-surface-variant mt-0.5">{g.aciklama}</p>}
            </button>
          ))}
        </div>
        {gorseller.length > 1 && idx > 0 && (
          <button
            onClick={() => goto(idx - 1)}
            aria-label="Önceki"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
        )}
        {gorseller.length > 1 && idx < gorseller.length - 1 && (
          <button
            onClick={() => goto(idx + 1)}
            aria-label="Sonraki"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        )}
      </div>
      {gorseller.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {gorseller.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              aria-label={`Görsel ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === idx ? 18 : 6,
                background: i === idx ? color : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      )}
      {lightboxIdx !== null && (
        <GoruntuLightbox gorseller={gorseller} start={lightboxIdx} color={color} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
}

function FormModul({ modul, color, memberId, firmaAdi }: { modul: Modul; color: string; memberId: string; firmaAdi: string }) {
  const aciklama = String(modul.icerik.aciklama ?? "");
  const gonderButon = String(modul.icerik.gonderButon ?? "Gönder");
  const [form, setForm] = useState({ ad: "", email: "", telefon: "", mesaj: "" });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(""); setGonderiliyor(true);
    try {
      const r = await fetch("/api/kart/basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, modulId: modul.id, ...form }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error ?? "Gönderilemedi.");
      setGonderildi(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally { setGonderiliyor(false); }
  };

  if (gonderildi) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <span className="material-symbols-outlined text-tertiary text-5xl block mb-3">check_circle</span>
        <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Başvurunuz iletildi!</p>
        <p className="text-sm text-on-surface-variant mt-1">{firmaAdi} en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      {aciklama && <p className="text-xs text-on-surface-variant mb-3">{aciklama}</p>}
      <form onSubmit={onSubmit} className="space-y-2.5">
        <input value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required placeholder="Ad Soyad"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="E-posta"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} type="tel" placeholder="Telefon"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        <textarea value={form.mesaj} onChange={e => setForm({ ...form, mesaj: e.target.value })} rows={3} placeholder="Mesaj"
          className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary" />
        {hata && <p className="text-xs text-red-400">{hata}</p>}
        <button type="submit" disabled={gonderiliyor}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: color, color: "#000" }}>
          {gonderiliyor ? "Gönderiliyor..." : gonderButon}
        </button>
      </form>
    </div>
  );
}
