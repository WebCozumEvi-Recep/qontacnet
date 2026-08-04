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
 * Türkçe harflerin ASCII karşılıkları. Punycode'lu (xn--) alan adları teoride
 * mümkün ama pratikte e-postada, kartvizitte ve reklamda sorun çıkardığı için
 * Türkçe karakterleri kaydetmek yerine sadeleştiriyoruz.
 *
 * Not: JS'in `toLowerCase()`'i Türkçe'ye uygun değil ("I" → "i", "İ" → birleşik
 * noktalı i). Bu yüzden büyük harfleri de burada açıkça eşliyoruz.
 */
const TURKCE_HARFLER: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
};

/**
 * Kullanıcının yazdığını alan adında kullanılabilir hâle getirir:
 * küçük harfe çevirir, Türkçe harfleri ASCII karşılığına dönüştürür ve
 * geçersiz karakterleri atar. Yazarken anlık uygulanabilir (kullanıcı
 * "ÇİÇEKÇİ" yazsa da kutuda "cicekci" görür).
 */
export function harfDonustur(girdi: string): string {
  let s = "";
  for (const ch of girdi || "") {
    const tr = TURKCE_HARFLER[ch];
    s += tr ?? ch.toLowerCase();
  }
  // Alan adında yalnızca harf, rakam ve tire olabilir.
  return s.replace(/[^a-z0-9-]/g, "");
}

/**
 * Kullanıcının yazdığı metinden alan adı etiketini (uzantısız kısım) çıkarır.
 * "www.ÇİÇEKÇİ.com/x" → "cicekci".
 */
export function etiketNormalize(girdi: string): string {
  let s = (girdi || "").trim();
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  // Kullanıcı uzantı da yazdıysa yalnızca ilk etiketi al.
  s = s.split(".")[0];
  return harfDonustur(s);
}

/** Girdide uzantı verilmişse döndürür (desteklenmese bile), yoksa boş string. */
export function girilenTld(girdi: string): string {
  const s = (girdi || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const parcalar = s.split(".");
  return parcalar.length > 1 ? parcalar.slice(1).join(".") : "";
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
