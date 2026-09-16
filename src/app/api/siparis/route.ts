import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextSiparisNo } from "@/lib/siparis-no";
import { odemeBaslat, odemeAcikMi, kartBilgisiGerekliMi, kartCoz, istemciIp, OdemeYapilandirmaHatasi } from "@/lib/odeme";
import { DijigateError } from "@/lib/dijigate";

// Public: ana sayfadan ürün satın alma — sipariş ödeme beklemede oluşturulur,
// seçili ödeme sağlayıcısının 3D akışı başlatılır (bkz. src/lib/odeme.ts).
// Ödeme sonucu QNB'de /api/odeme/callback, DijiGate'te /api/odeme/dijigate/donus'ta işlenir.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { urunId, adet, musteriAd, email, telefon, adres, firma, notlar } = body;
    const faturaTip = body.faturaTip === "KURUMSAL" ? "KURUMSAL" : "BIREYSEL";
    const tcKimlik = String(body.tcKimlik || "").replace(/\D/g, "");
    const vergiNo = String(body.vergiNo || "").replace(/\D/g, "");
    const vergiDairesi = String(body.vergiDairesi || "").trim();
    const firmaUnvan = String(body.firmaUnvan || "").trim();

    if (!urunId || !musteriAd || !telefon || !email || !adres) {
      return NextResponse.json({ ok: false, error: "Ürün, ad soyad, telefon, e-posta ve adres zorunludur." }, { status: 400 });
    }

    // Fatura doğrulama
    if (faturaTip === "BIREYSEL") {
      if (tcKimlik.length !== 11) {
        return NextResponse.json({ ok: false, error: "Geçerli bir T.C. kimlik numarası girin (11 hane)." }, { status: 400 });
      }
    } else {
      if (vergiNo.length !== 10 && vergiNo.length !== 11) {
        return NextResponse.json({ ok: false, error: "Geçerli bir vergi numarası girin (10-11 hane)." }, { status: 400 });
      }
      if (!vergiDairesi || !firmaUnvan) {
        return NextResponse.json({ ok: false, error: "Kurumsal fatura için vergi dairesi ve firma unvanı zorunludur." }, { status: 400 });
      }
    }

    if (!(await odemeAcikMi())) {
      return NextResponse.json({ ok: false, error: "Ödeme sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
    }

    // Seçili sağlayıcı kart bilgisi istiyorsa (DijiGate) formdan gelen kartı doğrula.
    let kart;
    if (await kartBilgisiGerekliMi()) {
      const cozum = kartCoz(body);
      if ("hata" in cozum) return NextResponse.json({ ok: false, error: cozum.hata }, { status: 400 });
      kart = cozum;
    }

    const urun = await prisma.product.findUnique({ where: { id: String(urunId) } });
    if (!urun || !urun.aktif) {
      return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
    }

    const adetNum = Math.max(1, Math.min(1000, Number(adet) || 1));
    const tutar = urun.fiyat * adetNum;
    if (tutar <= 0) {
      return NextResponse.json({ ok: false, error: "Bu ürün için online ödeme yapılamıyor." }, { status: 400 });
    }

    // Firmaya özel satış linkinden (?ref=<firmaId>) gelindiyse referans firma.
    const ref = typeof body.ref === "string" ? body.ref.slice(0, 50) : "";
    const refFirma = ref ? await prisma.firma.findUnique({ where: { id: ref }, select: { id: true } }) : null;

    const siparisNo = await nextSiparisNo();

    const order = await prisma.order.create({
      data: {
        siparisNo,
        firma: String(firma || firmaUnvan || musteriAd),
        firmaId: refFirma?.id ?? null,
        urun: urun.ad,
        adet: adetNum,
        tutar,
        birimFiyat: urun.fiyat,
        kdvOrani: 0, // site fiyatları KDV dahildir; üzerine KDV eklenmez
        durum: "HAZIRLANIYOR",
        kaynak: "SITE",
        odemeDurum: "BEKLIYOR",
        musteriAd: String(musteriAd).slice(0, 200),
        email: String(email).slice(0, 200),
        telefon: String(telefon).slice(0, 50),
        adres: String(adres).slice(0, 1000),
        notlar: String(notlar || "").slice(0, 1000),
        faturaTip,
        tcKimlik: faturaTip === "BIREYSEL" ? tcKimlik : "",
        vergiNo: faturaTip === "KURUMSAL" ? vergiNo : "",
        vergiDairesi: faturaTip === "KURUMSAL" ? vergiDairesi.slice(0, 100) : "",
        firmaUnvan: faturaTip === "KURUMSAL" ? firmaUnvan.slice(0, 200) : "",
      },
    });

    const odeme = await odemeBaslat({
      siparisNo: order.siparisNo,
      tutar,
      email: String(email),
      musteriAd: String(musteriAd),
      kalemler: [{ id: urun.id, name: urun.ad, price: tutar }],
      kart,
      clientIp: istemciIp(req.headers),
      donusYolu: "/",
    });

    return NextResponse.json({ ok: true, siparisNo: order.siparisNo, odeme });
  } catch (e) {
    if (e instanceof OdemeYapilandirmaHatasi) return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    if (e instanceof DijigateError) return NextResponse.json({ ok: false, error: e.message }, { status: 402 });
    return NextResponse.json({ ok: false, error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
