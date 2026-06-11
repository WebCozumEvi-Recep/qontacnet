import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const basvuru = await prisma.formBasvuru.findUnique({ where: { id } });
  if (!basvuru || basvuru.firmaId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  }

  const body = (await req.json()) as { okundu?: boolean };
  const updated = await prisma.formBasvuru.update({
    where: { id },
    data: { okundu: typeof body.okundu === "boolean" ? body.okundu : true },
  });
  return NextResponse.json({ ok: true, basvuru: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const basvuru = await prisma.formBasvuru.findUnique({ where: { id } });
  if (!basvuru || basvuru.firmaId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  }
  await prisma.formBasvuru.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
