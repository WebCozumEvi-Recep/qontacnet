"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";

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
}

export default function KartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState({ ad: "", email: "", telefon: "", sirket: "" });

  useEffect(() => {
    fetch(`/api/kart/${id}`)
      .then(r => r.json())
      .then(j => setCard(j.ok ? j.card : null))
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
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

  const links = [
    card.whatsapp && { icon: "chat", label: "WhatsApp ile Yaz", href: `https://wa.me/${card.whatsapp.replace(/\s/g, "")}`, color: "#25d366" },
    card.linkedin && { icon: "link", label: "LinkedIn", href: `https://${card.linkedin.replace(/^https?:\/\//, "")}`, color: "#0077b5" },
    card.instagram && { icon: "photo_camera", label: "Instagram", href: `https://instagram.com/${card.instagram.replace("@", "")}`, color: "#e1306c" },
    card.website && { icon: "public", label: "Website", href: `https://${card.website.replace(/^https?:\/\//, "")}`, color: "#00d4ff" },
  ].filter(Boolean) as { icon: string; label: string; href: string; color: string }[];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#050816" }}>
      <div className="fixed top-0 left-0 w-full h-64 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}20 0%, transparent 70%)` }} />

      <div className="w-full max-w-sm mx-auto px-4 py-8 relative z-10">
        <div className="glass-card rounded-[2rem] p-6 mb-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}15 0%, transparent 60%)` }} />
          <div className="absolute inset-0 shimmer opacity-10" />
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto" style={{ borderColor: `${color}50`, background: `${color}15` }}>
              <span className="material-symbols-outlined text-5xl" style={{ color }}>person</span>
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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={saveContact}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: color, color: "#000" }}>
            <span className="material-symbols-outlined text-base">contact_page</span>Kaydet
          </button>
          <button onClick={() => setShowLeadForm(true)}
            className="flex items-center justify-center gap-2 py-3.5 glass-card rounded-2xl text-on-surface font-semibold text-sm hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-base">handshake</span>Tanış
          </button>
        </div>

        {card.telefon && (
          <a href={`tel:${card.telefon}`} className="w-full flex items-center gap-3 py-4 px-5 glass-card rounded-2xl mb-3 hover:bg-white/5 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <span className="material-symbols-outlined text-xl" style={{ color }}>call</span>
            </div>
            <div><p className="text-xs text-on-surface-variant">Ara</p><p className="text-sm text-on-surface font-medium">{card.telefon}</p></div>
            <span className="material-symbols-outlined text-on-surface-variant/40 ml-auto group-hover:text-primary transition-all">chevron_right</span>
          </a>
        )}

        {card.email && (
          <a href={`mailto:${card.email}`} className="w-full flex items-center gap-3 py-4 px-5 glass-card rounded-2xl mb-4 hover:bg-white/5 transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
              <span className="material-symbols-outlined text-xl" style={{ color }}>mail</span>
            </div>
            <div><p className="text-xs text-on-surface-variant">E-Posta</p><p className="text-sm text-on-surface font-medium">{card.email}</p></div>
            <span className="material-symbols-outlined text-on-surface-variant/40 ml-auto group-hover:text-primary transition-all">chevron_right</span>
          </a>
        )}

        {links.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-4">
            <p className="text-xs text-on-surface-variant mb-3">Sosyal & Web</p>
            <div className="space-y-2">
              {links.map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5 transition-all group">
                  <span className="material-symbols-outlined text-base" style={{ color: l.color }}>{l.icon}</span>
                  <span className="text-sm text-on-surface flex-1">{l.label}</span>
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-sm group-hover:text-primary transition-all">open_in_new</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-all">
            <span className="font-bold tracking-widest" style={{ fontFamily: "Sora, sans-serif" }}>QONTAC</span>
            <span>·</span><span>Dijital Kartvizit Oluştur</span>
          </Link>
        </div>
      </div>

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
