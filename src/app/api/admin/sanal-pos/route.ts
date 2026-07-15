import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// QNB Finansbank Sanal POS ayarları — yalnız admin.
// Güvenlik: MerchantPass (mağaza 3D anahtarı) tarayıcıya GERİ GÖNDERİLMEZ;
// sadece "kayıtlı mı" bilgisi döner. Boş gönderilirse mevcut değer korunur.

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({
    ok: true,
    settings: {
      qnbAktif: s?.qnbAktif ?? false,
      qnbTest: s?.qnbTest ?? true,
      qnbMerchantId: s?.qnbMerchantId ?? "",
      qnbUserCode: s?.qnbUserCode ?? "",
      qnbMbrId: s?.qnbMbrId ?? "5",
      qnbMerchantPassSet: Boolean(s?.qnbMerchantPass),
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {
    qnbAktif: Boolean(body.qnbAktif),
    qnbTest: Boolean(body.qnbTest),
    qnbMerchantId: String(body.qnbMerchantId ?? "").trim(),
    qnbUserCode: String(body.qnbUserCode ?? "").trim(),
    qnbMbrId: String(body.qnbMbrId ?? "5").trim() || "5",
  };

  // Yeni anahtar girildiyse güncelle; boşsa mevcut değeri koru.
  const yeniPass = String(body.qnbMerchantPass ?? "").trim();
  if (yeniPass) data.qnbMerchantPass = yeniPass;

  // Diğer site alanlarını ezmemek için upsert'te sadece qnb alanlarını yaz.
  const s = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  return NextResponse.json({
    ok: true,
    settings: {
      qnbAktif: s.qnbAktif,
      qnbTest: s.qnbTest,
      qnbMerchantId: s.qnbMerchantId,
      qnbUserCode: s.qnbUserCode,
      qnbMbrId: s.qnbMbrId,
      qnbMerchantPassSet: Boolean(s.qnbMerchantPass),
    },
  });
}
