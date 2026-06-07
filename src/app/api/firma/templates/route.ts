import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

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

  // sadece kendi firmasının şablonu
  const existing = await prisma.cardTemplate.findFirst({ where: { id, firmaId: session.sub } });
  if (!existing) return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof ad === "string") data.ad = ad;
  if (typeof renk === "string") data.renk = renk;
  if (typeof aktif === "boolean") data.aktif = aktif;

  const tpl = await prisma.cardTemplate.update({ where: { id }, data });
  return NextResponse.json({ ok: true, template: tpl });
}
