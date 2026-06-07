import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [firmalar, toplamUye, aktifKart, orders, applications, batches, revenue] = await Promise.all([
    prisma.firma.findMany({ select: { id: true, ad: true, paket: true, durum: true, mrr: true, _count: { select: { members: true } } } }),
    prisma.member.count(),
    prisma.member.count({ where: { aktif: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.application.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.cardBatch.findMany(),
    prisma.revenueSnapshot.findMany({ orderBy: { sira: "asc" } }),
  ]);

  const aktifFirma = firmalar.filter(f => f.durum === "AKTIF").length;
  const denemeFirma = firmalar.filter(f => f.durum === "DENEME").length;
  const mrr = firmalar.reduce((a, f) => a + f.mrr, 0);
  const yeniBasvuru = applications.filter(a => a.durum === "YENI").length;
  const aktifSiparis = orders.filter(o => ["HAZIRLANIYOR", "URETIMDE", "KARGODA"].includes(o.durum)).length;
  const stoktakiKart = batches.filter(b => b.durum === "STOKTA").reduce((a, b) => a + b.miktar, 0);

  const topFirmalar = [...firmalar]
    .map(f => ({ id: f.id, ad: f.ad, paket: f.paket, uyeSayisi: f._count.members }))
    .sort((a, b) => b.uyeSayisi - a.uyeSayisi)
    .slice(0, 4);

  return NextResponse.json({
    ok: true,
    stats: { aktifFirma, denemeFirma, toplamUye, aktifKart, mrr, yeniBasvuru, aktifSiparis, stoktakiKart },
    revenue,
    topFirmalar,
    sonSiparisler: orders.slice(0, 4),
    yeniBasvurular: applications.filter(a => a.durum === "YENI" || a.durum === "ILETISIMDE").slice(0, 4),
  });
}
