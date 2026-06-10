import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: ana sayfadan ürün satın alma talebi
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { urunId, adet, musteriAd, email, telefon, adres, firma, notlar } = body;

    if (!urunId || !musteriAd || !telefon) {
      return NextResponse.json({ ok: false, error: "Ürün, ad soyad ve telefon zorunludur." }, { status: 400 });
    }

    const urun = await prisma.product.findUnique({ where: { id: String(urunId) } });
    if (!urun || !urun.aktif) {
      return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
    }

    const adetNum = Math.max(1, Math.min(1000, Number(adet) || 1));
    const tutar = urun.fiyat * adetNum;

    const count = await prisma.order.count();
    const siparisNo = `SIP-${new Date().getFullYear()}-${String(1300 + count + 1)}`;

    const order = await prisma.order.create({
      data: {
        siparisNo,
        firma: String(firma || musteriAd),
        urun: urun.ad,
        adet: adetNum,
        tutar,
        birimFiyat: urun.fiyat,
        durum: "HAZIRLANIYOR",
        kaynak: "SITE",
        musteriAd: String(musteriAd).slice(0, 200),
        email: String(email || "").slice(0, 200),
        telefon: String(telefon).slice(0, 50),
        adres: String(adres || "").slice(0, 1000),
        notlar: String(notlar || "").slice(0, 1000),
      },
    });

    return NextResponse.json({ ok: true, siparisNo: order.siparisNo });
  } catch {
    return NextResponse.json({ ok: false, error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
