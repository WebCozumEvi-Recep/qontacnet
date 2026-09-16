import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDijigateConfig, odeme3dTamamla, DijigateError } from "@/lib/dijigate";
import { odemeOnaylandi, odemeBasarisiz, sonucYolu } from "@/lib/odeme-sonuc";
import { siteKoku } from "@/lib/odeme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DijiGate 3D dönüş adresi. Banka OTP ekranından sonra kullanıcı buraya yönlendirilir.
// Ödemeyi burada `3ds-complete` ile kesinleştirip sonucu siparişe yazıyoruz.
//
// Dokümanda dönüşün GET mi POST mu olduğu yazmıyor, bu yüzden ikisini de karşılıyoruz.
// Sipariş numarası `?no=` ile taşınır; paymentId sipariş kaydında (Order.odemeId) saklı.

async function isle(req: NextRequest): Promise<NextResponse> {
  const base = siteKoku();
  const siparisNo = req.nextUrl.searchParams.get("no") ?? "";
  const next = req.nextUrl.searchParams.get("next") ?? "";

  if (!siparisNo) return NextResponse.redirect(`${base}/?odeme=hata`, 303);

  const order = await prisma.order.findUnique({ where: { siparisNo } });
  if (!order) return NextResponse.redirect(`${base}/?odeme=hata`, 303);

  // `next` yalnızca uygulama içi bir yol olabilir — açık yönlendirme (open redirect) olmasın.
  const yol = next.startsWith("/") && !next.startsWith("//") ? next : sonucYolu(order.kaynak, order.firmaId);
  const no = encodeURIComponent(siparisNo);

  // Webhook bizden önce davranmış olabilir.
  if (order.odemeDurum === "ODENDI") {
    return NextResponse.redirect(`${base}${yol}?odeme=basarili&no=${no}`, 303);
  }

  const cfg = await getDijigateConfig();
  if (!cfg || !order.odemeId) {
    await odemeBasarisiz(siparisNo, "Ödeme doğrulanamadı.");
    return NextResponse.redirect(`${base}${yol}?odeme=hata&no=${no}`, 303);
  }

  try {
    const sonuc = await odeme3dTamamla(cfg, order.odemeId);

    if (sonuc.basarili) {
      await odemeOnaylandi(siparisNo, `${sonuc.authCode}/${sonuc.transId}`);
      return NextResponse.redirect(`${base}${yol}?odeme=basarili&no=${no}`, 303);
    }

    await odemeBasarisiz(siparisNo, sonuc.hataMesaji || sonuc.paymentStatus);
    return NextResponse.redirect(`${base}${yol}?odeme=basarisiz&no=${no}`, 303);
  } catch (e) {
    const mesaj = e instanceof DijigateError ? `${e.kod ?? ""} ${e.message}`.trim() : "Ödeme tamamlanamadı.";
    await odemeBasarisiz(siparisNo, mesaj);
    return NextResponse.redirect(`${base}${yol}?odeme=basarisiz&no=${no}`, 303);
  }
}

export async function GET(req: NextRequest) {
  return isle(req);
}

export async function POST(req: NextRequest) {
  return isle(req);
}
