import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sablonKullananSayilari } from "@/lib/sablon-kullanim";

export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const member = await prisma.member.findUnique({
    where: { id: session.sub },
    select: { firmaId: true },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });

  if (!member.firmaId) return NextResponse.json({ ok: true, templates: [] });

  const templates = await prisma.cardTemplate.findMany({
    where: { firmaId: member.firmaId },
    orderBy: { createdAt: "asc" },
  });

  const withCount = await sablonKullananSayilari(member.firmaId, templates);
  return NextResponse.json({ ok: true, templates: withCount });
}
