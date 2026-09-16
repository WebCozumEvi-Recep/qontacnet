import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sablonGovdesiOku } from "@/lib/kart-sablon-sunucu";
import type { Yon } from "@/lib/kart-baski";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const sablon = await prisma.kartSablonu.findUnique({ where: { id } });
  if (!sablon) return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, sablon });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const mevcut = await prisma.kartSablonu.findUnique({ where: { id }, select: { yon: true } });
  if (!mevcut) return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });

  const okunan = sablonGovdesiOku((await req.json()) as Record<string, unknown>, mevcut.yon as Yon);
  if ("hata" in okunan) return NextResponse.json({ ok: false, error: okunan.hata }, { status: 400 });
  const sablon = await prisma.kartSablonu.update({ where: { id }, data: okunan.data });
  return NextResponse.json({ ok: true, sablon });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  await prisma.kartSablonu.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
