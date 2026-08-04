import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback, isPaymentApproved, getQnbConfig } from "@/lib/qnbpos";
import { odemeOnaylandi, odemeBasarisiz, sonucYolu } from "@/lib/odeme-sonuc";

// QNB sanal POS 3D ödeme sonucu (banka form POST eder).
// HASH doğrulanır; başarılıysa sipariş ODENDI'ye çekilir, kullanıcı sonuca yönlendirilir.
//
// Not: sipariş tarafındaki yan etkiler (e-posta, alan adı kurulumu) sağlayıcıdan bağımsız
// olarak src/lib/odeme-sonuc.ts içinde yaşar; DijiGate dönüşü de aynı fonksiyonları çağırır.
export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  const params: Record<string, string> = {};
  try {
    const fd = await req.formData();
    fd.forEach((v, k) => { params[k] = String(v); });
  } catch {
    return NextResponse.redirect(`${baseUrl}/?odeme=hata`, 303);
  }

  const oid = params.OrderId || "";
  const order = oid ? await prisma.order.findUnique({ where: { siparisNo: oid } }) : null;
  const qnbCfg = await getQnbConfig();

  if (!order || !qnbCfg || !verifyCallback(qnbCfg, params)) {
    return NextResponse.redirect(`${baseUrl}/?odeme=hata`, 303);
  }

  const yol = sonucYolu(order.kaynak);
  const no = encodeURIComponent(order.siparisNo);

  // Zaten işlenmişse tekrar işleme (çift callback / yenileme koruması)
  if (order.odemeDurum === "ODENDI") {
    return NextResponse.redirect(`${baseUrl}${yol}?odeme=basarili&no=${no}`, 303);
  }

  if (isPaymentApproved(params)) {
    await odemeOnaylandi(order.siparisNo, `${params.AuthCode || ""}/${params.HostRefNum || ""}`);
    return NextResponse.redirect(`${baseUrl}${yol}?odeme=basarili&no=${no}`, 303);
  }

  await odemeBasarisiz(order.siparisNo, params.ErrMsg || params.ProcReturnCode || "");
  return NextResponse.redirect(`${baseUrl}${yol}?odeme=basarisiz&no=${no}`, 303);
}
