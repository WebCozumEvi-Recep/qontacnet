import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const DURUMLAR = ["AKTIF", "DENEME", "ASKIDA", "IPTAL"];
const PAKETLER = ["BASLANGIC", "PROFESYONEL", "KURUMSAL"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const f = await prisma.firma.findUnique({ where: { id } });
  if (!f) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.durum === "string" && DURUMLAR.includes(body.durum)) data.durum = body.durum;
  if (typeof body.paket === "string" && PAKETLER.includes(body.paket)) {
    data.paket = body.paket;
    // pakete göre MRR güncelle
    const lic = await prisma.license.findUnique({ where: { ad: body.paket as "BASLANGIC" | "PROFESYONEL" | "KURUMSAL" } });
    if (lic) data.mrr = body.durum === "DENEME" || f.durum === "DENEME" ? 0 : lic.aylikFiyat;
  }
  if (typeof body.mrr === "number") data.mrr = body.mrr;

  const updated = await prisma.firma.update({ where: { id }, data });
  const { passwordHash, ...safe } = updated;
  void passwordHash;
  return NextResponse.json({ ok: true, firma: safe });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const f = await prisma.firma.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!f) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });

  const aktifKart = await prisma.member.count({ where: { firmaId: f.id, aktif: true } });
  const siparisler = await prisma.order.findMany({ where: { firma: f.ad }, orderBy: { createdAt: "desc" } });

  const { passwordHash, _count, ...rest } = f;
  void passwordHash;
  return NextResponse.json({
    ok: true,
    firma: { ...rest, uyeSayisi: _count.members, aktifKart },
    siparisler,
  });
}
