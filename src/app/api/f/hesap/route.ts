import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: firma satış sayfasında ödeme dönüşünde hesap durumunu söyler.
// Sipariş no tek başına yeterli değildir (sıralı ve tahmin edilebilir); siparişi
// açan tarayıcının elindeki hesapToken ile birlikte doğrulanır.
//   yeni    → şifre belirleme sayfasına gidilebilir (token = üyenin resetToken'ı)
//   mevcut  → e-posta zaten kayıtlıydı; sipariş o hesaba bağlandı, giriş yapılmalı
//   bekliyor → ödeme henüz onaylanmadı
export async function GET(req: NextRequest) {
  const no = req.nextUrl.searchParams.get("no") ?? "";
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!no || !token) return NextResponse.json({ ok: false }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { siparisNo: no },
    select: { hesapToken: true, odemeDurum: true, memberId: true, email: true },
  });
  if (!order || order.hesapToken !== token) return NextResponse.json({ ok: false }, { status: 404 });
  if (order.odemeDurum !== "ODENDI" || !order.memberId) return NextResponse.json({ ok: true, durum: "bekliyor" });

  const uye = await prisma.member.findUnique({ where: { id: order.memberId }, select: { resetToken: true } });
  return NextResponse.json({ ok: true, durum: uye?.resetToken === token ? "yeni" : "mevcut", email: order.email });
}
