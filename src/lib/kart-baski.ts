// Kart baskı şablonu: tipler, varsayılanlar ve tuval (canvas) çizimi.
// Şablon editörü, satılan kart önizlemesi ve JPG çıktısı aynı çizim fonksiyonunu kullanır;
// böylece ekranda görülen ile basılan birebir aynıdır. Yalnız tarayıcıda çalışır.

export type AlanTipi = "adSoyad" | "unvan" | "gsm" | "qr";
export type Yuz = "on" | "arka";
export type Yon = "yatay" | "dikey";
export type Hiza = "left" | "center" | "right";

export interface SablonAlani {
  tip: AlanTipi;
  yuz: Yuz;
  /** Yazıda hizalama noktası, QR'da sol üst köşe — kart genişliğine/yüksekliğine oranla (0–1) */
  x: number;
  y: number;
  /** Yazıda punto, QR'da kenar uzunluğu — kart YÜKSEKLİĞİNE oranla (0–1) */
  boyut: number;
  renk: string;
  font: string;
  kalin: boolean;
  hiza: Hiza;
  gorunur: boolean;
}

export interface KartSablonVerisi {
  id?: string;
  ad: string;
  yon: Yon;
  onGorsel: string;
  arkaGorsel: string;
  alanlar: SablonAlani[];
}

export interface KartDegerleri { adSoyad: string; unvan: string; gsm: string; qr: string }

export const ALAN_ETIKET: Record<AlanTipi, string> = {
  adSoyad: "Ad Soyad",
  unvan: "Unvan",
  gsm: "GSM",
  qr: "QR Kod",
};

export const FONTLAR = [
  "Montserrat", "Poppins", "Inter", "Roboto", "Open Sans", "Lato", "Raleway",
  "Oswald", "Bebas Neue", "Playfair Display", "Merriweather", "Arial", "Georgia", "Times New Roman",
] as const;
const SISTEM_FONTLARI = new Set(["Arial", "Georgia", "Times New Roman"]);

/** 300 DPI baskı ölçüsü (ISO/IEC 7810 ID-1: 85.6 × 54 mm) */
export const KART_MM = { uzun: 85.6, kisa: 54 };
export const KART_PX = { uzun: 1011, kisa: 638 };
export const olcu = (yon: Yon) =>
  yon === "yatay"
    ? { w: KART_PX.uzun, h: KART_PX.kisa, wmm: KART_MM.uzun, hmm: KART_MM.kisa }
    : { w: KART_PX.kisa, h: KART_PX.uzun, wmm: KART_MM.kisa, hmm: KART_MM.uzun };

export const ORNEK_DEGERLER: KartDegerleri = {
  adSoyad: "AD SOYAD",
  unvan: "Unvan",
  gsm: "0530 123 45 67",
  qr: "https://qontac.net/k/ornek?src=qr",
};

export function varsayilanAlanlar(yon: Yon): SablonAlani[] {
  const ortak = { renk: "#ffffff", font: "Montserrat", gorunur: true } as const;
  return yon === "yatay"
    ? [
        { ...ortak, tip: "qr", yuz: "on", x: 0.06, y: 0.2, boyut: 0.55, kalin: false, hiza: "left" },
        { ...ortak, tip: "adSoyad", yuz: "on", x: 0.94, y: 0.4, boyut: 0.085, kalin: true, hiza: "right" },
        { ...ortak, tip: "unvan", yuz: "on", x: 0.94, y: 0.52, boyut: 0.05, kalin: false, hiza: "right", gorunur: false },
        { ...ortak, tip: "gsm", yuz: "on", x: 0.94, y: 0.62, boyut: 0.06, kalin: false, hiza: "right" },
      ]
    : [
        { ...ortak, tip: "qr", yuz: "on", x: 0.25, y: 0.22, boyut: 0.3, kalin: false, hiza: "left" },
        { ...ortak, tip: "adSoyad", yuz: "on", x: 0.5, y: 0.66, boyut: 0.05, kalin: true, hiza: "center" },
        { ...ortak, tip: "unvan", yuz: "on", x: 0.5, y: 0.71, boyut: 0.03, kalin: false, hiza: "center", gorunur: false },
        { ...ortak, tip: "gsm", yuz: "on", x: 0.5, y: 0.76, boyut: 0.035, kalin: false, hiza: "center" },
      ];
}

