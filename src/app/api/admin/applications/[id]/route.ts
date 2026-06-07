import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const DURUMLAR = ["YENI", "ILETISIMDE", "DONUSUM", "KAYIP"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });

  const body = (await req.json()) as { durum?: string };
  if (!body.durum || !DURUMLAR.includes(body.durum)) return NextResponse.json({ ok: false, error: "Geçersiz durum." }, { status: 400 });

  const updated = await prisma.application.update({ where: { id }, data: { durum: body.durum as "YENI" | "ILETISIMDE" | "DONUSUM" | "KAYIP" } });
  return NextResponse.json({ ok: true, application: updated });
}

// Başvuruyu firmaya dönüştür
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });

  const email = app.email.toLowerCase().trim();
  if (!email) return NextResponse.json({ ok: false, error: "Başvuruda e-posta yok." }, { status: 400 });

  const exists = await prisma.firma.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ ok: false, error: "Bu e-posta ile firma zaten var." }, { status: 409 });

  const gecici = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
  const firma = await prisma.firma.create({
    data: {
      ad: app.firmaAdi,
      email,
      passwordHash: bcrypt.hashSync(gecici, 10),
      telefon: app.telefon,
      temsilci: app.yetkili,
      durum: "DENEME",
      paket: "BASLANGIC",
    },
  });
  await prisma.application.update({ where: { id }, data: { durum: "DONUSUM" } });

  return NextResponse.json({ ok: true, firmaId: firma.id, email, geciciSifre: gecici });
}
