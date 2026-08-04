import "server-only";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// DijiGate Gateway — kart ödemeleri.
// Doküman: https://digigate.gitbook.io/digigate-gateway-api-entegrasyon-dokumani
//
// Akış (3D Secure):
//   1. POST /payment/v1/card-payments/3ds-init   → paymentId + htmlContent
//      htmlContent tarayıcıda render edilir, kullanıcı bankanın 3D/OTP ekranına gider
//   2. Banka doğrulamadan sonra `redirectUrl` adresimize döner
//   3. POST /payment/v1/card-payments/3ds-complete { paymentId } → paymentStatus
//   4. Ayrıca `callbackUrl` adresine webhook düşer (yedek doğrulama)
//
// ÖNEMLİ — kart verisi: 3ds-init isteği ham kart bilgisi taşır. Bu veri hiçbir yerde
// saklanmaz, loglanmaz ve hata mesajlarına konmaz; yalnızca istek gövdesinde iletilir.
// Bu dosyada kart alanlarını console'a yazan bir kod ASLA bulunmamalıdır.

const API_TEST = "https://appapi-dev.dijigate.com";
const API_LIVE = "https://appapi.dijigate.com";

export class DijigateError extends Error {
  constructor(message: string, readonly kod?: string, readonly grup?: string) {
    super(message);
    this.name = "DijigateError";
  }
}

export interface DijigateConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  test: boolean;
}

/** Aktif DijiGate yapılandırması. Eksikse null (sağlayıcı kullanılamaz). */
export async function getDijigateConfig(): Promise<DijigateConfig | null> {
  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } }).catch(() => null);

  if (s?.dijigateAktif && s.dijigateApiKey && s.dijigateSecretKey) {
    return {
      baseUrl: s.dijigateTest ? API_TEST : API_LIVE,
      apiKey: s.dijigateApiKey,
      secretKey: s.dijigateSecretKey,
      test: s.dijigateTest,
    };
  }

  const apiKey = process.env.DIJIGATE_API_KEY;
  const secretKey = process.env.DIJIGATE_SECRET_KEY;
  if (apiKey && secretKey) {
    const test = process.env.DIJIGATE_TEST !== "false";
    return { baseUrl: test ? API_TEST : API_LIVE, apiKey, secretKey, test };
  }

  return null;
}

/**
 * İmza: SHA256(requestUrl + apiKey + secretKey + rndKey) — ayraçsız, hex çıktı.
 * `requestUrl` protokol, ana bilgisayar ve sorgu parametreleri dahil TAM adrestir.
 */
function imzala(requestUrl: string, cfg: DijigateConfig, rndKey: string): string {
  return createHash("sha256")
    .update(requestUrl + cfg.apiKey + cfg.secretKey + rndKey, "utf8")
    .digest("hex");
}

interface HataYaniti {
  errors?: {
    errorCode?: string; error_code?: string;
    errorDescription?: string; error_message?: string;
    errorGroup?: string; error_group?: string;
  };
}

/** Yanıttaki hata bloğunu (iki farklı alan adlandırması da geçiyor) ayrıştırır. */
function hataCoz(govde: unknown): DijigateError | null {
  const e = (govde as HataYaniti | null)?.errors;
  if (!e) return null;
  return new DijigateError(
    e.errorDescription || e.error_message || "Ödeme sırasında bir hata oluştu.",
    e.errorCode || e.error_code,
    e.errorGroup || e.error_group,
  );
}

async function istek<T>(
  cfg: DijigateConfig,
  yol: string,
  opts: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const requestUrl = cfg.baseUrl + yol;
  const rndKey = randomUUID();

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      method: opts.method ?? "GET",
      headers: {
        "x-api-key": cfg.apiKey,
        "x-rnd-key": rndKey,
        "x-auth-version": "V1",
        "x-signature": imzala(requestUrl, cfg, rndKey),
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new DijigateError("Ödeme servisine ulaşılamadı. Lütfen tekrar deneyin.");
  }

  // Gövde kart verisi içermez (yanıtta yalnızca maskeli bilgiler döner) ama yine de
  // ham metni hata mesajına koymuyoruz.
  const govde = (await res.json().catch(() => null)) as unknown;

  const hata = hataCoz(govde);
  if (hata) throw hata;

  if (!res.ok) throw new DijigateError(`Ödeme servisi hata döndü (${res.status}).`);
  if (govde === null) throw new DijigateError("Ödeme servisinden beklenmeyen yanıt alındı.");

  return govde as T;
}

// ————————————————————————————————————————————————————————— 3D ödeme

