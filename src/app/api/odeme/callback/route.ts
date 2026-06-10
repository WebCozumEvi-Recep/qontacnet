import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback, isPaymentApproved } from "@/lib/qnbpos";

// QNB sanal POS 3D ödeme sonucu (banka form POST eder).
// HASH doğrulanır; başarılıysa sipariş ODENDI'ye çekilir, kullanıcı sonuca yönlendirilir.
export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";

  let params: Record<string, string> = {};
  try {
    const fd = await req.formData();
    fd.forEach((v, k) => { params[k] = String(v); });
  } catch {
    return NextResponse.redirect(`${baseUrl}/?odeme=hata`, 303);
  }

  const oid = params.oid || params.ReturnOid || "";
  const order = oid ? await prisma.order.findUnique({ where: { siparisNo: oid } }) : null;

  if (!order || !verifyCallback(params)) {
    return NextResponse.redirect(`${baseUrl}/?odeme=hata`, 303);
  }

  // Zaten işlenmişse tekrar işleme (çift callback / yenileme koruması)
  if (order.odemeDurum === "ODENDI") {
    return NextResponse.redirect(`${baseUrl}/?odeme=basarili&no=${encodeURIComponent(order.siparisNo)}`, 303);
  }

  if (isPaymentApproved(params)) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        odemeDurum: "ODENDI",
        odemeRef: `${params.AuthCode || ""}/${params.TransId || ""}`.slice(0, 100),
      },
    });
    return NextResponse.redirect(`${baseUrl}/?odeme=basarili&no=${encodeURIComponent(order.siparisNo)}`, 303);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { odemeDurum: "BASARISIZ", notlar: `${order.notlar ? order.notlar + " | " : ""}Ödeme hatası: ${params.ErrMsg || params.mdErrorMsg || "bilinmiyor"}`.slice(0, 1000) },
  });
  return NextResponse.redirect(`${baseUrl}/?odeme=basarisiz&no=${encodeURIComponent(order.siparisNo)}`, 303);
}
