// Alan adı satış fiyatı — tek doğruluk kaynağı.
// Sorgulama ekranında gösterilen fiyat ile siparişte tahsil edilen tutar
// aynı fonksiyondan üretilir; istemciden gelen fiyata asla güvenilmez.

export interface FiyatAyarlari {
  /** Bayi maliyetinin üzerine eklenen yüzde (SiteSettings.domainKarMarji). */
  karMarji: number;
  /** Yüzde bunun altında kalırsa bu kadar TL kâr eklenir (SiteSettings.domainMinKar). */
  minKar: number;
}

/**
 * Bayi maliyetinden (TRY, kuruş) üyeye kesilecek tutarı hesaplar.
 *
 * QNB PayFor `PurchAmount` alanını tam TL olarak gönderdiğimiz için sonuç
 * tam TL'ye **yukarı** yuvarlanır (bkz. src/lib/qnbpos.ts).
 */
export function satisFiyati(maliyetKurus: number, ayar: FiyatAyarlari): number {
  const maliyetTl = Math.max(0, maliyetKurus) / 100;
  const yuzdeKar = (maliyetTl * Math.max(0, ayar.karMarji)) / 100;
  const kar = Math.max(yuzdeKar, Math.max(0, ayar.minKar));
  return Math.max(1, Math.ceil(maliyetTl + kar));
}

/** TRY tutarını kuruşa çevirir (API ondalıklı döner: 527.51 → 52751). */
export function tlKurusaCevir(tutar: number): number {
  return Math.round(Number(tutar) * 100);
}

/** "1.234 TL" biçiminde gösterim. */
export function fiyatMetni(tl: number): string {
  return `${tl.toLocaleString("tr-TR")} TL`;
}
