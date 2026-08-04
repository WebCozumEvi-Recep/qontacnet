// Üyenin kendi web adresini tanıtması için hazır içerik üreticileri.
// Saf fonksiyonlar — hem sunucuda hem istemcide kullanılabilir.

export interface TanitimKisi {
  ad: string;
  soyad: string;
  unvan: string;
  telefon: string;
  email: string;
  alanAdi: string; // "abcd.com"
}

export function adSoyad(k: TanitimKisi): string {
  return `${k.ad} ${k.soyad}`.trim();
}

export function webAdresi(k: TanitimKisi): string {
  return `www.${k.alanAdi}`;
}

export function webUrl(k: TanitimKisi): string {
  return `https://${k.alanAdi}`;
}

/**
 * Gmail/Outlook'a yapıştırılabilir HTML e-posta imzası.
 * Tablo tabanlı ve inline stilli — e-posta istemcileri modern CSS'i desteklemez.
 */
export function imzaHtml(k: TanitimKisi, renk = "#d4af37"): string {
  const satir = (icerik: string) => `<tr><td style="padding:1px 0;font-size:13px;color:#4b5563;">${icerik}</td></tr>`;
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
  <tr><td style="padding:0 0 4px;font-size:16px;font-weight:bold;color:#111827;">${adSoyad(k)}</td></tr>
  ${k.unvan ? satir(`<span style="color:#6b7280;">${k.unvan}</span>`) : ""}
  <tr><td style="padding:6px 0 0;border-top:2px solid ${renk};"></td></tr>
  ${k.telefon ? satir(`Tel: <a href="tel:${k.telefon.replace(/\s/g, "")}" style="color:#4b5563;text-decoration:none;">${k.telefon}</a>`) : ""}
  ${k.email ? satir(`E-posta: <a href="mailto:${k.email}" style="color:#4b5563;text-decoration:none;">${k.email}</a>`) : ""}
  ${satir(`<a href="${webUrl(k)}" style="color:${renk};font-weight:bold;text-decoration:none;">${webAdresi(k)}</a>`)}
</table>`;
}

/** İmzanın düz metin karşılığı (imza HTML'i desteklemeyen istemciler için). */
export function imzaMetin(k: TanitimKisi): string {
  return [adSoyad(k), k.unvan, k.telefon, k.email, webAdresi(k)].filter(Boolean).join("\n");
}

export interface PaylasimMetni {
  baslik: string;
  aciklama: string;
  metin: string;
}

/** Sosyal medya ve mesajlaşma için hazır tanıtım metinleri. */
export function paylasimMetinleri(k: TanitimKisi): PaylasimMetni[] {
  const ad = adSoyad(k);
  const adres = webAdresi(k);
  const unvanli = k.unvan ? `${ad} — ${k.unvan}` : ad;

  return [
    {
      baslik: "LinkedIn / Instagram biyografisi",
      aciklama: "Profilinizin bio alanına yapıştırın.",
      metin: `${unvanli}\n📍 ${adres}`,
    },
    {
      baslik: "Duyuru gönderisi",
      aciklama: "Yeni adresinizi takipçilerinize duyurun.",
      metin: `Artık kendi web adresim var! 🎉\n\nBana ulaşmak, hizmetlerimi görmek ve iletişim bilgilerimi tek dokunuşla kaydetmek için:\n👉 ${adres}\n\n${unvanli}`,
    },
    {
      baslik: "WhatsApp durumu / kısa mesaj",
      aciklama: "Kısa ve doğrudan.",
      metin: `Merhaba, ben ${ad}. Tüm iletişim bilgilerim ve hizmetlerim burada: ${adres}`,
    },
    {
      baslik: "E-posta alt bilgisi",
      aciklama: "Yazışmalarınızın sonuna ekleyin.",
      metin: `${unvanli} | ${adres}`,
    },
    {
      baslik: "Kartvizit arkası",
      aciklama: "Basılı kartvizitinizin arka yüzü için.",
      metin: `${adres}\nTelefonunuzun kamerasını QR koda tutun,\ntüm bilgilerimi anında kaydedin.`,
    },
  ];
}

export interface TanitimAdimi {
  anahtar: string;
  baslik: string;
  aciklama: string;
  ikon: string;
}

/** Üyenin işaretleyebileceği tanıtım kontrol listesi. */
export const TANITIM_ADIMLARI: TanitimAdimi[] = [
  { anahtar: "imza", baslik: "E-posta imzanıza ekleyin", aciklama: "Gönderdiğiniz her e-posta bir tanıtım fırsatıdır.", ikon: "mail" },
  { anahtar: "sosyal", baslik: "Sosyal medya biyografilerinizi güncelleyin", aciklama: "LinkedIn, Instagram ve X profillerinize adresinizi yazın.", ikon: "share" },
  { anahtar: "whatsapp", baslik: "WhatsApp profilinize yazın", aciklama: "Durum ve hakkımda alanına adresinizi ekleyin.", ikon: "chat" },
  { anahtar: "kartvizit", baslik: "Basılı kartvizitinize bastırın", aciklama: "QR kodu ve adresi kartvizitinizin arkasına koyun.", ikon: "badge" },
  { anahtar: "arac", baslik: "Araç/vitrin giydirmesine ekleyin", aciklama: "Aracınızda veya iş yerinizde görünür olsun.", ikon: "storefront" },
  { anahtar: "google", baslik: "Google İşletme Profilinize ekleyin", aciklama: "İşletme profilinizdeki web sitesi alanına yazın.", ikon: "travel_explore" },
  { anahtar: "duyuru", baslik: "Müşterilerinize duyurun", aciklama: "Mevcut müşterilerinize yeni adresinizi bildirin.", ikon: "campaign" },
];

/** Hazır paylaşım bağlantıları. */
export function paylasimBaglantilari(k: TanitimKisi): { ad: string; ikon: string; url: string }[] {
  const url = webUrl(k);
  const metin = `${adSoyad(k)} — ${webAdresi(k)}`;
  return [
    { ad: "WhatsApp", ikon: "chat", url: `https://wa.me/?text=${encodeURIComponent(`${metin}\n${url}`)}` },
    { ad: "LinkedIn", ikon: "work", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { ad: "X", ikon: "tag", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(metin)}&url=${encodeURIComponent(url)}` },
    { ad: "E-posta", ikon: "mail", url: `mailto:?subject=${encodeURIComponent(metin)}&body=${encodeURIComponent(url)}` },
  ];
}
