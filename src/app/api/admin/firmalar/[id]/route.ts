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
  if (typeof body.ad === "string" && body.ad.trim()) data.ad = body.ad.trim();
  if (typeof body.email === "string" && body.email.trim()) data.email = body.email.trim();
  if (typeof body.telefon === "string") data.telefon = body.telefon.trim();
  if (typeof body.adres === "string") data.adres = body.adres.trim();
  if (typeof body.website === "string") data.website = body.website.trim();
  if (typeof body.sektor === "string") data.sektor = body.sektor.trim();
  if (typeof body.temsilci === "string") data.temsilci = body.temsilci.trim();
  if (typeof body.durum === "string" && DURUMLAR.includes(body.durum)) data.durum = body.durum;
  if (typeof body.paket === "string" && PAKETLER.includes(body.paket)) {
    data.paket = body.paket;
    const lic = await prisma.license.findUnique({ where: { ad: body.paket as "BASLANGIC" | "PROFESYONEL" | "KURUMSAL" } });
    if (lic) data.mrr = body.durum === "DENEME" || f.durum === "DENEME" ? 0 : lic.aylikFiyat;
  }
  if (typeof body.mrr === "number") data.mrr = body.mrr;
  if (typeof body.paketBaslangic === "string" && body.paketBaslangic) data.paketBaslangic = new Date(body.paketBaslangic);
  if (typeof body.paketBitis === "string") data.paketBitis = body.paketBitis ? new Date(body.paketBitis) : null;

  const updated = await prisma.firma.update({ where: { id }, data });
  const { passwordHash, ...safe } = updated;
  void passwordHash;
  return NextResponse.json({ ok: true, firma: safe });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const f = await prisma.firma.findUnique({ where: { id } });
  if (!f) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });

  await prisma.firma.delete({ where: { id } });
  return NextResponse.json({ ok: true });
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
