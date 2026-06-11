import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { temaLimiti } from "@/lib/labels";

export async function GET() {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const templates = await prisma.cardTemplate.findMany({
    where: { firmaId: session.sub },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ok: true, templates });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { ad, renk } = (await req.json()) as { ad?: string; renk?: string };
  if (!ad) return NextResponse.json({ ok: false, error: "Şablon adı gerekli." }, { status: 400 });

  // Pakete göre tema limiti
  const firma = await prisma.firma.findUnique({ where: { id: session.sub }, select: { paket: true } });
  const limit = temaLimiti[firma?.paket ?? "BASLANGIC"] ?? 1;
  const mevcut = await prisma.cardTemplate.count({ where: { firmaId: session.sub } });
  if (mevcut >= limit) {
    return NextResponse.json({ ok: false, error: `Paketiniz en fazla ${limit} temaya izin veriyor. Daha fazlası için paketinizi yükseltin.` }, { status: 403 });
  }

  // Yeni oluşturulunca diğerlerini pasife al
  await prisma.cardTemplate.updateMany({ where: { firmaId: session.sub }, data: { aktif: false } });
  const tpl = await prisma.cardTemplate.create({
    data: { firmaId: session.sub, ad, renk: renk || "#00d4ff", aktif: true },
  });
  return NextResponse.json({ ok: true, template: tpl });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id, ad, renk, aktif } = (await req.json()) as { id?: string; ad?: string; renk?: string; aktif?: boolean };
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli." }, { status: 400 });

  const existing = await prisma.cardTemplate.findFirst({ where: { id, firmaId: session.sub } });
  if (!existing) return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof ad === "string") data.ad = ad;
  if (typeof renk === "string") data.renk = renk;

  // Aktif edilince diğerleri pasife alınır — tek aktif tema kuralı
  if (aktif === true) {
    await prisma.cardTemplate.updateMany({ where: { firmaId: session.sub, id: { not: id } }, data: { aktif: false } });
    data.aktif = true;
  } else if (aktif === false) {
    data.aktif = false;
  }

  const tpl = await prisma.cardTemplate.update({ where: { id }, data });
  return NextResponse.json({ ok: true, template: tpl });
}

export async function DELETE(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = (await req.json()) as { id?: string };
  if (!id) return NextResponse.json({ ok: false, error: "id gerekli." }, { status: 400 });

  const existing = await prisma.cardTemplate.findFirst({ where: { id, firmaId: session.sub } });
  if (!existing) return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });

  await prisma.cardTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
