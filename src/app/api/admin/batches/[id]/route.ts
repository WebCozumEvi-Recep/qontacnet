import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const batch = await prisma.cardBatch.findUnique({
    where: { id },
    include: {
      physicalCards: {
        orderBy: { seriNo: "asc" },
        select: { id: true, seriNo: true, token: true, aktif: true, aktivasyonAt: true, firmaId: true, memberId: true },
      },
    },
  });
  if (!batch) return NextResponse.json({ ok: false, error: "Batch bulunamadı." }, { status: 404 });

  return NextResponse.json({ ok: true, batch, physicalCards: batch.physicalCards });
}

// Mevcut batch'e eksik PhysicalCard kayıtlarını oluştur (backfill)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const batch = await prisma.cardBatch.findUnique({ where: { id }, include: { physicalCards: { select: { seriNo: true } } } });
  if (!batch) return NextResponse.json({ ok: false, error: "Batch bulunamadı." }, { status: 404 });

  const existing = new Set(batch.physicalCards.map(c => c.seriNo));
  const toCreate = Array.from({ length: batch.miktar }, (_, i) => {
    const seriNo = `${batch.seriPrefix}-${String(i + 1).padStart(4, "0")}`;
    return existing.has(seriNo) ? null : {
      seriNo,
      token: randomBytes(12).toString("base64url"),
      batchId: id,
      firmaId: batch.tahsisFirma ?? null,
    };
  }).filter(Boolean) as { seriNo: string; token: string; batchId: string; firmaId: string | null }[];

  if (toCreate.length === 0) return NextResponse.json({ ok: true, created: 0, message: "Tüm kartlar zaten oluşturulmuş." });

  await prisma.physicalCard.createMany({ data: toCreate });
  return NextResponse.json({ ok: true, created: toCreate.length });
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
  if (typeof body.tahsisFirma === "string") data.tahsisFirmaId = body.tahsisFirma || null;

  const updated = await prisma.cardBatch.update({ where: { id }, data });
  return NextResponse.json({ ok: true, batch: updated });
}
