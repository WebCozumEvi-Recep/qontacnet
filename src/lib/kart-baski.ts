// Kart baskı şablonu: tipler, varsayılanlar ve tuval (canvas) çizimi.
// Şablon editörü, satılan kart önizlemesi ve JPG çıktısı aynı çizim fonksiyonunu kullanır;
// böylece ekranda görülen ile basılan birebir aynıdır. Çizim fonksiyonları yalnız tarayıcıda çalışır.

/** Üyeden dolan alanlar (şablonda en fazla birer tane) */
export type DinamikTip = "ad" | "soyad" | "adSoyad" | "unvan" | "gsm" | "qr";
/** Şablonda sabit içerikli, istenen sayıda eklenebilen alanlar */
export type SabitTip = "metin" | "ikon" | "gorsel";
export type AlanTipi = DinamikTip | SabitTip;
export type Yuz = "on" | "arka";
export type Yon = "yatay" | "dikey";
export type Hiza = "left" | "center" | "right";

export interface SablonAlani {
  id: string;
  tip: AlanTipi;
  yuz: Yuz;
  /** Hizalama noktası (QR'da sol üst köşe) — kart genişliğine/yüksekliğine oranla (0–1) */
  x: number;
  y: number;
  /** Yazı/ikonda punto, QR ve görselde yükseklik — kart YÜKSEKLİĞİNE oranla (0–1) */
  boyut: number;
  renk: string;
  font: string;
  kalin: boolean;
  hiza: Hiza;
  gorunur: boolean;
  /** metin: yazı; ikon: Material Symbols adı; gorsel: /uploads yolu */
  icerik: string;
}

export interface KartSablonVerisi {
  id?: string;
  ad: string;
  yon: Yon;
  onGorsel: string;
  arkaGorsel: string;
  onRenk: string;
  arkaRenk: string;
  alanlar: SablonAlani[];
}

export const RENK = /^#[0-9a-f]{6}$/i;
export const zeminRengi = (r: unknown) => (typeof r === "string" && RENK.test(r) ? r : "#ffffff");

export interface KartDegerleri { ad: string; soyad: string; unvan: string; gsm: string; qr: string }

export const DINAMIK_TIPLER: DinamikTip[] = ["ad", "soyad", "adSoyad", "unvan", "gsm", "qr"];
export const ALAN_ETIKET: Record<AlanTipi, string> = {
  ad: "Ad",
  soyad: "Soyad",
  adSoyad: "Ad Soyad (birleşik)",
  unvan: "Unvan",
  gsm: "GSM",
  qr: "QR Kod",
  metin: "Metin",
  ikon: "İkon",
  gorsel: "Görsel",
};
export const ALAN_IKON: Record<AlanTipi, string> = {
  ad: "person", soyad: "person", adSoyad: "badge", unvan: "work", gsm: "call", qr: "qr_code_2",
  metin: "title", ikon: "interests", gorsel: "image",
};

/** İkon seçicide hazır gelenler (Material Symbols adları) */
export const HAZIR_IKONLAR = [
  "nfc", "contactless", "call", "smartphone", "mail", "language", "public", "location_on",
  "qr_code_2", "business", "person", "work", "link", "share", "wifi", "badge", "photo_camera", "chat",
] as const;

export const FONTLAR = [
  "Montserrat", "Poppins", "Inter", "Roboto", "Open Sans", "Lato", "Raleway",
  "Oswald", "Bebas Neue", "Playfair Display", "Merriweather", "Arial", "Georgia", "Times New Roman",
] as const;
const SISTEM_FONTLARI = new Set(["Arial", "Georgia", "Times New Roman"]);
/** Tuvalde ikon çizmek için tam Material Symbols fontu bu adla yüklenir (sitenin alt küme fontuyla çakışmasın) */
export const IKON_FONTU = "QontacIkon";

/** 300 DPI baskı ölçüsü (ISO/IEC 7810 ID-1: 85.6 × 54 mm) */
export const KART_MM = { uzun: 85.6, kisa: 54 };
export const KART_PX = { uzun: 1011, kisa: 638 };
export const olcu = (yon: Yon) =>
  yon === "yatay"
    ? { w: KART_PX.uzun, h: KART_PX.kisa, wmm: KART_MM.uzun, hmm: KART_MM.kisa }
    : { w: KART_PX.kisa, h: KART_PX.uzun, wmm: KART_MM.kisa, hmm: KART_MM.uzun };

