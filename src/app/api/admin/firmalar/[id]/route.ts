import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const DURUMLAR = ["AKTIF", "ASKIDA", "IPTAL"];

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
  if (typeof body.logo === "string") data.logo = body.logo.trim();
  for (const k of ["varsayilanAvatar", "varsayilanArkaplan"] as const) {
    if (typeof body[k] !== "string") continue;
    const v = (body[k] as string).trim();
    if (v && !/^\/uploads\/[\w./-]+$/.test(v)) return NextResponse.json({ ok: false, error: "Geçersiz görsel yolu." }, { status: 400 });
    data[k] = v;
  }
  if ("urunId" in body) {
    const urunId = typeof body.urunId === "string" && body.urunId ? body.urunId : null;
    if (urunId) {
      const urun = await prisma.product.findUnique({ where: { id: urunId }, select: { firmaId: true } });
      if (!urun) return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
      if (urun.firmaId && urun.firmaId !== id) {
        return NextResponse.json({ ok: false, error: "Bu ürün başka bir firmaya özel." }, { status: 400 });
      }
    }
    data.urunId = urunId;
  }
  if (typeof body.newPassword === "string" && body.newPassword.length >= 6) {
    data.passwordHash = bcrypt.hashSync(body.newPassword as string, 10);
  }

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

  const [satilanKart, aktifKart] = await Promise.all([
    prisma.physicalCard.count({ where: { firmaId: f.id } }),
    prisma.physicalCard.count({ where: { firmaId: f.id, aktif: true } }),
  ]);
  const siparisler = await prisma.order.findMany({ where: { OR: [{ firmaId: f.id }, { firma: f.ad }], odemeDurum: { notIn: ["BASARISIZ", "BEKLIYOR"] } }, orderBy: { createdAt: "desc" } });

  const { passwordHash, _count, ...rest } = f;
  void passwordHash;
  return NextResponse.json({
    ok: true,
    firma: { ...rest, uyeSayisi: _count.members, satilanKart, aktifKart },
    siparisler,
  });
}
