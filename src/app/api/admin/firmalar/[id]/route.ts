import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const f = await prisma.firma.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!f) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });

  const aktifKart = await prisma.member.count({ where: { firmaId: f.id, aktif: true } });
  const siparisler = await prisma.order.findMany({ where: { firma: f.ad }, orderBy: { createdAt: "desc" } });

  const { passwordHash, _count, ...rest } = f;
  void passwordHash;
  return NextResponse.json({
    ok: true,
    firma: { ...rest, uyeSayisi: _count.members, aktifKart },
    siparisler,
  });
}
