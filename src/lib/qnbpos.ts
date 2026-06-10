import { createHash, randomBytes } from "crypto";

// QNB Finansbank Sanal POS — PayFor altyapısı, 3DHost modeli.
// Kart bilgisi bankanın hosted ödeme sayfasında girilir; biz SHA-1 imzalı form
// POST'larız, banka sonucu OkUrl/FailUrl'e POST eder ve ResponseHash doğrulanır.
//
// Gerekli env değişkenleri (.env.production):
//   QNB_MERCHANT_ID   — Üye işyeri numarası (örn. 085300000021907)
//   QNB_USER_CODE     — API kullanıcı adı (örn. wceapi)
//   QNB_MERCHANT_PASS — Mağaza 3D anahtarı (MerchantPass / StoreKey; işyeri panelinden)
//   QNB_MBR_ID        — Kurum kodu, QNB Finansbank için "5" (varsayılan)
//   QNB_GATE_URL      — 3DHost gate. Canlı: https://vpos.qnbfinansbank.com/Gateway/3DHost.aspx
//                       Test:  https://vpostest.qnbfinansbank.com/Gateway/3DHost.aspx
//   NEXT_PUBLIC_BASE_URL — callback adresleri için site kökü (örn. https://qontac.net)

export function qnbConfigured(): boolean {
  return Boolean(
    process.env.QNB_MERCHANT_ID &&
    process.env.QNB_USER_CODE &&
    process.env.QNB_MERCHANT_PASS &&
    process.env.QNB_GATE_URL
  );
}

// PayFor hash: alanlar ayraçsız birleştirilir, SHA-1 base64 alınır
function sha1b64(s: string): string {
  return createHash("sha1").update(s, "utf8").digest("base64");
}

export interface PaymentForm {
  url: string;
  fields: Record<string, string>;
}

export function buildPaymentForm(opts: {
  siparisNo: string;
  tutar: number; // lira (tam sayı)
  email: string;
  musteriAd: string;
}): PaymentForm {
  const mbrId = process.env.QNB_MBR_ID || "5";
  const merchantId = process.env.QNB_MERCHANT_ID!;
  const userCode = process.env.QNB_USER_CODE!;
  const merchantPass = process.env.QNB_MERCHANT_PASS!;
  const gateUrl = process.env.QNB_GATE_URL!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  const okUrl = `${baseUrl}/api/odeme/callback`;
  const failUrl = `${baseUrl}/api/odeme/callback`;
  const purchAmount = `${opts.tutar}`; // TL, tam sayı (örn. "1500")
  const txnType = "Auth";
  const installment = "0";
  const rnd = randomBytes(12).toString("hex");

  // Hash = SHA1(MbrId + OrderId + PurchAmount + OkUrl + FailUrl + TxnType + InstallmentCount + Rnd + MerchantPass)
  const hash = sha1b64(mbrId + opts.siparisNo + purchAmount + okUrl + failUrl + txnType + installment + rnd + merchantPass);

  return {
    url: gateUrl,
    fields: {
      MbrId: mbrId,
      MerchantID: merchantId,
      UserCode: userCode,
      OrderId: opts.siparisNo,
      Lang: "tr",
      SecureType: "3DHost",
      TxnType: txnType,
      PurchAmount: purchAmount,
      InstallmentCount: installment,
      Currency: "949",
      OkUrl: okUrl,
      FailUrl: failUrl,
      Rnd: rnd,
      Hash: hash,
    },
  };
}

// Banka callback'inin ResponseHash'ini doğrular:
// SHA1(MerchantID + MerchantPass + OrderId + AuthCode + ProcReturnCode + 3DStatus + ResponseRnd + UserCode)
export function verifyCallback(params: Record<string, string>): boolean {
  const merchantId = process.env.QNB_MERCHANT_ID;
  const merchantPass = process.env.QNB_MERCHANT_PASS;
  const userCode = process.env.QNB_USER_CODE;
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
