import "server-only";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
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

const HESAP_TOKEN_SURESI_MS = 7 * 24 * 60 * 60 * 1000;

type HesapSiparis = { id: string; siparisNo: string; firmaId: string | null; hesapToken: string | null; musteriAd: string; email: string; telefon: string };

/**
 * Firma satış linkinden gelen ödenmiş sipariş için üye hesabı.
 * E-posta kayıtlı değilse firmaya bağlı yeni üye açılır ve şifre belirleme bağlantısı
 * (siparişin hesapToken'ı) gönderilir; kayıtlıysa sipariş o hesaba bağlanır.
 */
async function uyeHesabiHazirla(order: HesapSiparis) {
  const email = order.email.trim().toLowerCase();
  if (!email || !order.hesapToken) return;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  const mevcut = await prisma.member.findUnique({ where: { email }, select: { id: true, firmaId: true } });
  if (mevcut) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { memberId: mevcut.id } }),
      ...(!mevcut.firmaId && order.firmaId
        ? [prisma.member.update({ where: { id: mevcut.id }, data: { firmaId: order.firmaId } })]
        : []),
    ]);
    after(() => sendMail({
      to: email,
      subject: `Siparişiniz hesabınıza eklendi — ${order.siparisNo}`,
      html: htmlLayout("Siparişiniz Hesabınıza Eklendi", `
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Bu e-posta adresiyle zaten bir QONTAC hesabınız olduğu için siparişiniz mevcut hesabınıza bağlandı. Kartınız elinize ulaştığında hesabınıza giriş yapıp kartı okutarak aktive edebilirsiniz.</p>
        <p style="margin:0;"><a href="${base}/auth/login" style="color:#b8860b;font-weight:600;">Giriş yap →</a></p>`),
    }).catch(e => console.error("Hesap e-postası gönderilemedi:", e)));
    return;
  }

  const [ad, ...soyad] = order.musteriAd.trim().split(/\s+/);
  const uye = await prisma.member.create({
    data: {
      ad: ad || order.musteriAd,
      soyad: soyad.join(" "),
      email,
      telefon: order.telefon,
      firmaId: order.firmaId,
      // Kullanıcı kendi şifresini belirleyene kadar kimsenin bilmediği rastgele bir şifre.
      passwordHash: bcrypt.hashSync(randomBytes(24).toString("hex"), 10),
      resetToken: order.hesapToken,
      resetExpiry: new Date(Date.now() + HESAP_TOKEN_SURESI_MS),
    },
  });
  await prisma.order.update({ where: { id: order.id }, data: { memberId: uye.id } });

  const link = `${base}/auth/reset-password/${order.hesapToken}?role=uye`;
  after(() => sendMail({
    to: email,
    subject: "QONTAC hesabınız oluşturuldu — şifrenizi belirleyin",
    html: htmlLayout("Hesabınız Hazır", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Siparişiniz (${order.siparisNo}) için QONTAC üyelik hesabınız oluşturuldu. Aşağıdaki bağlantıdan şifrenizi belirleyerek hesabınıza giriş yapabilirsiniz. Bağlantı 7 gün geçerlidir.</p>
      <p style="margin:0 0 16px;"><a href="${link}" style="display:inline-block;padding:12px 20px;background:#d4af37;color:#000;border-radius:10px;font-weight:700;text-decoration:none;">Şifremi Belirle</a></p>
      <p style="margin:0;font-size:12px;color:#6b7280;">Giriş e-postanız: ${email}</p>`),
  }).catch(e => console.error("Hesap e-postası gönderilemedi:", e)));
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
    if (order.kaynak === "FIRMA_LINK") {
      try { await uyeHesabiHazirla(order); } catch (e) { console.error("Üye hesabı açılamadı:", order.siparisNo, e); }
    }
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
export function sonucYolu(kaynak: string, firmaId?: string | null): string {
  if (kaynak === "FIRMA_LINK" && firmaId) return `/f/${firmaId}`;
  return DOMAIN_KAYNAKLARI.includes(kaynak) ? "/uye/web-adresin" : "/";
}
