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

export type SozlesmeDegerleri = Partial<Record<(typeof SOZLESME_YER_TUTUCULARI)[number][0], string>>;

const kacir = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML içerikteki yer tutucuları kaçırılmış değerlerle doldurur; boş olanlar "—" olur. */
export function sozlesmeDoldur(html: string, degerler: SozlesmeDegerleri): string {
  return SOZLESME_YER_TUTUCULARI.reduce(
    (acc, [anahtar]) => acc.split(anahtar).join(kacir(degerler[anahtar]?.trim() || "—")),
    html,
  );
}
