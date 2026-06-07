import { NextResponse } from "next/server";
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
