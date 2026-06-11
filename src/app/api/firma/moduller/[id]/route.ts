import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const modul = await prisma.firmaModul.findUnique({ where: { id } });
  if (!modul || modul.firmaId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.baslik === "string") data.baslik = body.baslik.slice(0, 200);
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (body.icerik && typeof body.icerik === "object") data.icerik = body.icerik;

  const updated = await prisma.firmaModul.update({ where: { id }, data });
  return NextResponse.json({ ok: true, modul: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const modul = await prisma.firmaModul.findUnique({ where: { id } });
  if (!modul || modul.firmaId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  }

  await prisma.firmaModul.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
