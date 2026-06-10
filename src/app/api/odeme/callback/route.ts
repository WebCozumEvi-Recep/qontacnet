import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback, isPaymentApproved } from "@/lib/qnbpos";
import { sendMail, htmlLayout, row } from "@/lib/mailer";

type SiteOrder = {
  siparisNo: string; urun: string; adet: number; tutar: number;
  musteriAd: string; email: string; telefon: string; adres: string;
  faturaTip: string; tcKimlik: string; vergiNo: string; vergiDairesi: string; firmaUnvan: string;
};

// Ödeme onayı sonrası müşteri + admin bilgilendirmesi (hata olsa da akışı bozmaz)
async function sendOrderEmails(order: SiteOrder) {
  const detay = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
    ${row("Sipariş No", order.siparisNo)}
    ${row("Ürün", `${order.urun} × ${order.adet}`)}
    ${row("Tutar", `₺${order.tutar.toLocaleString("tr-TR")} (ödendi)`)}
    ${row("Ad Soyad", order.musteriAd)}
    ${row("Telefon", order.telefon)}
    ${row("Teslimat Adresi", order.adres)}
    ${row("Fatura Tipi", order.faturaTip === "KURUMSAL" ? "Kurumsal" : "Bireysel")}
    ${order.faturaTip === "KURUMSAL"
      ? row("Firma Unvanı", order.firmaUnvan) + row("Vergi No", order.vergiNo) + row("Vergi Dairesi", order.vergiDairesi)
      : row("T.C. Kimlik", order.tcKimlik)}
  </table>`;

  const tasks: Promise<unknown>[] = [];
  if (order.email) {
    tasks.push(sendMail({
      to: order.email,
      subject: `Siparişiniz alındı — ${order.siparisNo}`,
      html: htmlLayout("Ödemeniz Alındı, Teşekkürler!", `
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Siparişiniz onaylandı ve hazırlanmaya başlandı. Faturanız fatura bilgilerinize göre düzenlenip bu e-posta adresine iletilecek.</p>
        ${detay}`),
    }));
  }
  tasks.push(sendMail({
    subject: `🛒 Yeni ödenmiş sipariş — ${order.siparisNo} (₺${order.tutar.toLocaleString("tr-TR")})`,
    html: htmlLayout("Site Üzerinden Yeni Sipariş", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Ödemesi kredi kartı ile alınmış yeni bir sipariş düştü. Fatura kesilmesi ve kargo süreci için aksiyon alın.</p>
      ${detay}
      ${order.email ? row("Müşteri E-posta", order.email) : ""}`),
  }));
  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Sipariş e-postası gönderilemedi:", r.reason);
  });
}

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
    try { await sendOrderEmails(order); } catch { /* mail hatası ödemeyi etkilemesin */ }
    return NextResponse.redirect(`${baseUrl}/?odeme=basarili&no=${encodeURIComponent(order.siparisNo)}`, 303);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { odemeDurum: "BASARISIZ", notlar: `${order.notlar ? order.notlar + " | " : ""}Ödeme hatası: ${params.ErrMsg || params.mdErrorMsg || "bilinmiyor"}`.slice(0, 1000) },
  });
  return NextResponse.redirect(`${baseUrl}/?odeme=basarisiz&no=${encodeURIComponent(order.siparisNo)}`, 303);
}
