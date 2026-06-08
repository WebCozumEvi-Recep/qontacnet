import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: { notlar: { orderBy: { createdAt: "asc" } } },
  });
  if (!app) return NextResponse.json({ ok: false, error: "Bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, application: app });
}

const DURUMLAR = ["YENI", "ILETISIMDE", "DONUSUM", "KAYIP"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });

  const body = (await req.json()) as { durum?: string; firmaAdi?: string; yetkili?: string; email?: string; telefon?: string; uyeSayisi?: string; mesaj?: string };

  const data: Record<string, string> = {};
  if (body.durum !== undefined) {
    if (!DURUMLAR.includes(body.durum)) return NextResponse.json({ ok: false, error: "Geçersiz durum." }, { status: 400 });
    data.durum = body.durum;
  }
  if (body.firmaAdi !== undefined) data.firmaAdi = body.firmaAdi;
  if (body.yetkili !== undefined) data.yetkili = body.yetkili;
  if (body.email !== undefined) data.email = body.email;
  if (body.telefon !== undefined) data.telefon = body.telefon;
  if (body.uyeSayisi !== undefined) data.uyeSayisi = body.uyeSayisi;
  if (body.mesaj !== undefined) data.mesaj = body.mesaj;

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Güncellenecek alan yok." }, { status: 400 });

  const updated = await prisma.application.update({ where: { id }, data: data as Parameters<typeof prisma.application.update>[0]["data"] });
  return NextResponse.json({ ok: true, application: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });
  await prisma.applicationNote.deleteMany({ where: { applicationId: id } });
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
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
