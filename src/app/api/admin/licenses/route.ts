import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const order = { BASLANGIC: 0, PROFESYONEL: 1, KURUMSAL: 2 } as Record<string, number>;
  const licenses = await prisma.license.findMany();
  licenses.sort((a, b) => (order[a.ad] ?? 9) - (order[b.ad] ?? 9));

  const withCounts = await Promise.all(
    licenses.map(async (l) => ({
      ...l,
      aktifFirmaSayisi: await prisma.firma.count({ where: { paket: l.ad, durum: "AKTIF" } }),
    }))
  );

  // firma-lisans eşleştirmesi
  const firmalar = await prisma.firma.findMany({
    select: { id: true, ad: true, paket: true, mrr: true, paketBitis: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, licenses: withCounts, firmalar });
}

// Mevcut paketin fiyat / özellik / renk bilgisini günceller.
// Not: maxUye / maxTemplate limitleri kod sabitlerinden (lib/labels) uygulanır,
// bu yüzden burada düzenlenmez.
export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const { id, aylikFiyat, yillikFiyat, ozellikler, renk } = (await req.json()) as {
      id?: string; aylikFiyat?: number; yillikFiyat?: number; ozellikler?: string[]; renk?: string;
    };
    if (!id) return NextResponse.json({ ok: false, error: "id gerekli." }, { status: 400 });

    const existing = await prisma.license.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Paket bulunamadı." }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof aylikFiyat === "number" && aylikFiyat >= 0) data.aylikFiyat = Math.round(aylikFiyat);
    if (typeof yillikFiyat === "number" && yillikFiyat >= 0) data.yillikFiyat = Math.round(yillikFiyat);
    if (Array.isArray(ozellikler)) data.ozellikler = ozellikler.map(String).map(s => s.trim()).filter(Boolean);
    if (typeof renk === "string" && renk.trim()) data.renk = renk.trim();

    const license = await prisma.license.update({ where: { id }, data });
    return NextResponse.json({ ok: true, license });
  } catch (err) {
    console.error("[admin/licenses PUT]", err);
    return NextResponse.json({ ok: false, error: "Paket güncellenemedi." }, { status: 500 });
  }
}
