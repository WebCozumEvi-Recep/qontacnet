import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { token } = await params;

  const card = await prisma.physicalCard.findUnique({ where: { token } });
  if (!card) return NextResponse.json({ ok: false, error: "Geçersiz kart kodu." }, { status: 404 });

  if (card.aktif) {
    return NextResponse.json({ ok: false, error: "Bu kart zaten aktive edilmiş." }, { status: 409 });
  }

  // Kart bu üyenin firmasına mı tahsis edilmiş?
  const member = await prisma.member.findUnique({
    where: { id: session.sub },
    select: { firmaId: true, kartAktif: true, physicalCard: { select: { id: true } } },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  if (member.physicalCard) {
    return NextResponse.json({ ok: false, error: "Hesabınıza zaten bir kart bağlı." }, { status: 409 });
  }

  if (card.firmaId && card.firmaId !== member.firmaId) {
    return NextResponse.json({ ok: false, error: "Bu kart firmanıza ait değil." }, { status: 403 });
  }

  // Aktivasyon: PhysicalCard → üyeye bağla, Member → kartAktif = true
  await prisma.$transaction([
    prisma.physicalCard.update({
      where: { token },
      data: {
        memberId: session.sub,
        firmaId: member.firmaId,
        aktif: true,
        aktivasyonAt: new Date(),
      },
    }),
    prisma.member.update({
      where: { id: session.sub },
      data: { kartAktif: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

// Tokene göre kart durumunu sorgula (public — giriş gerekmez)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await prisma.physicalCard.findUnique({
    where: { token },
    select: {
      aktif: true,
      seriNo: true,
      firmaId: true,
      memberId: true,
    },
  });
  if (!card) return NextResponse.json({ ok: false, error: "Geçersiz kart." }, { status: 404 });
  return NextResponse.json({ ok: true, aktif: card.aktif, memberId: card.memberId });
}
