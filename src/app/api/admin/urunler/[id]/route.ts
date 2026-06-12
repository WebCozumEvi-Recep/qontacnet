import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { normalizeGorseller } from "../route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.ad === "string" && body.ad.trim()) data.ad = body.ad.trim();
  if (typeof body.aciklama === "string") data.aciklama = body.aciklama.trim();
  if (typeof body.fiyat === "number") data.fiyat = body.fiyat;
  if (typeof body.gorsel === "string") data.gorsel = body.gorsel.trim();
  if (Array.isArray(body.gorseller)) data.gorseller = normalizeGorseller(body.gorseller);
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (typeof body.tip === "string") data.tip = body.tip.trim();
  if (typeof body.sira === "number") data.sira = body.sira;
  const urun = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, urun });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