/** Kart bilgileri — yalnızca istek gövdesinde taşınır, hiçbir yerde saklanmaz. */
export interface KartBilgisi {
  sahip: string;
  numara: string;
  ay: string;   // "12"
  yil: string;  // "2030"
  cvc: string;
}

export interface OdemeKalemi {
  id?: string;
  name: string;
  price: number;
}

export interface Odeme3dBaslatGirdi {
  siparisNo: string;
  tutar: number;      // TL
  taksit?: number;
  kart: KartBilgisi;
  kalemler: OdemeKalemi[];
  redirectUrl: string;
  callbackUrl: string;
  clientIp?: string;
  aciklama?: string;
}

export interface Odeme3dBaslatSonuc {
  paymentId: string;
  /** Tarayıcıda render edilecek banka 3D formu. */
  htmlContent: string;
  redirectUrl?: string;
  paymentStatus?: string;
}

/** 3D ödemeyi başlatır; dönen htmlContent tarayıcıda render edilmelidir. */
export async function odeme3dBaslat(cfg: DijigateConfig, girdi: Odeme3dBaslatGirdi): Promise<Odeme3dBaslatSonuc> {
  const yanit = await istek<{
    htmlContent?: string; paymentId?: number | string; redirectUrl?: string; paymentStatus?: string;
  }>(cfg, "/payment/v1/card-payments/3ds-init", {
    method: "POST",
    body: {
      price: girdi.tutar,
      paidPrice: girdi.tutar,
      installment: girdi.taksit && girdi.taksit > 1 ? girdi.taksit : 1,
      currency: "TRY",
      bankOrderId: girdi.siparisNo,
      conversationId: girdi.siparisNo,
      redirectUrl: girdi.redirectUrl,
      callbackUrl: girdi.callbackUrl,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      description: girdi.aciklama ?? "",
      ...(girdi.clientIp ? { clientIp: girdi.clientIp } : {}),
      card: {
        cardHolderName: girdi.kart.sahip,
        cardNumber: girdi.kart.numara,
        expireMonth: girdi.kart.ay,
        expireYear: girdi.kart.yil,
        cvc: girdi.kart.cvc,
      },
      items: girdi.kalemler.map(k => ({ ...(k.id ? { id: k.id } : {}), name: k.name, price: k.price })),
      additionalParams: "",
    },
  });

  if (!yanit.paymentId || !yanit.htmlContent) {
    throw new DijigateError("Ödeme başlatılamadı. Lütfen kart bilgilerinizi kontrol edin.");
  }

  return {
    paymentId: String(yanit.paymentId),
    htmlContent: yanit.htmlContent,
    redirectUrl: yanit.redirectUrl,
    paymentStatus: yanit.paymentStatus,
  };
}

export interface OdemeSonuc {
  paymentId: string;
  /** SUCCESS | FAILURE | INITIAL | ... */
  paymentStatus: string;
  basarili: boolean;
  bankOrderId: string;
  authCode: string;
  transId: string;
  tutar: number;
  hataMesaji: string;
}

function odemeCoz(y: Record<string, unknown>): OdemeSonuc {
  const durum = String(y.paymentStatus ?? "");
  const ek = y.additionalData;
  const ekHata = typeof ek === "object" && ek !== null ? hataCoz(ek) : null;

  return {
    paymentId: String(y.id ?? ""),
    paymentStatus: durum,
    basarili: durum === "SUCCESS",
    bankOrderId: String(y.orderId ?? y.conversationId ?? ""),
    authCode: String(y.authCode ?? ""),
    transId: String(y.transId ?? ""),
    tutar: Number(y.paidPrice ?? y.price ?? 0),
    hataMesaji: ekHata?.message ?? (typeof ek === "string" && durum !== "SUCCESS" ? ek : ""),
  };
}

/** 3D doğrulaması sonrası ödemeyi tamamlar (kesinleştirir). */
export async function odeme3dTamamla(cfg: DijigateConfig, paymentId: string): Promise<OdemeSonuc> {
  const y = await istek<Record<string, unknown>>(cfg, "/payment/v1/card-payments/3ds-complete", {
    method: "POST",
    body: { paymentId: Number(paymentId) },
  });
  return odemeCoz(y);
}

/** Ödemenin güncel durumunu sorgular (webhook ve mutabakat için). */
export async function odemeSorgula(cfg: DijigateConfig, paymentId: string): Promise<OdemeSonuc> {
  const y = await istek<Record<string, unknown>>(cfg, `/payment/v1/card-payments/${encodeURIComponent(paymentId)}`);
  return odemeCoz(y);
}
