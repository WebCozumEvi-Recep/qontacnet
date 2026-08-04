import "server-only";
import { prisma } from "@/lib/prisma";
import { buildPaymentForm, getQnbConfig, type PaymentForm } from "@/lib/qnbpos";
import { getDijigateConfig, odeme3dBaslat, DijigateError, type KartBilgisi, type OdemeKalemi } from "@/lib/dijigate";

// Ödeme sağlayıcısı soyutlaması. Sipariş akışları (ürün, alan adı, yenileme) doğrudan
// QNB veya DijiGate bilmez; hepsi bu dosyadaki `odemeBaslat`'ı çağırır.
//
// Sağlayıcı admin panelinden seçilir (SiteSettings.odemeSaglayici). DijiGate varsayılandır;
// QNB geçiş dönemi için yerinde bırakılmıştır ve tek ayarla geri alınabilir.

export type Saglayici = "DIJIGATE" | "QNB";

export interface OdemeBaslatGirdi {
  siparisNo: string;
  tutar: number; // TL
  email: string;
  musteriAd: string;
  kalemler: OdemeKalemi[];
  /** DijiGate için zorunlu; QNB'de kullanılmaz (kart bankanın sayfasında girilir). */
  kart?: KartBilgisi;
  clientIp?: string;
  /** Ödeme sonucunda kullanıcının döneceği uygulama içi yol (örn. "/uye/web-adresin"). */
  donusYolu: string;
  taksit?: number;
}

export type OdemeBaslatSonuc =
  /** QNB: tarayıcı bu formu bankaya POST eder. */
  | { saglayici: "QNB"; tip: "form"; paymentForm: PaymentForm }
  /** DijiGate: tarayıcı bu HTML'i render eder (banka 3D/OTP ekranı). */
  | { saglayici: "DIJIGATE"; tip: "html"; htmlContent: string; paymentId: string };

export class OdemeYapilandirmaHatasi extends Error {}

export function siteKoku(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";
}

/** Admin panelinde seçili sağlayıcı. */
export async function seciliSaglayici(): Promise<Saglayici> {
  const s = await prisma.siteSettings.findUnique({ where: { id: "site" }, select: { odemeSaglayici: true } }).catch(() => null);
  return s?.odemeSaglayici === "QNB" ? "QNB" : "DIJIGATE";
}

/** Ödeme alınabiliyor mu? Sipariş oluşturmadan önce kontrol edilir. */
export async function odemeAcikMi(): Promise<boolean> {
  const saglayici = await seciliSaglayici();
  return saglayici === "QNB" ? Boolean(await getQnbConfig()) : Boolean(await getDijigateConfig());
}

/** Seçili sağlayıcı kart bilgisi istiyor mu? (kart formu gösterilecek mi) */
export async function kartBilgisiGerekliMi(): Promise<boolean> {
  return (await seciliSaglayici()) === "DIJIGATE";
}

/**
 * Ödemeyi başlatır. Sipariş kaydına sağlayıcı bilgisi ve (DijiGate'te) paymentId yazılır.
 * Kart bilgisi yalnızca sağlayıcıya iletilir; kaydedilmez.
 */
