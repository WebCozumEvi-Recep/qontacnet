import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const body = (await req.json()) as {
    baslik?: string; icerik?: string; aktif?: boolean; sira?: number;
    ceviriler?: Record<string, { baslik?: string; icerik?: string }>;
  };
  const data: Record<string, unknown> = {};
  if (typeof body.baslik === "string") data.baslik = body.baslik.trim();
  if (typeof body.icerik === "string") data.icerik = body.icerik;
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (typeof body.sira === "number") data.sira = body.sira;
  if (body.ceviriler && typeof body.ceviriler === "object") data.ceviriler = body.ceviriler;

  const sayfa = await prisma.customPage.update({ where: { id }, data });
  return NextResponse.json({ ok: true, sayfa });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  await prisma.customPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
