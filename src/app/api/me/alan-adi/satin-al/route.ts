import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { odemeBaslat, odemeAcikMi, kartBilgisiGerekliMi, kartCoz, istemciIp, OdemeYapilandirmaHatasi } from "@/lib/odeme";
import { DijigateError } from "@/lib/dijigate";
import { nextSiparisNo } from "@/lib/siparis-no";
import { getDomainApiConfig, getFiyatAyarlari, musaitlikSorgula, tldMaliyetleri, DomainApiError, type IletisimBilgisi } from "@/lib/domainapi";
import { satisFiyati } from "@/lib/domain-fiyat";
import { alanAdiCoz } from "@/lib/domain-kurallar";

export const runtime = "nodejs";

/** WHOIS/fatura formundan gelen iletişim bilgilerini doğrular. */
function iletisimCoz(body: Record<string, unknown>): IletisimBilgisi | { hata: string } {
  const al = (k: string, max = 200) => String(body[k] ?? "").trim().slice(0, max);

  const bilgi: IletisimBilgisi = {
    ad: al("ad", 60),
    soyad: al("soyad", 60),
    firma: al("firma", 120),
    email: al("email", 120).toLowerCase(),
    adres: al("adres", 300),
    sehir: al("sehir", 60),
    ilce: al("ilce", 60),
    postaKodu: al("postaKodu", 12),
    ulke: (al("ulke", 2) || "TR").toUpperCase(),
    telefonUlkeKodu: al("telefonUlkeKodu", 5) || "+90",
    telefon: al("telefon", 20).replace(/\D/g, ""),
  };

  if (!bilgi.ad || !bilgi.soyad) return { hata: "Ad ve soyad zorunludur." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(bilgi.email)) return { hata: "Geçerli bir e-posta adresi girin." };
  if (bilgi.telefon.length < 10) return { hata: "Geçerli bir telefon numarası girin." };
  if (!bilgi.adres) return { hata: "Adres zorunludur." };
  if (!bilgi.sehir) return { hata: "Şehir zorunludur." };
  if (!/^\d{4,10}$/.test(bilgi.postaKodu)) return { hata: "Geçerli bir posta kodu girin." };
  if (!/^[A-Z]{2}$/.test(bilgi.ulke)) return { hata: "Geçerli bir ülke seçin." };

  return bilgi;
}

