import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { id, firmaId: session.sub },
    include: { leads: { orderBy: { createdAt: "desc" } } },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const { passwordHash, ...safe } = member;
  void passwordHash;
  return NextResponse.json({ ok: true, member: safe });
}
