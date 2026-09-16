import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Tüm üyeler: firma, kart ve sipariş bilgisiyle.
export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [uyeler, firmalar, siparisSayilari] = await Promise.all([
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, ad: true, soyad: true, email: true, telefon: true, aktif: true, createdAt: true,
        firmaId: true, resetToken: true,
        firma: { select: { ad: true } },
        physicalCard: { select: { seriNo: true, aktif: true } },
      },
    }),
    prisma.firma.findMany({ select: { id: true, ad: true }, orderBy: { ad: "asc" } }),
    prisma.order.groupBy({ by: ["memberId"], where: { memberId: { not: null } }, _count: { _all: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    firmalar,
    uyeler: uyeler.map(({ resetToken, firma, ...u }) => ({
      ...u,
      firmaAd: firma?.ad ?? null,
      // Siparişten açılıp henüz şifresini belirlemeyen hesap
      sifreBekliyor: !!resetToken,
      siparis: siparisSayilari.find(s => s.memberId === u.id)?._count._all ?? 0,
    })),
  });
}