export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Alan adı etiketi ayrı bir alanda gelir — `ad` WHOIS kişisinin adıdır, ikisi karışmasın.
  const cozum = alanAdiCoz(String(body.alanAdiEtiketi ?? ""), String(body.tld ?? ""));
  if ("hata" in cozum) return NextResponse.json({ ok: false, error: cozum.hata }, { status: 400 });
  const { alanAdi, tld } = cozum;

  if (!body.sozlesmeOnay) {
    return NextResponse.json({ ok: false, error: "Alan adı hizmet şartlarını onaylamanız gerekiyor." }, { status: 400 });
  }

  const iletisim = iletisimCoz(body);
  if ("hata" in iletisim) return NextResponse.json({ ok: false, error: iletisim.hata }, { status: 400 });

  const member = await prisma.member.findUnique({ where: { id: session.sub } });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });
  if (!member.kartAktif) {
    return NextResponse.json({ ok: false, error: "Web adresi almak için önce kartınızı aktive etmelisiniz." }, { status: 400 });
  }

  const cfg = await getDomainApiConfig();
  if (!cfg) return NextResponse.json({ ok: false, error: "Alan adı satışı henüz yapılandırılmadı." }, { status: 503 });

  if (!(await odemeAcikMi())) {
    return NextResponse.json({ ok: false, error: "Ödeme sistemi henüz yapılandırılmadı." }, { status: 503 });
  }

  // Seçili sağlayıcı kart bilgisi istiyorsa (DijiGate) formdan gelen kartı doğrula.
  let kart;
  if (await kartBilgisiGerekliMi()) {
    const cozum = kartCoz(body);
    if ("hata" in cozum) return NextResponse.json({ ok: false, error: cozum.hata }, { status: 400 });
    kart = cozum;
  }

  // Aynı alan adı için ilerlemiş bir kayıt varsa yeniden sipariş açma.
  // ODEME_BEKLIYOR hariç tutulur: kart reddedildiğinde üye aynı adresi tekrar
  // deneyebilmeli — o kayıt aşağıdaki upsert ile güncellenir.
  const YENIDEN_DENENEBILIR = ["IPTAL", "SURESI_DOLDU", "ODEME_BEKLIYOR"];
  const mevcut = await prisma.alanAdi.findUnique({ where: { alanAdi } });
  if (mevcut && !YENIDEN_DENENEBILIR.includes(mevcut.durum)) {
    const bize = mevcut.memberId === session.sub;
    return NextResponse.json(
      { ok: false, error: bize ? "Bu adres zaten hesabınızda kayıtlı." : "Bu adres kullanımda." },
      { status: 409 },
    );
  }
  // Ödemesi tamamlanmamış kayıt başkasına aitse üzerine yazmıyoruz.
  if (mevcut && mevcut.durum === "ODEME_BEKLIYOR" && mevcut.memberId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Bu adres için başka bir işlem sürüyor." }, { status: 409 });
  }

  try {
    // Fiyat ve müsaitlik SUNUCUDA yeniden doğrulanır — istemciden gelen fiyata güvenilmez.
    const [musaitlik, maliyetler, fiyatAyar] = await Promise.all([
      musaitlikSorgula(cfg, [alanAdi]),
      tldMaliyetleri(cfg),
      getFiyatAyarlari(),
    ]);

    const durum = musaitlik[0];
    if (!durum || !durum.musait) {
      return NextResponse.json({ ok: false, error: "Bu adres artık müsait değil. Lütfen başka bir adres deneyin." }, { status: 409 });
    }
    if (durum.premium) {
      return NextResponse.json({ ok: false, error: "Premium adresler panelden satın alınamıyor. Bizimle iletişime geçin." }, { status: 400 });
    }

    const maliyetKurus = maliyetler[tld]?.kayitKurus ?? 0;
    if (maliyetKurus <= 0) {
      return NextResponse.json({ ok: false, error: "Bu uzantı için fiyat alınamadı. Lütfen daha sonra tekrar deneyin." }, { status: 502 });
    }

    // Uzantıya özel alanlar (ör. .com.tr) — tanımı servisten gelir, değeri formdan.
    // Kayıt anında değil ödeme öncesinde doğrulanır ki üye parasını verdikten
    // sonra eksik belge yüzünden kurulum hatasına düşmesin.
    const nitelikTanim = maliyetler[tld]?.nitelikler ?? [];
    const gelen = (body.tldNitelikleri ?? {}) as Record<string, unknown>;
    const nitelikler: Record<string, string> = {};
    for (const n of nitelikTanim) {
      const deger = String(gelen[n.anahtar] ?? "").trim();
      if (!deger) {
        if (n.zorunlu) {
          return NextResponse.json(
            { ok: false, error: `.${tld} uzantısı için "${n.aciklama}" alanı zorunludur.` },
            { status: 400 },
          );
        }
        continue;
      }
      if (n.secenekler.length > 0 && !n.secenekler.some(s => s.deger === deger)) {
        return NextResponse.json({ ok: false, error: `"${n.aciklama}" alanı için geçersiz seçim.` }, { status: 400 });
      }
      nitelikler[n.anahtar] = deger.slice(0, 255);
    }
    const tutar = satisFiyati(maliyetKurus, fiyatAyar);

    const siparisNo = await nextSiparisNo();
    const musteriAd = `${iletisim.ad} ${iletisim.soyad}`.trim();

    const order = await prisma.order.create({
      data: {
        siparisNo,
        firma: iletisim.firma || musteriAd,
        urun: `Alan Adı: ${alanAdi} (1 yıl)`,
        adet: 1,
        tutar,
        birimFiyat: tutar,
        kdvOrani: 0, // fiyat KDV dahil gösterilir
        durum: "HAZIRLANIYOR",
        kaynak: "DOMAIN",
        odemeDurum: "BEKLIYOR",
        musteriAd,
        email: iletisim.email,
        telefon: `${iletisim.telefonUlkeKodu}${iletisim.telefon}`,
        adres: `${iletisim.adres}, ${iletisim.ilce || ""} ${iletisim.sehir} ${iletisim.postaKodu} ${iletisim.ulke}`.replace(/\s+/g, " ").trim(),
        notlar: `Üye: ${member.email}`,
      },
    });

    // Aynı adres için eski IPTAL/SURESI_DOLDU kaydı varsa üzerine yaz.
    await prisma.alanAdi.upsert({
      where: { alanAdi },
      create: {
        memberId: session.sub,
        alanAdi,
        tld,
        durum: "ODEME_BEKLIYOR",
        yil: 1,
        maliyetKurus,
        satisTutar: tutar,
        siparisNo: order.siparisNo,
        iletisim: { ...iletisim },
        tldNitelikleri: nitelikler,
      },
      update: {
        memberId: session.sub,
        durum: "ODEME_BEKLIYOR",
        yil: 1,
        maliyetKurus,
        satisTutar: tutar,
        siparisNo: order.siparisNo,
        iletisim: { ...iletisim },
        tldNitelikleri: nitelikler,
        hataMesaji: "",
      },
    });

    const odeme = await odemeBaslat({
      siparisNo: order.siparisNo,
      tutar,
      email: iletisim.email,
      musteriAd,
      kalemler: [{ name: `Alan Adı: ${alanAdi}`, price: tutar }],
      kart,
      clientIp: istemciIp(req.headers),
      donusYolu: "/uye/web-adresin",
    });

    return NextResponse.json({ ok: true, siparisNo: order.siparisNo, alanAdi, tutar, odeme });
  } catch (e) {
    if (e instanceof DomainApiError) return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    if (e instanceof OdemeYapilandirmaHatasi) return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
    if (e instanceof DijigateError) return NextResponse.json({ ok: false, error: e.message }, { status: 402 });
    return NextResponse.json({ ok: false, error: "Sipariş oluşturulamadı." }, { status: 500 });
  }
}