export const ORNEK_DEGERLER: KartDegerleri = {
  ad: "ADINIZ",
  soyad: "SOYADINIZ",
  unvan: "Unvan",
  gsm: "0530 123 45 67",
  qr: "https://qontac.net/k/ornek?src=qr",
};

export const yeniAlanId = () => Math.random().toString(36).slice(2, 10);

/** Yeni eklenen alanın başlangıç değerleri */
export function yeniAlan(tip: AlanTipi, yuz: Yuz, icerik = ""): SablonAlani {
  const temel: SablonAlani = {
    id: yeniAlanId(), tip, yuz, x: 0.5, y: 0.5, boyut: 0.06, renk: "#ffffff", font: "Montserrat",
    kalin: false, hiza: "center", gorunur: true, icerik,
  };
  if (tip === "qr") return { ...temel, x: 0.06, y: 0.2, boyut: 0.5, hiza: "left" };
  if (tip === "gorsel") return { ...temel, x: 0.5, y: 0.35, boyut: 0.2 };
  if (tip === "ikon") return { ...temel, boyut: 0.1, icerik: icerik || "nfc" };
  if (tip === "ad" || tip === "adSoyad") return { ...temel, boyut: 0.085, kalin: true };
  return temel;
}

export function varsayilanAlanlar(yon: Yon): SablonAlani[] {
  const a = (tip: AlanTipi, p: Partial<SablonAlani>) => ({ ...yeniAlan(tip, "on"), ...p });
  return yon === "yatay"
    ? [
        a("qr", { x: 0.06, y: 0.2, boyut: 0.55 }),
        a("ad", { x: 0.94, y: 0.34, boyut: 0.085, hiza: "right" }),
        a("soyad", { x: 0.94, y: 0.46, boyut: 0.085, kalin: true, hiza: "right" }),
        a("gsm", { x: 0.94, y: 0.62, boyut: 0.06, hiza: "right" }),
      ]
    : [
        a("qr", { x: 0.25, y: 0.2, boyut: 0.3 }),
        a("ad", { x: 0.5, y: 0.63, boyut: 0.05 }),
        a("soyad", { x: 0.5, y: 0.69, boyut: 0.05, kalin: true }),
        a("gsm", { x: 0.5, y: 0.76, boyut: 0.035 }),
      ];
}

const GORSEL_YOLU = /^\/uploads\/[\w./-]+$/;
const IKON_ADI = /^[a-z0-9_]{1,40}$/;

/**
 * Veritabanından/istekten gelen alan listesini güvenli şekle getirir.
 * Eski şablonlarda `id` ve `icerik` yoktur; dinamik tipler en fazla birer kez tutulur.
 */
export function alanlariDuzenle(ham: unknown, yon: Yon): SablonAlani[] {
  if (!Array.isArray(ham)) return varsayilanAlanlar(yon);
  const sayi = (n: unknown, d: number) => (typeof n === "number" && isFinite(n) ? Math.min(Math.max(n, 0), 1) : d);
  const gorulen = new Set<string>();
  const sonuc: SablonAlani[] = [];
  for (const h of ham.slice(0, 40) as Partial<SablonAlani>[]) {
    const tip = h?.tip;
    if (!tip || !(tip in ALAN_ETIKET)) continue;
    if ((DINAMIK_TIPLER as string[]).includes(tip)) {
      if (gorulen.has(tip)) continue;
      gorulen.add(tip);
    }
    const v = yeniAlan(tip, "on");
    let icerik = typeof h.icerik === "string" ? h.icerik.slice(0, 200) : "";
    if (tip === "ikon" && !IKON_ADI.test(icerik)) icerik = "nfc";
    if (tip === "gorsel" && icerik && !GORSEL_YOLU.test(icerik)) icerik = "";
    if (!(tip === "metin" || tip === "ikon" || tip === "gorsel")) icerik = "";
    sonuc.push({
      id: typeof h.id === "string" && /^[\w-]{1,20}$/.test(h.id) ? h.id : yeniAlanId(),
      tip,
      yuz: h.yuz === "arka" ? "arka" : "on",
      x: sayi(h.x, v.x),
      y: sayi(h.y, v.y),
      boyut: sayi(h.boyut, v.boyut),
      renk: typeof h.renk === "string" && /^#[0-9a-f]{6}$/i.test(h.renk) ? h.renk : v.renk,
      font: typeof h.font === "string" && (FONTLAR as readonly string[]).includes(h.font) ? h.font : v.font,
      kalin: typeof h.kalin === "boolean" ? h.kalin : v.kalin,
      hiza: h.hiza === "left" || h.hiza === "center" || h.hiza === "right" ? h.hiza : v.hiza,
      gorunur: typeof h.gorunur === "boolean" ? h.gorunur : v.gorunur,
      icerik,
    });
  }
  return sonuc;
}

