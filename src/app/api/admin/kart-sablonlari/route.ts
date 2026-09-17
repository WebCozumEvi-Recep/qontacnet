import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sablonGovdesiOku } from "@/lib/kart-sablon-sunucu";
import { varsayilanAlanlar } from "@/lib/kart-baski";

// Kart baskı şablonları. ?firmaId= verilirse yalnız o firmanınkiler.
export async function GET(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const firmaId = req.nextUrl.searchParams.get("firmaId");
  const sablonlar = await prisma.kartSablonu.findMany({
    where: firmaId ? { firmaId } : {},
    orderBy: [{ firmaId: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, sablonlar });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;

  const firmaId = typeof body.firmaId === "string" ? body.firmaId : "";
  if (!firmaId || !(await prisma.firma.findUnique({ where: { id: firmaId }, select: { id: true } }))) {
    return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
  }
  const okunan = sablonGovdesiOku({ ad: "Yeni Şablon", ...body });
  if ("hata" in okunan) return NextResponse.json({ ok: false, error: okunan.hata }, { status: 400 });
  const yon = okunan.data.yon ?? "yatay";

  const sablon = await prisma.kartSablonu.create({
    data: {
      firmaId,
      ad: okunan.data.ad!,
      yon,
      onGorsel: okunan.data.onGorsel ?? "",
      arkaGorsel: okunan.data.arkaGorsel ?? "",
      onRenk: okunan.data.onRenk ?? "#ffffff",
      arkaRenk: okunan.data.arkaRenk ?? "#ffffff",
      onZeminBas: okunan.data.onZeminBas ?? true,
      arkaZeminBas: okunan.data.arkaZeminBas ?? true,
      alanlar: okunan.data.alanlar ?? (varsayilanAlanlar(yon) as unknown as object),
    },
  });
  return NextResponse.json({ ok: true, sablon });
}
