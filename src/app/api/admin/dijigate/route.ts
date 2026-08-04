import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidateSiteSettings } from "@/lib/site-settings";

// DijiGate Gateway ayarları + aktif ödeme sağlayıcısı seçimi — yalnız admin.
// Sanal POS ayarlarıyla aynı kalıp: gizli anahtar tarayıcıya geri gönderilmez,
// yalnızca "kayıtlı mı" bilgisi döner; boş gönderilirse mevcut değer korunur.

type DijigateView = {
  odemeSaglayici: string;
  dijigateAktif: boolean;
  dijigateTest: boolean;
  dijigateApiKeySet: boolean;
  dijigateSecretKeySet: boolean;
};

function view(s: {
  odemeSaglayici: string; dijigateAktif: boolean; dijigateTest: boolean;
  dijigateApiKey: string; dijigateSecretKey: string;
} | null): DijigateView {
  return {
    odemeSaglayici: s?.odemeSaglayici === "QNB" ? "QNB" : "DIJIGATE",
    dijigateAktif: s?.dijigateAktif ?? false,
    dijigateTest: s?.dijigateTest ?? true,
    dijigateApiKeySet: Boolean(s?.dijigateApiKey),
    dijigateSecretKeySet: Boolean(s?.dijigateSecretKey),
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

  const data: Record<string, unknown> = {
    odemeSaglayici: body.odemeSaglayici === "QNB" ? "QNB" : "DIJIGATE",
    dijigateAktif: Boolean(body.dijigateAktif),
    dijigateTest: Boolean(body.dijigateTest),
  };

  // Gizli alanlar: yeni değer girildiyse güncelle, boşsa mevcut değeri koru.
  const yeniApiKey = String(body.dijigateApiKey ?? "").trim();
  if (yeniApiKey) data.dijigateApiKey = yeniApiKey;
  const yeniSecret = String(body.dijigateSecretKey ?? "").trim();
  if (yeniSecret) data.dijigateSecretKey = yeniSecret;

  const s = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  revalidateSiteSettings();

  return NextResponse.json({ ok: true, settings: view(s) });
}