/** Alanın tuvalde basılacak yazısı (yazı tipleri için) */
export function alanYazisi(a: SablonAlani, d: KartDegerleri): string {
  switch (a.tip) {
    case "ad": return d.ad;
    case "soyad": return d.soyad;
    case "adSoyad": return `${d.ad} ${d.soyad}`.trim();
    case "unvan": return d.unvan;
    case "gsm": return d.gsm;
    case "metin": return a.icerik;
    default: return "";
  }
}

// ---- Tarayıcı yardımcıları ----

const yuklenenFontlar = new Map<string, Promise<void>>();

/** Google Fonts'tan fontu yükler (tuvalde kullanılmadan önce hazır olmalı). */
export function fontYukle(font: string): Promise<void> {
  if (SISTEM_FONTLARI.has(font)) return Promise.resolve();
  let p = yuklenenFontlar.get(font);
  if (!p) {
    p = (async () => {
      const id = `gf-${font.replace(/\s+/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
        document.head.appendChild(link);
        await new Promise(r => { link.onload = r; link.onerror = r; });
      }
      // Örnek metin, Türkçe karakterlerin bulunduğu alt kümelerin (latin-ext) de yüklenmesini sağlar
      const ornek = "AaBbŞşİıĞğÜüÖöÇç0123456789+().:/@";
      await Promise.all([
        document.fonts.load(`400 40px "${font}"`, ornek),
        document.fonts.load(`700 40px "${font}"`, ornek),
      ]).catch(() => {});
    })();
    yuklenenFontlar.set(font, p);
  }
  return p;
}

let ikonFontu: Promise<void> | null = null;
/** Tam Material Symbols fontunu IKON_FONTU adıyla yükler (~4 MB, tarayıcı önbelleğe alır). */
export function ikonFontuYukle(): Promise<void> {
  ikonFontu ??= (async () => {
    try {
      const css = await fetch("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0").then(r => r.text());
      const url = css.match(/url\((https:[^)]+)\)/)?.[1];
      if (!url) return;
      const yuz = new FontFace(IKON_FONTU, `url(${url})`);
      await yuz.load();
      document.fonts.add(yuz);
    } catch {
      ikonFontu = null; // bir sonraki denemede yeniden dene
    }
  })();
  return ikonFontu;
}

const gorselOnbellek = new Map<string, Promise<HTMLImageElement | null>>();
export function gorselYukle(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  let p = gorselOnbellek.get(src);
  if (!p) {
    p = new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    gorselOnbellek.set(src, p);
  }
  return p;
}

type Gorseller = Map<string, HTMLImageElement | null>;

/** Alanın tuvaldeki kutusu (sürükleme için isabet testi ve seçim çerçevesi). */
export function alanKutusu(
  ctx: CanvasRenderingContext2D, a: SablonAlani, d: KartDegerleri, W: number, H: number, gorseller?: Gorseller,
) {
  const px = a.boyut * H;
  const yatayKonum = (w: number) => (a.hiza === "left" ? a.x * W : a.hiza === "center" ? a.x * W - w / 2 : a.x * W - w);
  if (a.tip === "qr") return { x: a.x * W, y: a.y * H, w: px, h: px };
  if (a.tip === "gorsel") {
    const img = gorseller?.get(a.icerik);
    const w = img ? (px * img.naturalWidth) / img.naturalHeight : px;
    return { x: yatayKonum(w), y: a.y * H - px / 2, w, h: px };
  }
  if (a.tip === "ikon") return { x: yatayKonum(px), y: a.y * H - px / 2, w: px, h: px };
  ctx.font = `${a.kalin ? 700 : 400} ${px}px "${a.font}"`;
  const w = Math.max(ctx.measureText(alanYazisi(a, d) || " ").width, px);
  return { x: yatayKonum(w), y: a.y * H - px * 0.85, w, h: px * 1.1 };
}

/**
 * Kartın bir yüzünü çizer. `qrKaynak`: aynı değeri kodlayan hazır QR tuvali;
 * `gorseller`: görsel alanlarının önceden yüklenmiş resimleri.
 * `vurgu` verilirse o alanın çevresine düzenleme çerçevesi çizilir (yalnız editörde).
 */
export function yuzCiz(
  ctx: CanvasRenderingContext2D,
  s: { yon: Yon; alanlar: SablonAlani[]; onRenk: string; arkaRenk: string },
  yuz: Yuz,
  zemin: HTMLImageElement | null,
  degerler: KartDegerleri,
  qrKaynak: HTMLCanvasElement | null,
  gorseller: Gorseller,
  vurgu?: string | null,
) {
  const { w: W, h: H } = olcu(s.yon);
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = zeminRengi(yuz === "on" ? s.onRenk : s.arkaRenk);
  ctx.fillRect(0, 0, W, H);
  if (zemin) ctx.drawImage(zemin, 0, 0, W, H);

  for (const a of s.alanlar) {
    if (a.yuz !== yuz || !a.gorunur) continue;
    const b = alanKutusu(ctx, a, degerler, W, H, gorseller);
    if (a.tip === "qr") {
      if (qrKaynak) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrKaynak, b.x, b.y, b.w, b.h);
        ctx.imageSmoothingEnabled = true;
      }
    } else if (a.tip === "gorsel") {
      const img = gorseller.get(a.icerik);
      if (img) ctx.drawImage(img, b.x, b.y, b.w, b.h);
    } else if (a.tip === "ikon") {
      ctx.font = `400 ${a.boyut * H}px "${IKON_FONTU}"`;
      ctx.fillStyle = a.renk;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(a.icerik, b.x, a.y * H);
    } else {
      const yazi = alanYazisi(a, degerler);
      if (!yazi) continue;
      ctx.font = `${a.kalin ? 700 : 400} ${a.boyut * H}px "${a.font}"`;
      ctx.fillStyle = a.renk;
      ctx.textAlign = a.hiza;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(yazi, a.x * W, a.y * H);
    }
    if (vurgu === a.id) {
      ctx.save();
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
      ctx.restore();
    }
  }
}

/** Tuvali JPG olarak indirir. */
export function jpgIndir(canvas: HTMLCanvasElement, dosyaAdi: string) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/jpeg", 0.95);
  a.download = dosyaAdi.endsWith(".jpg") ? dosyaAdi : `${dosyaAdi}.jpg`;
  a.click();
}

/** Ön/arka görselleri gerçek kart ölçüsünde yazdırma penceresinde açar. */
export function yazdir(sayfalar: HTMLCanvasElement[], yon: Yon, baslik: string) {
  const { wmm, hmm } = olcu(yon);
  const w = window.open("", "_blank");
  if (!w) return false;
  const imgs = sayfalar.map(c => `<div class="s"><img src="${c.toDataURL("image/jpeg", 0.95)}"></div>`).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${baslik.replace(/</g, "&lt;")}</title>
<style>@page{size:${wmm}mm ${hmm}mm;margin:0}html,body{margin:0;padding:0}
.s{width:${wmm}mm;height:${hmm}mm;page-break-after:always;overflow:hidden}.s:last-child{page-break-after:auto}
img{width:100%;height:100%;display:block}</style></head><body>${imgs}
<script>window.onload=function(){setTimeout(function(){window.print()},200)}<\/script></body></html>`);
  w.document.close();
  return true;
}
