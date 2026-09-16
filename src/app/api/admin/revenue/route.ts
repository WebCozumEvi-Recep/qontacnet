import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { aylikGelir, GELIR_SIPARIS } from "@/lib/gelir";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [revenue, firmaToplam, firmalar] = await Promise.all([
    aylikGelir(),
    prisma.order.groupBy({
      by: ["firmaId"],
      where: { ...GELIR_SIPARIS, firmaId: { not: null } },
      _sum: { tutar: true, adet: true },
      _count: { _all: true },
    }),
    prisma.firma.findMany({ select: { id: true, ad: true } }),
  ]);

  // Firma referansıyla gelen satışlar (tüm zamanlar)
  const topFirmalar = firmaToplam
    .map(g => ({
      id: g.firmaId as string,
      ad: firmalar.find(f => f.id === g.firmaId)?.ad ?? "Silinmiş firma",
      tutar: g._sum.tutar ?? 0,
      adet: g._sum.adet ?? 0,
      siparis: g._count._all,
    }))
    .sort((a, b) => b.tutar - a.tutar);

  return NextResponse.json({ ok: true, revenue, topFirmalar });
}
