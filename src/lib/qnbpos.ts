import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// QNB Finansbank Sanal POS — PayFor altyapısı, 3DHost modeli.
// Kart bilgisi bankanın hosted ödeme sayfasında girilir; biz SHA-1 imzalı form
// POST'larız, banka sonucu OkUrl/FailUrl'e POST eder ve ResponseHash doğrulanır.
//
// Yapılandırma: Admin panelinden "Sanal POS Ayarları" (SiteSettings) doldurulur.
// Bilgiler oradan okunur; boşsa aşağıdaki env değişkenlerine düşer (geriye dönük uyumluluk):
//   QNB_MERCHANT_ID   — Üye işyeri numarası (örn. 085300000021907)
//   QNB_USER_CODE     — API kullanıcı adı (örn. wceapi)
//   QNB_MERCHANT_PASS — Mağaza 3D anahtarı (MerchantPass / StoreKey; işyeri panelinden)
//   QNB_MBR_ID        — Kurum kodu, QNB Finansbank için "5" (varsayılan)
//   QNB_GATE_URL      — 3DHost gate. Canlı: https://vpos.qnbfinansbank.com/Gateway/3DHost.aspx
//                       Test:  https://vpostest.qnbfinansbank.com/Gateway/3DHost.aspx
//   NEXT_PUBLIC_BASE_URL — callback adresleri için site kökü (örn. https://qontac.net)

const GATE_TEST = "https://vpostest.qnbfinansbank.com/Gateway/3DHost.aspx";
const GATE_LIVE = "https://vpos.qnbfinansbank.com/Gateway/3DHost.aspx";

export interface QnbConfig {
  mbrId: string;
  merchantId: string;
  userCode: string;
  merchantPass: string;
  terminalId: string;
  apiPassword: string;
  currency: string;
  lang: string;
  gateUrl: string;
}

// Aktif POS yapılandırmasını döndürür. Öncelik: admin panelinde aktif edilmiş DB ayarları,
// yoksa env değişkenleri. Eksikse null (ödeme kapalı).
export async function getQnbConfig(): Promise<QnbConfig | null> {
  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } }).catch(() => null);

  if (s?.qnbAktif && s.qnbMerchantId && s.qnbUserCode && s.qnbMerchantPass) {
    return {
      mbrId: s.qnbMbrId || "5",
      merchantId: s.qnbMerchantId,
      userCode: s.qnbUserCode,
      merchantPass: s.qnbMerchantPass,
      terminalId: s.qnbTerminalId || "",
      apiPassword: s.qnbApiPassword || "",
      currency: s.qnbCurrency || "949",
      lang: s.qnbLang || "tr",
      gateUrl: s.qnbTest ? GATE_TEST : GATE_LIVE,
    };
  }

  if (
    process.env.QNB_MERCHANT_ID &&
    process.env.QNB_USER_CODE &&
    process.env.QNB_MERCHANT_PASS &&
    process.env.QNB_GATE_URL
  ) {
    return {
      mbrId: process.env.QNB_MBR_ID || "5",
      merchantId: process.env.QNB_MERCHANT_ID,
      userCode: process.env.QNB_USER_CODE,
      merchantPass: process.env.QNB_MERCHANT_PASS,
      terminalId: process.env.QNB_TERMINAL_ID || "",
      apiPassword: process.env.QNB_API_PASSWORD || "",
      currency: process.env.QNB_CURRENCY || "949",
      lang: process.env.QNB_LANG || "tr",
      gateUrl: process.env.QNB_GATE_URL,
    };
  }

  return null;
}

// PayFor hash: alanlar ayraçsız birleştirilir, SHA-1 base64 alınır
function sha1b64(s: string): string {
  return createHash("sha1").update(s, "utf8").digest("base64");
}

export interface PaymentForm {
  url: string;
  fields: Record<string, string>;
}

export function buildPaymentForm(cfg: QnbConfig, opts: {
  siparisNo: string;
  tutar: number; // lira (tam sayı)
  email: string;
  musteriAd: string;
}): PaymentForm {
  const { mbrId, merchantId, userCode, merchantPass, terminalId, currency, lang, gateUrl } = cfg;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  const okUrl = `${baseUrl}/api/odeme/callback`;
  const failUrl = `${baseUrl}/api/odeme/callback`;
  const purchAmount = `${opts.tutar}`; // TL, tam sayı (örn. "1500")
  const txnType = "Auth";
  const installment = "0";
  const rnd = randomBytes(12).toString("hex");

  // Hash = SHA1(MbrId + OrderId + PurchAmount + OkUrl + FailUrl + TxnType + InstallmentCount + Rnd + MerchantPass)
  const hash = sha1b64(mbrId + opts.siparisNo + purchAmount + okUrl + failUrl + txnType + installment + rnd + merchantPass);

  const fields: Record<string, string> = {
    MbrId: mbrId,
    MerchantID: merchantId,
    UserCode: userCode,
    OrderId: opts.siparisNo,
    Lang: lang || "tr",
    SecureType: "3DHost",
    TxnType: txnType,
    PurchAmount: purchAmount,
    InstallmentCount: installment,
    Currency: currency || "949",
    OkUrl: okUrl,
    FailUrl: failUrl,
    Rnd: rnd,
    Hash: hash,
  };
  // Terminal ID tanımlıysa forma eklenir (bazı üye işyeri yapılandırmaları ister).
  if (terminalId) fields.TerminalID = terminalId;

  return { url: gateUrl, fields };
}

// Banka callback'inin ResponseHash'ini doğrular:
// SHA1(MerchantID + MerchantPass + OrderId + AuthCode + ProcReturnCode + 3DStatus + ResponseRnd + UserCode)
export function verifyCallback(cfg: QnbConfig, params: Record<string, string>): boolean {
  const { merchantId, merchantPass, userCode } = cfg;
  if (!merchantId || !merchantPass || !userCode || !params.ResponseHash) return false;

  const expected = sha1b64(
    merchantId +
    merchantPass +
    (params.OrderId ?? "") +
    (params.AuthCode ?? "") +
    (params.ProcReturnCode ?? "") +
    (params["3DStatus"] ?? "") +
    (params.ResponseRnd ?? "") +
    userCode
  );
  return expected === params.ResponseHash;
}

// Ödeme onaylandı mı? 3DHost'ta banka tahsilatı tamamlar; 00 = başarılı.
export function isPaymentApproved(params: Record<string, string>): boolean {
  return params.ProcReturnCode === "00";
}
