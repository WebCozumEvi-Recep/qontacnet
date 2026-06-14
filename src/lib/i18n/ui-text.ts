// Client bileşenlerinin statik metinleri — server tarafında çevrilip prop olarak
// geçilebilmesi için "use client" dosyalarının DIŞINDA tutulur (RSC kısıtı).

export const FAQ_DATA = {
  title: "Sıkça Sorulan Sorular",
  faqs: [
    {
      q: "NFC kartlar her telefonla çalışır mı?",
      a: "Evet, son 10 yılda üretilen akıllı telefonların %95'inde NFC özelliği mevcuttur. NFC özelliği olmayan eski modeller için ise her kartın arkasında bulunan dinamik QR kod kullanılabilir.",
    },
    {
      q: "Kart bilgileri güncellenebilir mi?",
      a: "Kesinlikle. Dijital profilinizdeki tüm bilgiler anlık olarak güncellenebilir. Fiziksel kartı değiştirmenize gerek kalmadan saniyeler içinde yeni verileri yayınlayabilirsiniz.",
    },
    {
      q: "Firma olarak tüm üyeleri görebilir miyiz?",
      a: "Evet, merkezi firma paneli üzerinden tüm üyelerinizi listeleyebilir, profillerini onaylayabilir veya pasife alabilirsiniz.",
    },
  ],
};

export const DEMO_FORM_TEXT = {
  h1: "Firmanız için örnek",
  h2: "dijital demo",
  h3: "hazırlayalım",
  desc: "Ekibinizin büyüklüğünü ve ihtiyaçlarınızı paylaşın, size özel sunumumuzu hazırlayıp iletişime geçelim.",
  successTitle: "Talebiniz alındı!",
  successDesc: "En kısa sürede sizinle iletişime geçeceğiz.",
  name: "Ad Soyad",
  firm: "Firma Adı",
  email: "E-Posta Adresi",
  phone: "Telefon",
  memberCount: "Üye Sayısı",
  message: "Mesajınız...",
  sending: "Gönderiliyor...",
  submit: "Talep Gönder",
  errGeneric: "Bir hata oluştu.",
};
export type DemoFormText = typeof DEMO_FORM_TEXT;

export const PRODUCTS_TEXT = {
  title: "Ürünler",
  subtitle: "NFC kartlarınızı ve aksesuarlarınızı doğrudan sipariş edin.",
  buy: "Satın Al",
  order: "Sipariş",
  close: "Kapat",
  nameLabel: "Ad Soyad",
  firmLabel: "Firma",
  phoneLabel: "Telefon",
  emailLabel: "E-posta",
  addressLabel: "Teslimat Adresi",
  invoiceInfo: "Fatura Bilgileri",
  individual: "Bireysel",
  corporate: "Kurumsal",
  tcNo: "T.C. Kimlik No",
  firmTitle: "Firma Unvanı",
  taxNo: "Vergi No",
  taxOffice: "Vergi Dairesi",
  quantity: "Adet",
  total: "Toplam",
  note: "Not",
  cancel: "İptal",
  toPayment: "Ödemeye Geç",
  redirecting: "Ödemeye yönlendiriliyor...",
  securePay: "Ödeme, QNB sanal POS güvenli ödeme sayfasında 3D Secure ile alınır.",
  orderFailed: "Sipariş oluşturulamadı.",
  payOk: "Ödemeniz Alındı",
  payFail: "Ödeme Tamamlanamadı",
  orderNo: "Sipariş No",
  payOkDesc: "Siparişiniz onaylandı. Faturanız ve kargo bilgileriniz e-posta adresinize iletilecek.",
  payFailDesc: "Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.",
  prev: "Önceki",
  next: "Sonraki",
};
export type ProductsText = typeof PRODUCTS_TEXT;
