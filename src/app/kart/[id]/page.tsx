"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

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
}

type Tip = "HAKKIMIZDA" | "GALERI" | "VIDEO" | "FORM" | "HTML" | "TEK_GORSEL" | "SSS" | "HERO";
interface Modul { id: string; tip: Tip; baslik: string; icerik: Record<string, unknown> }

export default function KartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [moduller, setModuller] = useState<Modul[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [siteText, setSiteText] = useState("QONTAC");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState({ ad: "", email: "", telefon: "", sirket: "" });

  useEffect(() => {
    fetch(`/api/kart/${id}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) { setCard(j.card); setModuller(j.moduller ?? []); }
        else setCard(null);
      })
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
    fetch("/api/site-info").then(r => r.json()).then(j => { if (j.ok) setSiteText(j.logoText || "QONTAC"); }).catch(() => {});
  }, [id]);

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

  type Action = { icon: string; label: string; onClick?: () => void; href?: string; bg: string };
  const actions: Action[] = [
    { icon: "person_add", label: "Rehbere Kaydet", onClick: saveContact, bg: "#ffd93d" },
    { icon: "handshake", label: "Tanışalım", onClick: () => setShowLeadForm(true), bg: "rgba(255,255,255,0.08)" },
    card.telefon && { icon: "call", label: "Ara", href: `tel:${card.telefon}`, bg: "#00d4ff" },
    card.email && { icon: "mail", label: "E-Posta", href: `mailto:${card.email}`, bg: "#ff9f43" },
    card.whatsapp && { icon: "chat", label: "WhatsApp", href: `https://wa.me/${card.whatsapp.replace(/\s/g, "")}`, bg: "#25d366" },
    card.linkedin && { icon: "link", label: "LinkedIn", href: `https://${card.linkedin.replace(/^https?:\/\//, "")}`, bg: "#0077b5" },
    card.instagram && { icon: "photo_camera", label: "Instagram", href: `https://instagram.com/${card.instagram.replace("@", "")}`, bg: "#e1306c" },
    card.website && { icon: "public", label: "Website", href: `https://${card.website.replace(/^https?:\/\//, "")}`, bg: "#a29bfe" },
    { icon: "qr_code_2", label: "QR Kod", onClick: () => setShowQr(true), bg: "#1a1a2e" },
  ].filter(Boolean) as Action[];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#050816" }}>
      <div className="fixed top-0 left-0 w-full h-64 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}20 0%, transparent 70%)` }} />

      <div className="w-full max-w-sm mx-auto px-4 py-8 relative z-10">
        <div className="glass-card rounded-[2rem] p-6 mb-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}15 0%, transparent 60%)` }} />
          <div className="absolute inset-0 shimmer opacity-10" />
          <div className="relative inline-block mb-4">
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
          <h1 className="text-2xl font-bold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>{card.ad} {card.soyad}</h1>
          <p className="text-sm font-medium mb-1" style={{ color }}>{card.unvan}</p>
          <p className="text-sm text-on-surface-variant">{card.firmaAdi}</p>
          {card.biyografi && (
            <p className="text-xs text-on-surface-variant mt-3 leading-relaxed border-t border-white/10 pt-3">{card.biyografi}</p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-x-4 gap-y-5 justify-items-center mb-5 px-2">
          {actions.map(a => {
            const cls = "w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform shadow-lg";
            const style = { background: a.bg, color: a.bg === "#ffd93d" ? "#000" : "#fff" };
            return a.href ? (
              <a key={a.label} href={a.href} target={a.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={a.label} title={a.label} className={cls} style={style}>
                <span className="material-symbols-outlined text-xl">{a.icon}</span>
              </a>
            ) : (
              <button key={a.label} onClick={a.onClick} aria-label={a.label} title={a.label} className={cls} style={style}>
                <span className="material-symbols-outlined text-xl">{a.icon}</span>
              </button>
            );
          })}
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

function GaleriSlider({ color, gorseller }: { baslik?: string; color: string; gorseller: { url: string; baslik?: string; aciklama?: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

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
            <a
              key={i}
              href={g.url}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 w-full snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.baslik ?? ""} className="w-full aspect-square object-cover rounded-xl" />
              {g.baslik && <p className="text-sm text-on-surface mt-2 font-medium">{g.baslik}</p>}
              {g.aciklama && <p className="text-xs text-on-surface-variant mt-0.5">{g.aciklama}</p>}
            </a>
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
