import { createHash, randomBytes } from "crypto";

// QNB Finansbank Sanal POS (NestPay / Payten) — 3D Pay Hosting modeli.
// Kart bilgisi bankanın güvenli sayfasında girilir; biz imzalı form POST'larız,
// banka sonucu okUrl/failUrl'e POST eder ve HASH (ver3, SHA-512) ile doğrulanır.
//
// Gerekli env değişkenleri (.env.production):
//   QNB_CLIENT_ID  — üye işyeri numarası (merchant ID)
//   QNB_STORE_KEY  — 3D güvenlik anahtarı (store key)
//   QNB_GATE_URL   — 3D gate adresi. Test: https://entegrasyon.asseco-see.com.tr/fim/est3Dgate
//                    Canlı (QNB): https://www.fbwebpos.com.tr/fim/est3Dgate
//   NEXT_PUBLIC_BASE_URL — callback adresleri için site kökü (örn. https://qontac.net)

export function qnbConfigured(): boolean {
  return Boolean(process.env.QNB_CLIENT_ID && process.env.QNB_STORE_KEY && process.env.QNB_GATE_URL);
}

function escapeVal(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

// NestPay ver3 hash: alan adları doğal sıralamayla (case-insensitive) sıralanır,
// değerler | ile birleştirilir, sona storeKey eklenir, SHA-512 base64 alınır.
function hashVer3(fields: Record<string, string>, storeKey: string): string {
  const keys = Object.keys(fields)
    .filter((k) => k.toLowerCase() !== "hash" && k.toLowerCase() !== "encoding")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "en"));
  const plain = keys.map((k) => escapeVal(fields[k] ?? "")).join("|") + "|" + escapeVal(storeKey);
  return createHash("sha512").update(plain, "utf8").digest("base64");
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
  const clientId = process.env.QNB_CLIENT_ID!;
  const storeKey = process.env.QNB_STORE_KEY!;
  const gateUrl = process.env.QNB_GATE_URL!;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  const fields: Record<string, string> = {
    clientid: clientId,
    storetype: "3d_pay_hosting",
    hashAlgorithm: "ver3",
    TranType: "Auth",
    amount: `${opts.tutar}.00`,
    currency: "949",
    oid: opts.siparisNo,
    okUrl: `${baseUrl}/api/odeme/callback`,
    failUrl: `${baseUrl}/api/odeme/callback`,
    lang: "tr",
    rnd: randomBytes(12).toString("hex"),
    BillToName: opts.musteriAd.slice(0, 100),
    email: opts.email.slice(0, 100),
    refreshtime: "5",
  };

  fields.HASH = hashVer3(fields, storeKey);
  return { url: gateUrl, fields };
}

// Banka callback'inin HASH'ini doğrular.
export function verifyCallback(params: Record<string, string>): boolean {
  const storeKey = process.env.QNB_STORE_KEY;
  if (!storeKey || !params.HASH) return false;
  return hashVer3(params, storeKey) === params.HASH;
}

// 3D doğrulama başarılı mı? (mdStatus 1-4 kabul, Response=Approved)
export function isPaymentApproved(params: Record<string, string>): boolean {
  const md = params.mdStatus ?? "";
  return params.Response === "Approved" && params.ProcReturnCode === "00" && ["1", "2", "3", "4"].includes(md);
}