export async function odemeBaslat(girdi: OdemeBaslatGirdi): Promise<OdemeBaslatSonuc> {
  const saglayici = await seciliSaglayici();

  if (saglayici === "QNB") {
    const cfg = await getQnbConfig();
    if (!cfg) throw new OdemeYapilandirmaHatasi("Ödeme sistemi henüz yapılandırılmadı.");

    await prisma.order.updateMany({ where: { siparisNo: girdi.siparisNo }, data: { odemeSaglayici: "QNB" } });

    return {
      saglayici: "QNB",
      tip: "form",
      paymentForm: buildPaymentForm(cfg, {
        siparisNo: girdi.siparisNo,
        tutar: girdi.tutar,
        email: girdi.email,
        musteriAd: girdi.musteriAd,
      }),
    };
  }

  const cfg = await getDijigateConfig();
  if (!cfg) throw new OdemeYapilandirmaHatasi("Ödeme sistemi henüz yapılandırılmadı.");
  if (!girdi.kart) throw new DijigateError("Kart bilgileri eksik.");

  const base = siteKoku();
  let sonuc;
  try {
    sonuc = await odeme3dBaslat(cfg, {
      siparisNo: girdi.siparisNo,
      tutar: girdi.tutar,
      taksit: girdi.taksit,
      kart: girdi.kart,
      kalemler: girdi.kalemler,
      clientIp: girdi.clientIp,
      aciklama: girdi.kalemler[0]?.name ?? "",
      // Dönüş adresine sipariş numarasını taşıyoruz; paymentId siparişte saklı.
      redirectUrl: `${base}/api/odeme/dijigate/donus?no=${encodeURIComponent(girdi.siparisNo)}&next=${encodeURIComponent(girdi.donusYolu)}`,
      callbackUrl: `${base}/api/odeme/dijigate/webhook`,
    });
  } catch (e) {
    // Başlatma reddedildiyse sipariş BEKLIYOR'da asılı kalmasın.
    await prisma.order.updateMany({
      where: { siparisNo: girdi.siparisNo, odemeDurum: "BEKLIYOR" },
      data: { odemeDurum: "BASARISIZ", odemeSaglayici: "DIJIGATE" },
    });
    throw e;
  }

  await prisma.order.updateMany({
    where: { siparisNo: girdi.siparisNo },
    data: { odemeSaglayici: "DIJIGATE", odemeId: sonuc.paymentId },
  });

  return { saglayici: "DIJIGATE", tip: "html", htmlContent: sonuc.htmlContent, paymentId: sonuc.paymentId };
}

/** İstemciden gelen kart alanlarını doğrular. Hata varsa Türkçe mesaj döner. */
export function kartCoz(body: Record<string, unknown>): KartBilgisi | { hata: string } {
  const kaynak = (body.kart ?? {}) as Record<string, unknown>;

  const numara = String(kaynak.numara ?? "").replace(/\D/g, "");
  const sahip = String(kaynak.sahip ?? "").trim().slice(0, 100);
  const ay = String(kaynak.ay ?? "").replace(/\D/g, "").padStart(2, "0");
  let yil = String(kaynak.yil ?? "").replace(/\D/g, "");
  const cvc = String(kaynak.cvc ?? "").replace(/\D/g, "");

  if (yil.length === 2) yil = `20${yil}`;

  if (!sahip) return { hata: "Kart üzerindeki ismi girin." };
  if (numara.length < 13 || numara.length > 19 || !luhn(numara)) return { hata: "Kart numarası geçersiz." };
  if (!/^(0[1-9]|1[0-2])$/.test(ay)) return { hata: "Son kullanma ayı geçersiz." };
  if (!/^20\d{2}$/.test(yil)) return { hata: "Son kullanma yılı geçersiz." };
  if (cvc.length < 3 || cvc.length > 4) return { hata: "CVC geçersiz." };

  return { sahip, numara, ay, yil, cvc };
}

/** Luhn kontrolü — bariz yazım hatalarını sağlayıcıya gitmeden yakalar. */
function luhn(numara: string): boolean {
  let toplam = 0;
  let ikile = false;
  for (let i = numara.length - 1; i >= 0; i--) {
    let n = numara.charCodeAt(i) - 48;
    if (ikile) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    toplam += n;
    ikile = !ikile;
  }
  return toplam % 10 === 0;
}

/** İstekten müşteri IP'sini çıkarır (Cloudflare → nginx → uygulama). */
export function istemciIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip")
    || headers.get("x-real-ip")
    || (headers.get("x-forwarded-for") ?? "").split(",")[0].trim()
    || ""
  );
}
