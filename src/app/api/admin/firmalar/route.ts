import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const firmalar = await prisma.firma.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { members: true } } },
  });

  const list = await Promise.all(
    firmalar.map(async (f) => {
      const aktifKart = await prisma.member.count({ where: { firmaId: f.id, aktif: true } });
      const { passwordHash, _count, ...rest } = f;
      void passwordHash;
      return { ...rest, uyeSayisi: _count.members, aktifKart };
    })
  );

  return NextResponse.json({ ok: true, firmalar: list });
}
