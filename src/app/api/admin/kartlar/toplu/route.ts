import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Seçili kartlarda toplu işlem.
//  { ids, islem: "sil" }
//  { ids, islem: "guncelle", firmaId?, orderId?, notlar? } — yalnız gönderilen alanlar değişir
export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 1000) : [];
  if (ids.length === 0) return NextResponse.json({ ok: false, error: "Kart seçilmedi." }, { status: 400 });

  const kartlar = await prisma.physicalCard.findMany({ where: { id: { in: ids } }, select: { id: true, memberId: true } });
  const uyeIdler = kartlar.map(k => k.memberId).filter((x): x is string => !!x);

  if (body.islem === "sil") {
    await prisma.$transaction([
      prisma.member.updateMany({ where: { id: { in: uyeIdler } }, data: { kartAktif: false } }),
      prisma.physicalCard.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return NextResponse.json({ ok: true, adet: kartlar.length });
  }

  if (body.islem !== "guncelle") return NextResponse.json({ ok: false, error: "Geçersiz işlem." }, { status: 400 });

  const data: { firmaId?: string | null; orderId?: string | null; notlar?: string } = {};
  if ("firmaId" in body) data.firmaId = typeof body.firmaId === "string" && body.firmaId ? body.firmaId : null;
  if ("orderId" in body) data.orderId = typeof body.orderId === "string" && body.orderId ? body.orderId : null;
  if (typeof body.notlar === "string") data.notlar = body.notlar.slice(0, 500);
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Değiştirilecek alan yok." }, { status: 400 });

  if (data.firmaId && !(await prisma.firma.findUnique({ where: { id: data.firmaId }, select: { id: true } }))) {
    return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
  }
  if (data.orderId && !(await prisma.order.findUnique({ where: { id: data.orderId }, select: { id: true } }))) {
    return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.physicalCard.updateMany({ where: { id: { in: ids } }, data }),
    // Bağlı üyelerin firması da kartla aynı olsun (tekli düzenlemedeki davranış).
    ...(data.firmaId && uyeIdler.length
      ? [prisma.member.updateMany({ where: { id: { in: uyeIdler } }, data: { firmaId: data.firmaId } })]
      : []),
  ]);
  return NextResponse.json({ ok: true, adet: kartlar.length });
}
