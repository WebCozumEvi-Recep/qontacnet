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

  const body = (await req.json()) as { okundu?: boolean; durum?: string; not?: string };

  const DURUMLAR = ["yeni", "iletisim", "ulasilamadi", "sonra", "ilgilenmiyor"];
  const data: Record<string, unknown> = {};

  if (typeof body.okundu === "boolean") data.okundu = body.okundu;
  if (typeof body.durum === "string" && DURUMLAR.includes(body.durum)) data.durum = body.durum;

  // Durum değişikliği veya not eklenirse zaman damgalı bir kayıt ekle
  const durumDegisti = typeof body.durum === "string" && body.durum !== basvuru.durum && DURUMLAR.includes(body.durum);
  const notVar = typeof body.not === "string" && body.not.trim().length > 0;
  if (durumDegisti || notVar) {
    const mevcut = Array.isArray(basvuru.notlar) ? (basvuru.notlar as unknown[]) : [];
    data.notlar = [
      ...mevcut,
      {
        tarih: new Date().toISOString(),
        not: notVar ? body.not!.trim() : "",
        durum: durumDegisti ? body.durum! : basvuru.durum,
      },
    ];
  }

  if (Object.keys(data).length === 0) data.okundu = true;

  const updated = await prisma.formBasvuru.update({ where: { id }, data });
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
