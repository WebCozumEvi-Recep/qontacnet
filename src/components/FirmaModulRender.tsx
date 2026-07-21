"use client";
// Firma şablonu modüllerinin kart üzerindeki içerik görünümü.
// Public kart sayfası ve üye panelindeki Firma Şablonu önizlemesi aynı bileşeni kullanır.
import { useState } from "react";
import { GaleriSlider, SssAkordiyon, youtubeEmbed } from "@/components/UyeModulLightbox";

export type FirmaModulTip = "HAKKIMIZDA" | "GALERI" | "VIDEO" | "FORM" | "HTML" | "TEK_GORSEL" | "SSS" | "HERO";
export interface FirmaModulVeri { id: string; tip: FirmaModulTip; baslik: string; icerik: Record<string, unknown> }

export function FirmaModulRender({ modul, color, memberId, iletisimAdi }: { modul: FirmaModulVeri; color: string; memberId: string; iletisimAdi: string }) {
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
    return <FormModul modul={modul} color={color} memberId={memberId} iletisimAdi={iletisimAdi} />;
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
function FormModul({ modul, color, memberId, iletisimAdi }: { modul: FirmaModulVeri; color: string; memberId: string; iletisimAdi: string }) {
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
        <p className="text-sm text-on-surface-variant mt-1">{iletisimAdi} en kısa sürede sizinle iletişime geçecek.</p>
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
