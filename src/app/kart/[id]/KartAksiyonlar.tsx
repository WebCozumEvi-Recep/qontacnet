"use client";
// Kart üzerindeki etkileşimli bölüm: aksiyon butonları, rehbere kaydetme (vCard),
// QR paylaşımı, "Tanışalım" lead formu ve üye modül popup'ları.
// Kartın statik gövdesi sunucuda render edilir; burası yalnızca etkileşim taşır.
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ModulIkon } from "@/components/ModulIkon";
import { UyeModulLightbox, uyeModulDolu, type UyeModul } from "@/components/UyeModulLightbox";
import { BrandGlyph, type BrandKey } from "@/components/BrandGlyph";
import type { KartBilgisi, KartKaynak } from "@/lib/kart-data";

/**
 * Rehbere kaydedilecek vCard'ı üretir.
 *
 * `N` (yapısal ad) alanı olmadan iOS/macOS Kişiler kaydı ORG'u isim sanıyordu;
 * bu yüzden hem `N` hem `FN` yazılır ve kişi "Ad Soyad" olarak görünür.
 * Kurum alanına firmanın tam ticari unvanı değil, üyenin takım adı yazılır.
 */
function vCardOlustur(card: KartBilgisi): string {
  const esc = (v: string) => v.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
  const org = card.takim || card.firmaAdi;
  const satirlar = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(card.soyad)};${esc(card.ad)};;;`,
    `FN:${esc(`${card.ad} ${card.soyad}`.trim())}`,
    card.unvan && `TITLE:${esc(card.unvan)}`,
    org && `ORG:${esc(org)}`,
    card.telefon && `TEL;TYPE=CELL:${esc(card.telefon)}`,
    card.email && `EMAIL;TYPE=INTERNET:${esc(card.email)}`,
    card.website && `URL:https://${esc(card.website.replace(/^https?:\/\//, ""))}`,
    `URL:https://qontac.net/kart/${card.id}`,
    card.biyografi && `NOTE:${esc(card.biyografi)}`,
    "END:VCARD",
  ].filter(Boolean);
  // vCard spesifikasyonu satır sonu olarak CRLF ister.
  return satirlar.join("\r\n") + "\r\n";
}

type Action = { icon: string; label: string; onClick?: () => void; href?: string; bg: string; brand?: BrandKey };

export function KartAksiyonlar({
  card,
  uyeModuller,
  kaynak,
}: {
  card: KartBilgisi;
  uyeModuller: UyeModul[];
  kaynak: KartKaynak;
}) {
  const [aktifModul, setAktifModul] = useState<UyeModul | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadForm, setLeadForm] = useState({ ad: "", email: "", telefon: "", sirket: "" });

  const color = card.kartRenk;

  const saveContact = () => {
    const blob = new Blob([vCardOlustur(card)], { type: "text/vcard;charset=utf-8" });
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
      setTimeout(() => {
        setLeadSaved(false);
        setShowLeadForm(false);
        setLeadForm({ ad: "", email: "", telefon: "", sirket: "" });
      }, 2500);
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally {
      setLeadLoading(false);
    }
  };

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
    <>
      <div className="grid grid-cols-4 gap-x-4 gap-y-5 justify-items-center mb-5 px-2">
        {actions.map((a) => {
          const cls = "w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform shadow-lg";
          const style = { background: a.bg, color: a.bg === "#ffd93d" ? "#000" : "#fff" };
          const inner = a.brand ? <BrandGlyph brand={a.brand} /> : <span className="material-symbols-outlined text-xl">{a.icon}</span>;
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
        {uyeModuller.filter(uyeModulDolu).map((m) => (
          <button key={m.id} onClick={() => setAktifModul(m)} aria-label={m.baslik} title={m.baslik}
            className="hover:scale-110 active:scale-95 transition-transform shadow-lg rounded-full">
            <ModulIkon veri={m.tanim ?? {}} size={56} />
          </button>
        ))}
      </div>

      {aktifModul && (
        <UyeModulLightbox modul={aktifModul} color={color} memberId={card.id} iletisimAdi={card.ad} onClose={() => setAktifModul(null)} />
      )}

      {showQr && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6" onClick={() => setShowQr(false)}>
          <div className="rounded-3xl p-6 max-w-sm w-full text-center" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={(e) => e.stopPropagation()}>
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
            <p className="text-xs text-on-surface-variant">{card.unvan} · {card.takim || card.firmaAdi}</p>
            <p className="text-[11px] text-on-surface-variant/70 mt-3">Bu QR kodu telefonunuzla okutarak kartı arkadaşlarınızla paylaşabilirsiniz.</p>
          </div>
        </div>
      )}

      {showLeadForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-0" onClick={() => setShowLeadForm(false)}>
          <div className="w-full max-w-sm rounded-t-3xl p-6 pb-8" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderBottom: "none" }} onClick={(e) => e.stopPropagation()}>
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
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-on-surface-variant mb-1 block">{f.label}</label>
                      <input type={f.type} required={f.required}
                        value={leadForm[f.key as keyof typeof leadForm]}
                        onChange={(e) => setLeadForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
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
    </>
  );
}
