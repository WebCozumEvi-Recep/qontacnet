import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { kartOlustur, baslangicTarihi } from "@/lib/kart";

// Satılan kartların tek listesi + form seçimleri için firma/üye/sipariş listeleri.
export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [kartlar, firmalar, uyeler, siparisler] = await Promise.all([
    prisma.physicalCard.findMany({
      orderBy: { createdAt: "desc" },
      include: { member: { select: { id: true, ad: true, soyad: true, email: true, telefon: true } } },
    }),
    prisma.firma.findMany({ select: { id: true, ad: true }, orderBy: { ad: "asc" } }),
    prisma.member.findMany({
      select: { id: true, ad: true, soyad: true, email: true, telefon: true, firmaId: true, physicalCard: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      // Ödenmemiş site siparişleri (BEKLIYOR/BASARISIZ) karta bağlanamaz.
      where: { odemeDurum: { in: ["ODENDI", "MANUEL"] }, durum: { not: "IPTAL" } },
      select: { id: true, siparisNo: true, firma: true, firmaId: true, musteriAd: true, urun: true, adet: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    kartlar,
    firmalar,
    uyeler: uyeler.map(u => ({ id: u.id, ad: `${u.ad} ${u.soyad}`.trim(), email: u.email, telefon: u.telefon, firmaId: u.firmaId, kartVar: !!u.physicalCard })),
    siparisler,
  });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const orderId = typeof body.orderId === "string" && body.orderId ? body.orderId : null;
  let firmaId = typeof body.firmaId === "string" && body.firmaId ? body.firmaId : null;
  const adet = Math.max(1, Math.min(50, Number(body.adet) || 1));

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { firmaId: true } });
    if (!order) return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });
    // Firma seçilmediyse siparişin referans firması kullanılır.
    firmaId ??= order.firmaId;
  }
  if (firmaId && !(await prisma.firma.findUnique({ where: { id: firmaId }, select: { id: true } }))) {
    return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
  }

  // Üyeye doğrudan (ör. ücretsiz) kart: tek kart açılır ve başlangıç tarihiyle bağlanır.
  const memberId = typeof body.memberId === "string" && body.memberId ? body.memberId : null;
  if (memberId) {
    const uye = await prisma.member.findUnique({ where: { id: memberId }, select: { firmaId: true, physicalCard: { select: { id: true } } } });
    if (!uye) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });
    if (uye.physicalCard) return NextResponse.json({ ok: false, error: "Bu üyenin zaten bir kartı var." }, { status: 409 });
    if (firmaId && uye.firmaId && uye.firmaId !== firmaId) {
      return NextResponse.json({ ok: false, error: "Üye başka bir firmaya bağlı." }, { status: 400 });
    }
    firmaId ??= uye.firmaId;
    const kart = await kartOlustur({ firmaId, orderId, notlar: typeof body.notlar === "string" ? body.notlar : "" });
    const [guncel] = await prisma.$transaction([
      prisma.physicalCard.update({
        where: { id: kart.id },
        data: { memberId, aktif: true, aktivasyonAt: baslangicTarihi(body.baslangic) },
        include: { member: { select: { id: true, ad: true, soyad: true, email: true, telefon: true } } },
      }),
      prisma.member.update({ where: { id: memberId }, data: { kartAktif: true, ...(firmaId ? { firmaId } : {}) } }),
    ]);
    return NextResponse.json({ ok: true, kartlar: [guncel] });
  }

  const kartlar = [];
  for (let i = 0; i < adet; i++) {
    kartlar.push(await kartOlustur({ firmaId, orderId, notlar: typeof body.notlar === "string" ? body.notlar : "" }));
  }
  return NextResponse.json({ ok: true, kartlar: kartlar.map(k => ({ ...k, member: null })) });
}
