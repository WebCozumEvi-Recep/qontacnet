import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const DURUMLAR = ["HAZIRLANIYOR", "URETIMDE", "KARGODA", "TESLIM", "IPTAL"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });
  // Ürün kataloğundaki açıklamayı da ekle (sipariş ürün adıyla eşleşirse)
  const product = await prisma.product.findFirst({ where: { ad: order.urun }, select: { aciklama: true } });
  return NextResponse.json({ ok: true, order: { ...order, urunAciklama: product?.aciklama ?? "" } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.firma === "string" && body.firma.trim()) data.firma = body.firma.trim();
  if (typeof body.urun === "string" && body.urun.trim()) data.urun = body.urun.trim();
  if (typeof body.adet === "number" && body.adet > 0) data.adet = body.adet;
  if (typeof body.birimFiyat === "number") data.birimFiyat = body.birimFiyat;
  if (typeof body.kdvOrani === "number") data.kdvOrani = body.kdvOrani;
  if (typeof body.indirim === "number") data.indirim = body.indirim;
  if (typeof body.notlar === "string") data.notlar = body.notlar;
  if (typeof body.durum === "string" && DURUMLAR.includes(body.durum)) data.durum = body.durum;
  if (typeof body.kargoNo === "string") data.kargoNo = body.kargoNo.trim() || null;
  // tutar = araToplam + kdv - indirim (otomatik hesapla)
  const adet = typeof data.adet === "number" ? data.adet : order.adet;
  const birimFiyat = typeof data.birimFiyat === "number" ? data.birimFiyat : order.birimFiyat;
  const kdvOrani = typeof data.kdvOrani === "number" ? data.kdvOrani : order.kdvOrani;
  const indirim = typeof data.indirim === "number" ? data.indirim : order.indirim;
  if (birimFiyat > 0) {
    const araToplam = adet * birimFiyat;
    data.tutar = Math.round(araToplam + araToplam * kdvOrani / 100 - indirim);
  } else if (typeof body.tutar === "number") {
    data.tutar = body.tutar;
  }

  const updated = await prisma.order.update({ where: { id }, data });
  return NextResponse.json({ ok: true, order: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
