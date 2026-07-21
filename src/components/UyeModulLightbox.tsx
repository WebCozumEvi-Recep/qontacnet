"use client";
// Üye modüllerinin kart üzerindeki popup davranışı — hem public kart sayfası
// hem de üye panelindeki Modüllerim önizlemesi aynı bileşeni kullanır.
import { useEffect, useRef, useState } from "react";
import { ModulIkon } from "@/components/ModulIkon";

export type UyeTip = "GALERI" | "TEXT" | "VIDEO" | "LINK" | "GORSEL" | "FORM" | "TEK_GORSEL" | "HTML" | "SSS" | "HERO" | "BASVURU";
export interface UyeModul { id: string; tip: UyeTip; baslik: string; icerik: Record<string, unknown>; tanim?: { ikon: string; ikonAd: string; butonRenk: string; ikonRenk: string } | null }

export function uyeModulDolu(m: UyeModul): boolean {
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

export function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function UyeModulLightbox({ modul, color, memberId, firmaAdi, onClose }: { modul: UyeModul; color: string; memberId: string; firmaAdi: string; onClose: () => void }) {
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

export function SssAkordiyon({ color, sorular }: { baslik?: string; color: string; sorular: { soru: string; cevap: string }[] }) {
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

export function GaleriSlider({ color, gorseller }: { baslik?: string; color: string; gorseller: { url: string; baslik?: string; aciklama?: string }[] }) {
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
