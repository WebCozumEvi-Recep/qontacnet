import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { uyeAlanlariniOku } from "@/lib/admin-uye";

// Tüm üyeler: firma, kart ve sipariş bilgisiyle.
export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [uyeler, firmalar, siparisSayilari] = await Promise.all([
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, ad: true, soyad: true, email: true, telefon: true, unvan: true, aktif: true, createdAt: true,
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

// Admin'den elle üye ekleme (firmalı ya da firmasız).
export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const okunan = await uyeAlanlariniOku(body, { zorunlu: true });
  if ("hata" in okunan) return NextResponse.json({ ok: false, error: okunan.hata }, { status: 400 });

  const sifre = typeof body.sifre === "string" ? body.sifre : "";
  if (sifre.length < 6) return NextResponse.json({ ok: false, error: "Şifre en az 6 karakter olmalı." }, { status: 400 });

  const { ad, email, ...diger } = okunan.data;
  const uye = await prisma.member.create({
    data: {
      ...diger,
      ad: ad!,
      email: email!,
      passwordHash: bcrypt.hashSync(sifre, 10),
      aktif: body.aktif !== false,
    },
    select: {
      id: true, ad: true, soyad: true, email: true, telefon: true, unvan: true, aktif: true, createdAt: true,
      firmaId: true, firma: { select: { ad: true } },
    },
  });
  const { firma, ...rest } = uye;
  return NextResponse.json({
    ok: true,
    uye: { ...rest, firmaAd: firma?.ad ?? null, sifreBekliyor: false, siparis: 0, physicalCard: null },
  });
}
