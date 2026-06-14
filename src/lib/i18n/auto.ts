import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { translateFields } from "./translate";
import { DEFAULT_LOCALE, type Locale } from "./config";

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
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
  const nonEmpty = keys.filter((k) => typeof fields[k] === "string" && (fields[k] as string).trim());
  if (nonEmpty.length === 0) return fields;

  const result = { ...fields };

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
  const missingKeyByField: Record<string, keyof T> = {};
  nonEmpty.forEach((k, i) => {
    const h = hashes[i];
    const hit = cacheMap.get(h);
    if (hit !== undefined) {
      result[k] = hit as T[keyof T];
    } else {
      missing[String(k)] = fields[k] as string;
      missingKeyByField[String(k)] = k;
    }
  });

  if (Object.keys(missing).length === 0) return result;

  // 2) Eksikleri çevir (API anahtarı yoksa kaynak kalır)
  if (!process.env.ANTHROPIC_API_KEY) return result;

  try {
    const translated = await translateFields(missing, locale, {
      isHtml: opts.isHtml,
      sourceLocale: DEFAULT_LOCALE,
    });
    const rows: { locale: string; hash: string; source: string; value: string }[] = [];
    for (const [fieldKey, srcVal] of Object.entries(missing)) {
      const val = translated[fieldKey];
      if (typeof val !== "string" || !val.trim()) continue;
      const k = missingKeyByField[fieldKey];
      result[k] = val as T[keyof T];
      rows.push({ locale, hash: hash(srcVal), source: srcVal, value: val });
    }
    // 3) Önbelleğe yaz (best-effort)
    if (rows.length) {
      try {
        await prisma.$transaction(
          rows.map((r) =>
            prisma.translation.upsert({
              where: { locale_hash: { locale: r.locale, hash: r.hash } },
              create: r,
              update: { value: r.value, source: r.source },
            }),
          ),
        );
      } catch {
        // DB yazılamazsa sorun değil, çeviri yine de döner
      }
    }
  } catch {
    // Çeviri başarısızsa kaynak metin kalır
  }

  return result;
}

/** Bir dizi metni sırayla çevirir (index korunur). */
export async function txList(items: string[], locale: Locale, opts: { isHtml?: boolean } = {}): Promise<string[]> {
  if (locale === DEFAULT_LOCALE || items.length === 0) return items;
  const fields: Record<string, string> = {};
  items.forEach((s, i) => (fields[`i${i}`] = s));
  const out = await tx(fields, locale, opts);
  return items.map((_, i) => out[`i${i}`]);
}
