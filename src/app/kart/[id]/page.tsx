"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ModulIkon } from "@/components/ModulIkon";
import { UyeModulLightbox, uyeModulDolu, type UyeModul } from "@/components/UyeModulLightbox";
import { FirmaModulRender } from "@/components/FirmaModulRender";
import { BrandGlyph, type BrandKey } from "@/components/BrandGlyph";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";

const CARD_LOCALES: string[] = [...LOCALES];

interface Card {
  id: string;
  ad: string;
  soyad: string;
  unvan: string;
  firmaAdi: string;
  takim?: string;
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
  const [kaynak, setKaynak] = useState<"NFC" | "QR" | "LINK">("LINK");

  // Dil kaynağı: ?lang= > NEXT_LOCALE çerezi > tr
  // Ziyaret kaynağı: ?src=nfc|qr → lead kaydında kaynak olarak kullanılır
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const urlLang = sp.get("lang");
    const cookieLang = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
    const picked = urlLang || cookieLang || "tr";
    if (CARD_LOCALES.includes(picked)) setLang(picked);
    const src = sp.get("src");
    if (src === "nfc") setKaynak("NFC");
    else if (src === "qr") setKaynak("QR");
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
        body: JSON.stringify({ uyeId: card.id, ...leadForm, kaynak }),
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
      <div className="fixed top-3 left-3 z-50 flex gap-1 rounded-full px-1.5 py-1 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
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
            <p className="text-sm text-on-surface-variant">{card.takim || card.firmaAdi}</p>
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
            {moduller.map(m => <FirmaModulRender key={m.id} modul={m} color={color} memberId={card.id} firmaAdi={card.firmaAdi} />)}
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
                  value={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?src=qr` : ""}
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
