import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPaymentForm, getQnbConfig } from "@/lib/qnbpos";
import { nextSiparisNo } from "@/lib/siparis-no";

// Public: ana sayfadan ürün satın alma — sipariş ödeme beklemede oluşturulur,
// QNB sanal POS 3D ödeme formu döner. Ödeme onayı /api/odeme/callback'te işlenir.
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

    const qnbCfg = await getQnbConfig();
    if (!qnbCfg) {
      return NextResponse.json({ ok: false, error: "Ödeme sistemi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
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

    const siparisNo = await nextSiparisNo();

    const order = await prisma.order.create({
      data: {
        siparisNo,
        firma: String(firma || firmaUnvan || musteriAd),
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

    const paymentForm = buildPaymentForm(qnbCfg, {
      siparisNo: order.siparisNo,
      tutar,
      email: String(email),
      musteriAd: String(musteriAd),
    });

    return NextResponse.json({ ok: true, siparisNo: order.siparisNo, paymentForm });
  } catch {
    return NextResponse.json({ ok: false, error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
