import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sendMail, htmlLayout } from "@/lib/mailer";

const DURUM_LABEL: Record<string, string> = {
  HAZIRLANIYOR: "Hazırlanıyor", URETIMDE: "Üretimde",
  KARGODA: "Kargoda", TESLIM: "Teslim Edildi", IPTAL: "İptal",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ ok: false, error: "Sipariş bulunamadı." }, { status: 404 });

  const { to } = (await req.json()) as { to?: string };
  if (!to || !to.includes("@")) return NextResponse.json({ ok: false, error: "Geçerli bir e-posta adresi girin." }, { status: 400 });

  const araToplam = order.adet * order.birimFiyat;
  const kdvTutar = Math.round(araToplam * order.kdvOrani / 100);
  const genelToplam = order.birimFiyat > 0 ? araToplam + kdvTutar - order.indirim : order.tutar;

  const fmt = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
  const satir = (l: string, v: string, bold = false) =>
    `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f0f0f0;">${l}</td><td style="padding:8px 12px;font-size:13px;font-weight:${bold ? "700" : "500"};color:#1a1f2e;text-align:right;border-bottom:1px solid #f0f0f0;">${v}</td></tr>`;

  const body = `
    <p style="color:#4b5563;font-size:14px;margin:0 0 20px;">Sayın yetkili,</p>
    <p style="color:#4b5563;font-size:14px;margin:0 0 24px;">Aşağıda sipariş detaylarınızı bulabilirsiniz.</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      ${satir("Sipariş No", order.siparisNo)}
      ${satir("Müşteri", order.kaynak === "SITE" && order.musteriAd ? order.musteriAd : order.firma)}
      ${order.kaynak === "SITE" && order.firma && order.firma !== order.musteriAd ? satir("Firma", order.firma) : ""}
      ${satir("Ürün", order.urun)}
      ${satir("Durum", DURUM_LABEL[order.durum] ?? order.durum)}
      ${order.kargoNo ? satir("Kargo No", order.kargoNo) : ""}
    </table>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      ${satir("Adet", `${order.adet} adet`)}
      ${order.birimFiyat > 0 ? satir("Birim Fiyat", fmt(order.birimFiyat)) : ""}
      ${order.birimFiyat > 0 ? satir("Ara Toplam", fmt(araToplam)) : ""}
      ${order.birimFiyat > 0 && order.kdvOrani > 0 ? satir(`KDV (%${order.kdvOrani})`, fmt(kdvTutar)) : ""}
      ${order.birimFiyat > 0 && order.kdvOrani === 0 ? satir("KDV", "Dahildir") : ""}
      ${order.indirim > 0 ? satir("İndirim", `- ${fmt(order.indirim)}`) : ""}
      ${satir("Genel Toplam", fmt(genelToplam), true)}
    </table>
    ${order.notlar ? `<p style="color:#4b5563;font-size:13px;padding:12px;background:#f9fafb;border-radius:8px;border-left:3px solid #00d4ff;">${order.notlar}</p>` : ""}
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">Bu e-posta QONTAC Platform üzerinden otomatik gönderilmiştir.</p>
  `;

  await sendMail({ to, subject: `QONTAC Sipariş: ${order.siparisNo}`, html: htmlLayout(`Sipariş Detayı — ${order.siparisNo}`, body) });
  return NextResponse.json({ ok: true });
}
