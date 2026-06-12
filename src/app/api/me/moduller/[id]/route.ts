import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Sadece kendi modülünü düzenleyebilir
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const mevcut = await prisma.memberModul.findUnique({ where: { id }, select: { memberId: true } });
  if (!mevcut || mevcut.memberId !== session.sub)
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.baslik === "string") data.baslik = body.baslik;
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (typeof body.sira === "number") data.sira = body.sira;
  if (body.icerik && typeof body.icerik === "object") data.icerik = body.icerik;

  const modul = await prisma.memberModul.update({
    where: { id },
    data,
    include: { tanim: { select: { ad: true, ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true } } },
  });
  return NextResponse.json({ ok: true, modul });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const mevcut = await prisma.memberModul.findUnique({ where: { id }, select: { memberId: true } });
  if (!mevcut || mevcut.memberId !== session.sub)
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  await prisma.memberModul.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
