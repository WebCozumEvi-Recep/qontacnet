import "server-only";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { translateFields } from "./translate";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { SEED } from "./homepage-seed";

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * İşi yanıt gönderildikten sonraya erteler.
 * `after()` yalnız istek kapsamında çalışır; dışarıda (script, build) çağrılırsa
 * işi arka planda başlatıp yanıtı bekletmeyiz.
 */
function arkaPlanda(job: () => Promise<void>): void {
  try {
    after(job);
  } catch {
    void job().catch(() => {});
  }
}

/** Aynı metnin aynı anda birden çok kez çevrilmesini engeller. */
const ucusta = new Set<string>();

/** Eksik çevirileri arka planda üretip önbelleğe yazar (yanıtı bloklamaz). */
async function ceviriyiOnbellegeAl(
  missing: Record<string, string>,
  locale: Locale,
  isHtml: boolean | undefined,
): Promise<void> {
  const anahtarlar = Object.values(missing).map((v) => `${locale}:${hash(v)}`);
  if (anahtarlar.every((a) => ucusta.has(a))) return;
  anahtarlar.forEach((a) => ucusta.add(a));

  try {
    const translated = await translateFields(missing, locale, {
      isHtml,
      sourceLocale: DEFAULT_LOCALE,
    });
    const rows = Object.entries(missing)
      .map(([fieldKey, srcVal]) => ({ srcVal, val: translated[fieldKey] }))
      .filter((r): r is { srcVal: string; val: string } => typeof r.val === "string" && !!r.val.trim())
      .map((r) => ({ locale, hash: hash(r.srcVal), source: r.srcVal, value: r.val }));

    if (rows.length) {
      await prisma.$transaction(
        rows.map((r) =>
          prisma.translation.upsert({
            where: { locale_hash: { locale: r.locale, hash: r.hash } },
            create: r,
            update: { value: r.value, source: r.source },
          }),
        ),
      );
    }
  } catch (err) {
    // Çeviri/DB hatası sayfayı etkilemez; bir sonraki istekte yeniden denenir.
    // Sessizce yutmak yerine geliştirmede görünür olsun.
    if (process.env.NODE_ENV === "development") console.error("[i18n] arka plan çevirisi başarısız:", err);
  } finally {
    anahtarlar.forEach((a) => ucusta.delete(a));
  }
}

// Koda gömülü hazır çeviri (API/DB gerektirmez). Bulunamazsa undefined.
function fromSeed(locale: Locale, source: string): string | undefined {
  return SEED[locale]?.[source.trim()];
}

/**
 * Verilen TR metin alanlarını aktif dile çevirir.
 * - Kaynak dilde (tr) hiçbir şey yapmaz.
 * - DB önbelleğinden bulunanları kullanır, eksikleri Claude API ile çevirip kaydeder.
 * - ANTHROPIC_API_KEY yoksa veya hata olursa kaynak metni (tr) döndürür (site bozulmaz).
 *
 * Kullanım:
 *   const t = await tx({ title: "Başlık", desc: "Açıklama" }, locale)
 *   t.title // çeviri ya da orijinal
 */
export async function tx<T extends Record<string, string>>(
  fields: T,
  locale: Locale,
  opts: { isHtml?: boolean } = {},
): Promise<T> {
  if (locale === DEFAULT_LOCALE) return fields;

  const keys = Object.keys(fields) as (keyof T)[];
  let nonEmpty = keys.filter((k) => typeof fields[k] === "string" && (fields[k] as string).trim());
  if (nonEmpty.length === 0) return fields;

  const result = { ...fields };

  // 0) Koda gömülü hazır çeviri (seed) — API/DB gerektirmez, anında hazır
  nonEmpty = nonEmpty.filter((k) => {
    const seeded = fromSeed(locale, fields[k] as string);
    if (seeded !== undefined) {
      result[k] = seeded as T[keyof T];
      return false;
    }
    return true;
  });
  if (nonEmpty.length === 0) return result;

  // 1) Önbellekten oku
  const hashes = nonEmpty.map((k) => hash(fields[k] as string));
  let cached: { hash: string; value: string }[] = [];
  try {
    cached = await prisma.translation.findMany({
      where: { locale, hash: { in: hashes } },
      select: { hash: true, value: true },
    });
  } catch {
    // DB yoksa önbellek atlanır
  }
  const cacheMap = new Map(cached.map((c) => [c.hash, c.value]));

  const missing: Record<string, string> = {};
  nonEmpty.forEach((k, i) => {
    const hit = cacheMap.get(hashes[i]);
    if (hit !== undefined) result[k] = hit as T[keyof T];
    else missing[String(k)] = fields[k] as string;
  });

  if (Object.keys(missing).length === 0) return result;

  // 2) Eksikleri çevir (API anahtarı yoksa kaynak kalır)
  if (!process.env.ANTHROPIC_API_KEY) return result;

  // Çeviri Claude API'ye gider ve saniyeler sürebilir. Sayfa yükleme süresini
  // buna bağlamamak için kaynak metin (tr) hemen döndürülür; çeviri yanıttan
  // sonra arka planda üretilip önbelleğe yazılır ve bir sonraki istekte görünür.
  arkaPlanda(() => ceviriyiOnbellegeAl(missing, locale, opts.isHtml));

  return result;
}

// Modül içeriğinde çevrilecek metin taşıyan alan adları (URL/renk/görsel hariç).
const TEXT_KEYS = new Set([
  "metin", "aciklama", "baslik", "altbaslik", "buton", "butonMetin", "soru", "cevap",
  "q", "a", "text", "title", "subtitle", "label", "icerik", "html", "not",
]);
const SKIP_VALUE = /^(https?:\/\/|data:|#|\/|mailto:|tel:)/i;

/**
 * Bir JSON nesnesi/dizisi içindeki metin alanlarını (TEXT_KEYS) yerinde çevirir.
 * URL, renk, görsel gibi değerleri atlar. Modül içerikleri için kullanılır.
 */
export async function txContent<T>(content: T, locale: Locale): Promise<T> {
  if (locale === DEFAULT_LOCALE || content == null) return content;

  // Çevrilecek string'leri topla
  const collected: { ref: Record<string, unknown>; key: string; value: string }[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (typeof v === "string") {
          if (TEXT_KEYS.has(k) && v.trim() && !SKIP_VALUE.test(v.trim())) {
            collected.push({ ref: node as Record<string, unknown>, key: k, value: v });
          }
        } else {
          walk(v);
        }
      }
    }
  };
  // Derin kopya üzerinde çalış (orijinali bozmamak için)
  const clone = JSON.parse(JSON.stringify(content)) as T;
  walk(clone);
  if (collected.length === 0) return clone;

  const fields: Record<string, string> = {};
  collected.forEach((c, i) => (fields[`f${i}`] = c.value));
  const translated = await tx(fields, locale, { isHtml: true });
  collected.forEach((c, i) => {
    c.ref[c.key] = translated[`f${i}`];
  });
  return clone;
}

/** Bir dizi metni sırayla çevirir (index korunur). */
export async function txList(items: string[], locale: Locale, opts: { isHtml?: boolean } = {}): Promise<string[]> {
  if (locale === DEFAULT_LOCALE || items.length === 0) return items;
  const fields: Record<string, string> = {};
  items.forEach((s, i) => (fields[`i${i}`] = s));
  const out = await tx(fields, locale, opts);
  return items.map((_, i) => out[`i${i}`]);
}
