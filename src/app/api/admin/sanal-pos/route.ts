import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// QNB Finansbank Sanal POS ayarları — yalnız admin.
// Güvenlik: gizli alanlar (MerchantPass, API şifresi) tarayıcıya GERİ GÖNDERİLMEZ;
// sadece "kayıtlı mı" bilgisi döner. Boş gönderilirse mevcut değer korunur.

type QnbView = {
  qnbAktif: boolean; qnbTest: boolean;
  qnbMerchantId: string; qnbUserCode: string; qnbMbrId: string; qnbTerminalId: string;
  qnbCurrency: string; qnbLang: string;
  qnbMerchantPassSet: boolean; qnbApiPasswordSet: boolean;
};

function view(s: {
  qnbAktif: boolean; qnbTest: boolean; qnbMerchantId: string; qnbUserCode: string;
  qnbMbrId: string; qnbTerminalId: string; qnbCurrency: string; qnbLang: string;
  qnbMerchantPass: string; qnbApiPassword: string;
} | null): QnbView {
  return {
    qnbAktif: s?.qnbAktif ?? false,
    qnbTest: s?.qnbTest ?? true,
    qnbMerchantId: s?.qnbMerchantId ?? "",
    qnbUserCode: s?.qnbUserCode ?? "",
    qnbMbrId: s?.qnbMbrId ?? "5",
    qnbTerminalId: s?.qnbTerminalId ?? "",
    qnbCurrency: s?.qnbCurrency ?? "949",
    qnbLang: s?.qnbLang ?? "tr",
    qnbMerchantPassSet: Boolean(s?.qnbMerchantPass),
    qnbApiPasswordSet: Boolean(s?.qnbApiPassword),
  };
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({ ok: true, settings: view(s) });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;

  const curr = String(body.qnbCurrency ?? "949").trim();
  const lang = String(body.qnbLang ?? "tr").trim().toLowerCase();

  const data: Record<string, unknown> = {
    qnbAktif: Boolean(body.qnbAktif),
    qnbTest: Boolean(body.qnbTest),
    qnbMerchantId: String(body.qnbMerchantId ?? "").trim(),
    qnbUserCode: String(body.qnbUserCode ?? "").trim(),
    qnbMbrId: String(body.qnbMbrId ?? "5").trim() || "5",
    qnbTerminalId: String(body.qnbTerminalId ?? "").trim(),
    qnbCurrency: ["949", "840", "978", "826"].includes(curr) ? curr : "949",
    qnbLang: ["tr", "en"].includes(lang) ? lang : "tr",
  };

  // Gizli alanlar: yeni değer girildiyse güncelle, boşsa mevcut değeri koru.
  const yeniPass = String(body.qnbMerchantPass ?? "").trim();
  if (yeniPass) data.qnbMerchantPass = yeniPass;
  const yeniApiPass = String(body.qnbApiPassword ?? "").trim();
  if (yeniApiPass) data.qnbApiPassword = yeniApiPass;

  // Diğer site alanlarını ezmemek için upsert'te sadece qnb alanlarını yaz.
  const s = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, settings: view(s) });
}
