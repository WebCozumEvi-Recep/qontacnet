import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDijigateConfig, odemeSorgula } from "@/lib/dijigate";
import { odemeOnaylandi, odemeBasarisiz } from "@/lib/odeme-sonuc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DijiGate webhook'u — ödeme olaylarının sunucu-sunucu bildirimi.
// Kullanıcı 3D ekranında tarayıcıyı kapatırsa dönüş adresi hiç çağrılmaz; bu uç
// o durumda siparişin doğru sonuçlanmasını sağlayan yedek yoldur.
//
// Payload (dokümandan):
//   { eventType, eventTime, eventTimeStamp, status, payloadId }
//   payloadId = istekte gönderdiğimiz bankOrderId (bizde siparisNo)
//
// GÜVENLİK: DijiGate webhook gövdesi için imza doğrulaması dokümante edilmemiş.
// Bu yüzden payload'daki `status` alanına GÜVENMİYORUZ — yalnızca "bu sipariş için
// bir olay oldu" sinyali olarak kullanıp ödemenin gerçek durumunu API'den sorguluyoruz.
export async function POST(req: NextRequest) {
  const govde = (await req.json().catch(() => null)) as { payloadId?: unknown; eventType?: unknown } | null;
  const siparisNo = String(govde?.payloadId ?? "").trim();

  // Bildirimi her hâlükârda 200 ile kapatıyoruz; aksi hâlde sağlayıcı tekrar dener.
  if (!siparisNo) return NextResponse.json({ ok: true });

  const order = await prisma.order.findUnique({ where: { siparisNo } });
  if (!order || order.odemeDurum === "ODENDI" || !order.odemeId) {
    return NextResponse.json({ ok: true });
  }

  const cfg = await getDijigateConfig();
  if (!cfg) return NextResponse.json({ ok: true });

  try {
    const sonuc = await odemeSorgula(cfg, order.odemeId);
    if (sonuc.basarili) {
      await odemeOnaylandi(siparisNo, `${sonuc.authCode}/${sonuc.transId}`);
    } else if (sonuc.paymentStatus === "FAILURE") {
      await odemeBasarisiz(siparisNo, sonuc.hataMesaji || sonuc.paymentStatus);
    }
    // INITIAL vb. ara durumlarda dokunmuyoruz — kullanıcı hâlâ 3D ekranında olabilir.
  } catch (e) {
    console.error("[dijigate/webhook]", siparisNo, e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}
