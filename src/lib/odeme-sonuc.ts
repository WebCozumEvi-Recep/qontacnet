import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, htmlLayout, row } from "@/lib/mailer";
import { alanAdiKurulumBaslat, alanAdiYenilemeTamamla } from "@/lib/alan-adi-kurulum";

// Ödeme sonucunun sipariş tarafındaki etkileri — sağlayıcıdan bağımsız.
// Hem QNB callback'i hem DijiGate dönüş/webhook'u buradan geçer, böylece
// e-posta gönderimi ve alan adı kurulumu tek yerde tanımlı kalır.

/** Alan adı siparişleri kargo/fatura akışına girmez; kaynak alanından ayırt edilir. */
export const DOMAIN_KAYNAKLARI = ["DOMAIN", "DOMAIN_YENILEME"];

type SiteOrder = {
  siparisNo: string; urun: string; adet: number; tutar: number;
  musteriAd: string; email: string; telefon: string; adres: string;
  faturaTip: string; tcKimlik: string; vergiNo: string; vergiDairesi: string; firmaUnvan: string;
};

/** Ödeme onayı sonrası müşteri + admin bilgilendirmesi (hata olsa da akışı bozmaz). */
export async function sendOrderEmails(order: SiteOrder) {
  const detay = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
    ${row("Sipariş No", order.siparisNo)}
    ${row("Ürün", `${order.urun} × ${order.adet}`)}
    ${row("Tutar", `₺${order.tutar.toLocaleString("tr-TR")} (ödendi)`)}
    ${row("Ad Soyad", order.musteriAd)}
    ${row("Telefon", order.telefon)}
    ${row("Teslimat Adresi", order.adres)}
    ${row("Fatura Tipi", order.faturaTip === "KURUMSAL" ? "Kurumsal" : "Bireysel")}
    ${order.faturaTip === "KURUMSAL"
      ? row("Firma Unvanı", order.firmaUnvan) + row("Vergi No", order.vergiNo) + row("Vergi Dairesi", order.vergiDairesi)
      : row("T.C. Kimlik", order.tcKimlik)}
  </table>`;

  const tasks: Promise<unknown>[] = [];
  if (order.email) {
    tasks.push(sendMail({
      to: order.email,
      subject: `Siparişiniz alındı — ${order.siparisNo}`,
      html: htmlLayout("Ödemeniz Alındı, Teşekkürler!", `
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Siparişiniz onaylandı ve hazırlanmaya başlandı. Faturanız fatura bilgilerinize göre düzenlenip bu e-posta adresine iletilecek.</p>
        ${detay}`),
    }));
  }
  tasks.push(sendMail({
    subject: `🛒 Yeni ödenmiş sipariş — ${order.siparisNo} (₺${order.tutar.toLocaleString("tr-TR")})`,
    html: htmlLayout("Site Üzerinden Yeni Sipariş", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Ödemesi kredi kartı ile alınmış yeni bir sipariş düştü. Fatura kesilmesi ve kargo süreci için aksiyon alın.</p>
      ${detay}
      ${order.email ? row("Müşteri E-posta", order.email) : ""}`),
  }));
  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Sipariş e-postası gönderilemedi:", r.reason);
  });
}

/**
 * Ödeme onaylandığında çağrılır. Idempotent: sipariş zaten ODENDI ise hiçbir şey yapmaz,
 * böylece çift callback (dönüş + webhook) yan etkileri tekrarlamaz.
 *
 * @returns işlem bu çağrıda mı gerçekleşti (false = zaten işlenmişti)
 */
export async function odemeOnaylandi(siparisNo: string, ref: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { siparisNo } });
  if (!order || order.odemeDurum === "ODENDI") return false;

  await prisma.order.update({
    where: { id: order.id },
    data: { odemeDurum: "ODENDI", odemeRef: ref.slice(0, 100) },
  });

  if (DOMAIN_KAYNAKLARI.includes(order.kaynak)) {
    // Kayıt + Cloudflare adımları birkaç saniye sürebilir; kullanıcıyı bekletmeden
    // yanıt döndürüp kurulumu arka planda başlatıyoruz.
    const kayit = await prisma.alanAdi.findFirst({ where: { siparisNo: order.siparisNo } });
    if (kayit) {
      const yenileme = order.kaynak === "DOMAIN_YENILEME";
      after(() => (yenileme ? alanAdiYenilemeTamamla(kayit.id) : alanAdiKurulumBaslat(kayit.id)));
    }
  } else {
    try { await sendOrderEmails(order); } catch { /* mail hatası ödemeyi etkilemesin */ }
  }

  return true;
}

/** Ödeme reddedildiğinde çağrılır. Onaylanmış siparişi geri almaz. */
export async function odemeBasarisiz(siparisNo: string, mesaj: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { siparisNo } });
  if (!order || order.odemeDurum === "ODENDI") return;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      odemeDurum: "BASARISIZ",
      notlar: `${order.notlar ? order.notlar + " | " : ""}Ödeme hatası: ${mesaj || "bilinmiyor"}`.slice(0, 1000),
    },
  });
}

/** Sipariş kaynağına göre kullanıcının döneceği sayfa. */
export function sonucYolu(kaynak: string): string {
  return DOMAIN_KAYNAKLARI.includes(kaynak) ? "/uye/web-adresin" : "/";
}
