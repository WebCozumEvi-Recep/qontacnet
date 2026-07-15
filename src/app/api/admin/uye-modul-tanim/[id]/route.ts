import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const TIPLER = ["GALERI", "TEXT", "VIDEO", "LINK", "GORSEL", "FORM", "TEK_GORSEL", "HTML", "SSS", "HERO", "BASVURU"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.ad === "string" && body.ad.trim()) data.ad = body.ad.trim();
  if (typeof body.tip === "string" && TIPLER.includes(body.tip as (typeof TIPLER)[number])) data.tip = body.tip;
  if (typeof body.ikon === "string") data.ikon = body.ikon.trim();
  if (typeof body.ikonAd === "string") data.ikonAd = body.ikonAd.trim();
  if (typeof body.butonRenk === "string") data.butonRenk = body.butonRenk.trim();
  if (typeof body.ikonRenk === "string") data.ikonRenk = body.ikonRenk.trim();
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (typeof body.sira === "number") data.sira = body.sira;
  const tanim = await prisma.uyeModulTanim.update({ where: { id }, data });
  return NextResponse.json({ ok: true, tanim });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  await prisma.uyeModulTanim.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
