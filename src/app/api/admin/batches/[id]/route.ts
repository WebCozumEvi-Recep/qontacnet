import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const batch = await prisma.cardBatch.findUnique({ where: { id } });
  if (!batch) return NextResponse.json({ ok: false, error: "Batch bulunamadı." }, { status: 404 });

  // Seri numaraları: prefix + 1..miktar
  const seriNumaralari = Array.from({ length: batch.miktar }, (_, i) =>
    `${batch.seriPrefix}-${String(i + 1).padStart(4, "0")}`
  );

  return NextResponse.json({ ok: true, batch, seriNumaralari });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const batch = await prisma.cardBatch.findUnique({ where: { id } });
  if (!batch) return NextResponse.json({ ok: false, error: "Batch bulunamadı." }, { status: 404 });

  await prisma.cardBatch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const batch = await prisma.cardBatch.findUnique({ where: { id } });
  if (!batch) return NextResponse.json({ ok: false, error: "Batch bulunamadı." }, { status: 404 });

  const DURUMLAR = ["URETIMDE", "STOKTA", "TAHSIS", "BITTI"];
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.kod === "string" && body.kod.trim()) data.kod = body.kod.trim();
  if (typeof body.miktar === "number" && body.miktar > 0) data.miktar = body.miktar;
  if (typeof body.seriPrefix === "string") data.seriPrefix = body.seriPrefix.trim();
  if (typeof body.uretici === "string") data.uretici = body.uretici.trim();
  if (typeof body.uretimTarihi === "string" && body.uretimTarihi) data.uretimTarihi = new Date(body.uretimTarihi);
  if (typeof body.durum === "string" && DURUMLAR.includes(body.durum)) data.durum = body.durum;
  if (typeof body.tahsisFirma === "string") data.tahsisFirma = body.tahsisFirma || null;

  const updated = await prisma.cardBatch.update({ where: { id }, data });
  return NextResponse.json({ ok: true, batch: updated });
}
