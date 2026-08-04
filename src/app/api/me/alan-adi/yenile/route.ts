import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { odemeBaslat, odemeAcikMi, kartBilgisiGerekliMi, kartCoz, istemciIp, OdemeYapilandirmaHatasi } from "@/lib/odeme";
import { DijigateError } from "@/lib/dijigate";
import { nextSiparisNo } from "@/lib/siparis-no";
import { getDomainApiConfig, getFiyatAyarlari, tldMaliyetleri, DomainApiError, type IletisimBilgisi } from "@/lib/domainapi";
import { satisFiyati } from "@/lib/domain-fiyat";

export const runtime = "nodejs";

// Alan adı yenileme siparişi — satın alma ile aynı ödeme akışını kullanır.
// Ödeme onaylandığında /api/odeme/callback yenileme dalını çalıştırır.
export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "");

  const kayit = await prisma.alanAdi.findFirst({ where: { id, memberId: session.sub } });
  if (!kayit) return NextResponse.json({ ok: false, error: "Alan adı bulunamadı." }, { status: 404 });
  if (kayit.durum === "ODEME_BEKLIYOR" || kayit.durum === "KAYIT_EDILIYOR") {
    return NextResponse.json({ ok: false, error: "Bu adres için devam eden bir işlem var." }, { status: 409 });
  }

  const cfg = await getDomainApiConfig();
  if (!cfg) return NextResponse.json({ ok: false, error: "Alan adı servisi yapılandırılmadı." }, { status: 503 });

  if (!(await odemeAcikMi())) {
    return NextResponse.json({ ok: false, error: "Ödeme sistemi yapılandırılmadı." }, { status: 503 });
  }

  let kart;
  if (await kartBilgisiGerekliMi()) {
    const cozum = kartCoz(body);
    if ("hata" in cozum) return NextResponse.json({ ok: false, error: cozum.hata }, { status: 400 });
    kart = cozum;
  }

  try {
    const [maliyetler, fiyatAyar] = await Promise.all([tldMaliyetleri(cfg), getFiyatAyarlari()]);
    // Yenileme fiyatı kayıt fiyatından farklıdır; yoksa kayıt fiyatına düşülür.
    const maliyetKurus = maliyetler[kayit.tld]?.yenilemeKurus || maliyetler[kayit.tld]?.kayitKurus || 0;
    if (maliyetKurus <= 0) {
      return NextResponse.json({ ok: false, error: "Yenileme fiyatı alınamadı. Lütfen daha sonra tekrar deneyin." }, { status: 502 });
    }
    const tutar = satisFiyati(maliyetKurus, fiyatAyar);

    const iletisim = kayit.iletisim as IletisimBilgisi | null;
    const musteriAd = iletisim ? `${iletisim.ad} ${iletisim.soyad}`.trim() : "";
    const member = await prisma.member.findUnique({ where: { id: session.sub }, select: { email: true } });

    const siparisNo = await nextSiparisNo();
    const order = await prisma.order.create({
      data: {
        siparisNo,
        firma: iletisim?.firma || musteriAd,
        urun: `Alan Adı Yenileme: ${kayit.alanAdi} (1 yıl)`,
        adet: 1,
        tutar,
        birimFiyat: tutar,
        kdvOrani: 0,
        durum: "HAZIRLANIYOR",
        kaynak: "DOMAIN_YENILEME",
        odemeDurum: "BEKLIYOR",
        musteriAd,
        email: iletisim?.email || member?.email || "",
        telefon: iletisim ? `${iletisim.telefonUlkeKodu}${iletisim.telefon}` : "",
        notlar: `Üye: ${member?.email ?? session.sub}`,
      },
    });

    await prisma.alanAdi.update({
      where: { id: kayit.id },
      data: { siparisNo: order.siparisNo, satisTutar: tutar, maliyetKurus },
    });

    const odeme = await odemeBaslat({
      siparisNo: order.siparisNo,
      tutar,
      email: order.email,
      musteriAd,
      kalemler: [{ name: `Alan Adı Yenileme: ${kayit.alanAdi}`, price: tutar }],
      kart,
      clientIp: istemciIp(req.headers),
      donusYolu: "/uye/web-adresin",
    });

    return NextResponse.json({ ok: true, siparisNo: order.siparisNo, tutar, odeme });
  } catch (e) {
    if (e instanceof DomainApiError) return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    if (e instanceof OdemeYapilandirmaHatasi) return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    if (e instanceof DijigateError) return NextResponse.json({ ok: false, error: e.message }, { status: 402 });
    return NextResponse.json({ ok: false, error: "Yenileme siparişi oluşturulamadı." }, { status: 500 });
  }
}
