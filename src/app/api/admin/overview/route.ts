import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { aylikGelir } from "@/lib/gelir";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [firmalar, toplamUye, aktifKart, orders, applications, bekleyenKart, revenue] = await Promise.all([
    prisma.firma.findMany({ select: { id: true, ad: true, durum: true, _count: { select: { members: true } } } }),
    prisma.member.count(),
    prisma.member.count({ where: { aktif: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.application.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.physicalCard.count({ where: { aktif: false } }),
    aylikGelir(),
  ]);

  const aktifFirma = firmalar.filter(f => f.durum === "AKTIF").length;
  const buAySatis = revenue[revenue.length - 1]?.tutar ?? 0;
  const yeniBasvuru = applications.filter(a => a.durum === "YENI").length;
  // Ödemesi alınmamış site siparişleri (başarısız / yarıda kalmış) iş akışına girmez.
  const gecerli = orders.filter(o => o.odemeDurum !== "BASARISIZ" && o.odemeDurum !== "BEKLIYOR");
  const aktifSiparis = gecerli.filter(o => ["HAZIRLANIYOR", "URETIMDE", "KARGODA"].includes(o.durum)).length;

  const topFirmalar = [...firmalar]
    .map(f => ({ id: f.id, ad: f.ad, uyeSayisi: f._count.members }))
    .sort((a, b) => b.uyeSayisi - a.uyeSayisi)
    .slice(0, 4);

  return NextResponse.json({
    ok: true,
    stats: { aktifFirma, toplamFirma: firmalar.length, toplamUye, aktifKart, buAySatis, yeniBasvuru, aktifSiparis, bekleyenKart },
    revenue,
    topFirmalar,
    sonSiparisler: gecerli.slice(0, 4),
    yeniBasvurular: applications.filter(a => a.durum === "YENI" || a.durum === "ILETISIMDE").slice(0, 4),
  });
}
