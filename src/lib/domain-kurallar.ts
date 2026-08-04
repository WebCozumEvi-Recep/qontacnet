// Alan adı ad/uzantı kuralları. Hem sorgulama hem satın alma tarafında kullanılır;
// istemci ön doğrulaması ile sunucu doğrulaması aynı fonksiyonlardan beslenir.

/**
 * Satışa açık uzantılar. `.tr` uzantıları belge/onay gerektirdiği için ilk sürümde
 * listede değil — eklemeden önce evrak akışının kurulması gerekir.
 */
export const DESTEKLENEN_TLDLER = [
  "com", "net", "org", "info", "biz", "co",
  "xyz", "online", "site", "shop", "app", "dev",
] as const;

export type DesteklenenTld = (typeof DESTEKLENEN_TLDLER)[number];

/** Sorgu sonucunda kullanıcıya önerilecek uzantı sırası. */
export const ONERILEN_TLDLER: DesteklenenTld[] = ["com", "net", "org", "co", "online", "shop"];

export function tldDestekleniyorMu(tld: string): boolean {
  return (DESTEKLENEN_TLDLER as readonly string[]).includes(tld.toLowerCase());
}

/**
 * Kullanıcının yazdığı metinden alan adı etiketini (uzantısız kısım) çıkarır.
 * "www.ABCD.com/x" → "abcd". IDN girildiyse punycode'a çevrilir.
 */
export function etiketNormalize(girdi: string): string {
  let s = (girdi || "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  // Kullanıcı uzantı da yazdıysa yalnızca ilk etiketi al.
  s = s.split(".")[0];
  return punycode(s);
}

/** Girdide uzantı verilmişse döndürür (desteklenmese bile), yoksa boş string. */
export function girilenTld(girdi: string): string {
  const s = (girdi || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const parcalar = s.split(".");
  return parcalar.length > 1 ? parcalar.slice(1).join(".") : "";
}

/** IDN etiketini punycode'a çevirir (ör. "şirket" → "xn--irket-3ya"). ASCII ise dokunmaz. */
export function punycode(etiket: string): string {
  if (/^[a-z0-9-]*$/.test(etiket)) return etiket;
  try {
    // URL API'si IDN dönüşümünü yapar; tek etiket için güvenli.
    return new URL(`http://${etiket}.com`).hostname.split(".")[0];
  } catch {
    return etiket;
  }
}

/**
 * Etiketi doğrular. Geçerliyse null, değilse Türkçe hata mesajı döner.
 * Kurallar: 3–63 karakter, yalnız a-z 0-9 ve tire, baş/sonda tire yok,
 * 3. ve 4. karakterde çift tire yok (punycode `xn--` ayrık tutulur).
 */
export function etiketHatasi(etiket: string): string | null {
  if (!etiket) return "Bir alan adı yazın.";
  if (etiket.length < 3) return "Alan adı en az 3 karakter olmalı.";
  if (etiket.length > 63) return "Alan adı en fazla 63 karakter olabilir.";
  if (!/^[a-z0-9-]+$/.test(etiket)) return "Yalnızca harf, rakam ve tire (-) kullanılabilir.";
  if (etiket.startsWith("-") || etiket.endsWith("-")) return "Alan adı tire ile başlayamaz veya bitemez.";
  if (etiket.slice(2, 4) === "--" && !etiket.startsWith("xn--")) return "3. ve 4. karakterde çift tire kullanılamaz.";
  return null;
}

/** Tam alan adını doğrular ve normalize eder. */
export function alanAdiCoz(girdi: string, tld: string): { alanAdi: string; etiket: string; tld: string } | { hata: string } {
  const etiket = etiketNormalize(girdi);
  const hata = etiketHatasi(etiket);
  if (hata) return { hata };
  const t = tld.toLowerCase().replace(/^\./, "");
  if (!tldDestekleniyorMu(t)) return { hata: `.${t} uzantısı şu an satışa açık değil.` };
  return { alanAdi: `${etiket}.${t}`, etiket, tld: t };
}
