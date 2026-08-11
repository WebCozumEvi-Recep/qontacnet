import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidateSiteSettings } from "@/lib/site-settings";

// Alan adı (Domain Name API) bayi ayarları — yalnız admin.
// Sanal POS ayarlarıyla aynı kalıp: gizli API anahtarı tarayıcıya geri gönderilmez,
// yalnızca "kayıtlı mı" bilgisi döner; boş gönderilirse mevcut değer korunur.

type DomainView = {
  domainAktif: boolean; domainTest: boolean;
  domainResellerId: string;
  domainKarMarji: number; domainMinKar: number;
  domainApiKeySet: boolean;
  cfZoneId: string;
};

function view(s: {
  domainAktif: boolean; domainTest: boolean; domainResellerId: string;
  domainApiKey: string; domainKarMarji: number; domainMinKar: number;
  cfZoneId: string;
} | null): DomainView {
  return {
    domainAktif: s?.domainAktif ?? false,
    domainTest: s?.domainTest ?? true,
    domainResellerId: s?.domainResellerId ?? "",
    domainKarMarji: s?.domainKarMarji ?? 35,
    domainMinKar: s?.domainMinKar ?? 50,
    domainApiKeySet: Boolean(s?.domainApiKey),
    cfZoneId: s?.cfZoneId ?? "",
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

  const marj = Number(body.domainKarMarji);
  const minKar = Number(body.domainMinKar);

  const data: Record<string, unknown> = {
    domainAktif: Boolean(body.domainAktif),
    domainTest: Boolean(body.domainTest),
    domainResellerId: String(body.domainResellerId ?? "").trim(),
    domainKarMarji: Number.isFinite(marj) ? Math.min(500, Math.max(0, Math.round(marj))) : 35,
    domainMinKar: Number.isFinite(minKar) ? Math.min(10000, Math.max(0, Math.round(minKar))) : 50,
    // Cloudflare zone kimliği 32 haneli onaltılık bir dizedir; boş bırakılabilir
    // (o zaman env değişkenine, o da yoksa ada göre aramaya düşülür).
    cfZoneId: String(body.cfZoneId ?? "").trim().toLowerCase().slice(0, 40),
  };

  const yeniKey = String(body.domainApiKey ?? "").trim();
  if (yeniKey) data.domainApiKey = yeniKey;

  const s = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  revalidateSiteSettings();

  return NextResponse.json({ ok: true, settings: view(s) });
}
