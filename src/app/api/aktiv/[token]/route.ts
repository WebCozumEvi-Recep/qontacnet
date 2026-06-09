import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const { token } = await params;

  const card = await prisma.physicalCard.findUnique({
    where: { token },
    include: { batch: { select: { tahsisFirmaId: true } } },
  });
  if (!card) return NextResponse.json({ ok: false, error: "Geçersiz kart kodu." }, { status: 404 });

  if (card.aktif) {
    return NextResponse.json({ ok: false, error: "Bu kart zaten aktive edilmiş." }, { status: 409 });
  }

  const member = await prisma.member.findUnique({
    where: { id: session.sub },
    select: { physicalCard: { select: { id: true } } },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  if (member.physicalCard) {
    return NextResponse.json({ ok: false, error: "Hesabınıza zaten bir kart bağlı." }, { status: 409 });
  }

  // Kartın batchinden firmaId al
  const firmaId = card.batch.tahsisFirmaId ?? card.firmaId ?? null;

  await prisma.$transaction([
    prisma.physicalCard.update({
      where: { token },
      data: { memberId: session.sub, firmaId, aktif: true, aktivasyonAt: new Date() },
    }),
    prisma.member.update({
      where: { id: session.sub },
      data: { kartAktif: true, ...(firmaId ? { firmaId } : {}) },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const card = await prisma.physicalCard.findUnique({
    where: { token },
    select: { aktif: true, memberId: true },
  });
  if (!card) return NextResponse.json({ ok: false, error: "Geçersiz kart." }, { status: 404 });
  return NextResponse.json({ ok: true, aktif: card.aktif, memberId: card.memberId });
}
