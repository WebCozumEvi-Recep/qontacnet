import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const MEMBER_SELECT = { select: { id: true, ad: true, soyad: true, email: true } } as const;

// Kartın firmasını, siparişini, notunu ve üyesini günceller.
// memberId verilirse kart o üyeye bağlanıp aktive edilir; null verilirse bağ çözülür.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const kart = await prisma.physicalCard.findUnique({ where: { id } });
  if (!kart) return NextResponse.json({ ok: false, error: "Kart bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: { firmaId?: string | null; orderId?: string | null; notlar?: string } = {};
  if ("firmaId" in body) data.firmaId = typeof body.firmaId === "string" && body.firmaId ? body.firmaId : null;
  if ("orderId" in body) data.orderId = typeof body.orderId === "string" && body.orderId ? body.orderId : null;
  if (typeof body.notlar === "string") data.notlar = body.notlar.slice(0, 500);

  const firmaId = data.firmaId !== undefined ? data.firmaId : kart.firmaId;
  const ops = [];

  if ("memberId" in body) {
    const memberId = typeof body.memberId === "string" && body.memberId ? body.memberId : null;
    if (memberId !== kart.memberId) {
      if (memberId) {
        const uye = await prisma.member.findUnique({ where: { id: memberId }, select: { physicalCard: { select: { id: true } } } });
        if (!uye) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });
        if (uye.physicalCard) return NextResponse.json({ ok: false, error: "Bu üyenin zaten bağlı bir kartı var." }, { status: 409 });
      }
      if (kart.memberId) {
        ops.push(prisma.member.update({ where: { id: kart.memberId }, data: { kartAktif: false } }));
      }
      if (memberId) {
        ops.push(prisma.member.update({ where: { id: memberId }, data: { kartAktif: true, ...(firmaId ? { firmaId } : {}) } }));
        Object.assign(data, { memberId, aktif: true, aktivasyonAt: new Date() });
      } else {
        Object.assign(data, { memberId: null, aktif: false, aktivasyonAt: null });
      }
    }
  } else if (kart.memberId && data.firmaId) {
    // Bağlı üyesi olan kartın firması değişirse üyenin firması da güncellenir.
    ops.push(prisma.member.update({ where: { id: kart.memberId }, data: { firmaId: data.firmaId } }));
  }

  const [guncel] = await prisma.$transaction([
    prisma.physicalCard.update({ where: { id }, data, include: { member: MEMBER_SELECT } }),
    ...ops,
  ]);
  return NextResponse.json({ ok: true, kart: guncel });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const kart = await prisma.physicalCard.findUnique({ where: { id } });
  if (!kart) return NextResponse.json({ ok: false, error: "Kart bulunamadı." }, { status: 404 });

  await prisma.$transaction([
    ...(kart.memberId ? [prisma.member.update({ where: { id: kart.memberId }, data: { kartAktif: false } })] : []),
    prisma.physicalCard.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
