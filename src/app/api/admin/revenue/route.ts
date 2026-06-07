import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [revenue, firmalar, licenses] = await Promise.all([
    prisma.revenueSnapshot.findMany({ orderBy: { sira: "asc" } }),
    prisma.firma.findMany({ select: { id: true, ad: true, paket: true, durum: true, mrr: true } }),
    prisma.license.findMany(),
  ]);

  const order = { BASLANGIC: 0, PROFESYONEL: 1, KURUMSAL: 2 } as Record<string, number>;
  const paketDagilim = licenses
    .sort((a, b) => (order[a.ad] ?? 9) - (order[b.ad] ?? 9))
    .map(l => {
      const fs = firmalar.filter(f => f.paket === l.ad && f.durum === "AKTIF");
      return { ad: l.ad, renk: l.renk, firmaCount: fs.length, mrr: fs.reduce((a, f) => a + f.mrr, 0) };
    });

  const topFirmalar = firmalar
    .filter(f => f.mrr > 0)
    .sort((a, b) => b.mrr - a.mrr)
    .map(f => ({ id: f.id, ad: f.ad, paket: f.paket, mrr: f.mrr }));

  return NextResponse.json({ ok: true, revenue, paketDagilim, topFirmalar });
}