/** Veritabanından gelen alan listesini güvenli şekle getirir; eksik alan tiplerini ekler. */
export function alanlariDuzenle(ham: unknown, yon: Yon): SablonAlani[] {
  const vars = varsayilanAlanlar(yon);
  const liste = Array.isArray(ham) ? (ham as Partial<SablonAlani>[]) : [];
  return vars.map(v => {
    const a = liste.find(x => x?.tip === v.tip);
    if (!a) return v;
    const sayi = (n: unknown, d: number) => (typeof n === "number" && isFinite(n) ? Math.min(Math.max(n, 0), 1) : d);
    return {
      ...v,
      yuz: a.yuz === "arka" ? "arka" : "on",
      x: sayi(a.x, v.x),
      y: sayi(a.y, v.y),
      boyut: sayi(a.boyut, v.boyut),
      renk: typeof a.renk === "string" && /^#[0-9a-f]{6}$/i.test(a.renk) ? a.renk : v.renk,
      font: typeof a.font === "string" && (FONTLAR as readonly string[]).includes(a.font) ? a.font : v.font,
      kalin: typeof a.kalin === "boolean" ? a.kalin : v.kalin,
      hiza: a.hiza === "left" || a.hiza === "center" || a.hiza === "right" ? a.hiza : v.hiza,
      gorunur: typeof a.gorunur === "boolean" ? a.gorunur : v.gorunur,
    };
  });
}

// ---- Tarayıcı yardımcıları ----

const yuklenenFontlar = new Set<string>();

/** Google Fonts'tan fontu yükler (tuvalde kullanılmadan önce hazır olmalı). */
export async function fontYukle(font: string): Promise<void> {
  if (SISTEM_FONTLARI.has(font) || yuklenenFontlar.has(font)) return;
  yuklenenFontlar.add(font);
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
  const ornek = "AaBbŞşİıĞğÜüÖöÇç0123456789+()";
  await Promise.all([
    document.fonts.load(`400 40px "${font}"`, ornek),
    document.fonts.load(`700 40px "${font}"`, ornek),
  ]).catch(() => {});
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

/** Alanın tuvaldeki kutusu (sürükleme için isabet testi). */
export function alanKutusu(ctx: CanvasRenderingContext2D, a: SablonAlani, deger: string, W: number, H: number) {
  if (a.tip === "qr") {
    const k = a.boyut * H;
    return { x: a.x * W, y: a.y * H, w: k, h: k };
  }
  const px = a.boyut * H;
  ctx.font = `${a.kalin ? 700 : 400} ${px}px "${a.font}"`;
  const w = Math.max(ctx.measureText(deger || " ").width, px);
  const x0 = a.hiza === "left" ? a.x * W : a.hiza === "center" ? a.x * W - w / 2 : a.x * W - w;
  return { x: x0, y: a.y * H - px * 0.85, w, h: px * 1.1 };
}

/**
 * Kartın bir yüzünü çizer. `qrKaynak`: aynı değeri kodlayan hazır QR tuvali.
 * `vurgu` verilirse o alanın çevresine düzenleme çerçevesi çizilir (yalnız editörde).
 */
export function yuzCiz(
  ctx: CanvasRenderingContext2D,
  s: { yon: Yon; alanlar: SablonAlani[] },
  yuz: Yuz,
  zemin: HTMLImageElement | null,
  degerler: KartDegerleri,
  qrKaynak: HTMLCanvasElement | null,
  vurgu?: AlanTipi | null,
) {
  const { w: W, h: H } = olcu(s.yon);
  ctx.canvas.width = W;
  ctx.canvas.height = H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  if (zemin) ctx.drawImage(zemin, 0, 0, W, H);

  for (const a of s.alanlar) {
    if (a.yuz !== yuz || !a.gorunur) continue;
    if (a.tip === "qr") {
      const k = a.boyut * H;
      if (qrKaynak) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrKaynak, a.x * W, a.y * H, k, k);
        ctx.imageSmoothingEnabled = true;
      }
    } else {
      const deger = degerler[a.tip];
      if (!deger) continue;
      ctx.font = `${a.kalin ? 700 : 400} ${a.boyut * H}px "${a.font}"`;
      ctx.fillStyle = a.renk;
      ctx.textAlign = a.hiza;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(deger, a.x * W, a.y * H);
    }
    if (vurgu === a.tip) {
      const b = alanKutusu(ctx, a, a.tip === "qr" ? "" : degerler[a.tip], W, H);
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
