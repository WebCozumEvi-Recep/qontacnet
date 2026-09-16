// Satın almada onaylatılan sözleşmeler. İçerikler admin > Özel Sayfalar'dan
// bu slug'larla düzenlenir; pasif sayfa satın alma formunda gösterilmez.
export const SOZLESME = {
  onBilgi: "on-bilgilendirme-formu",
  mesafeli: "mesafeli-satis-sozlesmesi",
  uyelik: "uyelik-sozlesmesi",
  kvkk: "kvkk",
  iade: "iptal-ve-iade-kosullari",
} as const;

export type SozlesmeSlug = (typeof SOZLESME)[keyof typeof SOZLESME];

// Satışa özel metinlerde (ön bilgilendirme, mesafeli satış) alıcı ve sipariş
// bilgisi bu yer tutucularla gösterilir; form doldurulurken otomatik yerleşir.
export const SOZLESME_YER_TUTUCULARI = [
  ["{{ALICI_AD}}", "Alıcının adı soyadı"],
  ["{{ALICI_TELEFON}}", "Alıcının telefonu"],
  ["{{ALICI_EPOSTA}}", "Alıcının e-posta adresi"],
  ["{{ALICI_ADRES}}", "Teslimat adresi"],
  ["{{URUN}}", "Ürün adı"],
  ["{{ADET}}", "Adet"],
  ["{{TUTAR}}", "Toplam tutar (KDV dahil)"],
  ["{{TARIH}}", "Sipariş tarihi"],
] as const;

// Satıcı bilgileri: admin > Ayarlar > Satıcı Bilgileri'nden gelir, tüm özel
// sayfalarda sunucu tarafında doldurulur.
export const SATICI_YER_TUTUCULARI = [
  ["{{SATICI_UNVAN}}", "Şirket unvanı"],
  ["{{SATICI_ADRES}}", "Şirket adresi"],
  ["{{SATICI_TELEFON}}", "Telefon"],
  ["{{SATICI_EPOSTA}}", "E-posta"],
  ["{{SATICI_VERGI}}", "Vergi dairesi / numarası"],
  ["{{SATICI_MERSIS}}", "MERSİS numarası"],
  ["{{SATICI_IADE_ADRESI}}", "İade adresi"],
  ["{{TESLIMAT_MASRAFI}}", "Teslimat masrafının kime ait olduğu"],
] as const;

export type SozlesmeDegerleri = Partial<Record<(typeof SOZLESME_YER_TUTUCULARI)[number][0], string>>;

const kacir = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML içerikteki verilen yer tutucuları kaçırılmış değerlerle doldurur; boş olanlar "—" olur. */
export function yerTutucuDoldur(html: string, anahtarlar: readonly string[], degerler: Record<string, string | undefined>): string {
  return anahtarlar.reduce((acc, anahtar) => acc.split(anahtar).join(kacir(degerler[anahtar]?.trim() || "—")), html);
}

/** Alıcı/sipariş yer tutucularını doldurur (satın alma formunda, tarayıcıda). */
export function sozlesmeDoldur(html: string, degerler: SozlesmeDegerleri): string {
  return yerTutucuDoldur(html, SOZLESME_YER_TUTUCULARI.map(([k]) => k), degerler);
}
