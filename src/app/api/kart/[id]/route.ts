import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tx, txContent } from "@/lib/i18n/auto";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const langParam = new URL(req.url).searchParams.get("lang");
  const locale: Locale = isLocale(langParam) ? langParam : DEFAULT_LOCALE;

  // Şablon önizleme modu: /kart/onizle-<templateId> — firma panelinden bir
  // şablonun tam kart görünümünü (alt modülleriyle) örnek profil üzerinde gösterir.
  const ONIZLE = "onizle-";
  if (id.startsWith(ONIZLE)) {
    const templateId = id.slice(ONIZLE.length);
    const template = await prisma.cardTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, ad: true, renk: true, firma: { select: { ad: true } } },
    });
    if (!template) {
      return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });
    }
    const previewModuller = await prisma.firmaModul.findMany({
      where: { templateId, aktif: true },
      orderBy: { sira: "asc" },
      select: { id: true, tip: true, baslik: true, icerik: true },
    });
    const cevPreview = await Promise.all(
      previewModuller.map(async (m) => ({
        ...m,
        baslik: (await tx({ b: m.baslik ?? "" }, locale)).b,
        icerik: await txContent(m.icerik, locale),
      })),
    );
    return NextResponse.json({
      ok: true,
      locale,
      preview: true,
      card: {
        id,
        ad: "Ad",
        soyad: "Soyad",
        unvan: "Unvan",
        firmaAdi: template.firma?.ad ?? "",
        avatar: null,
        kartArkaplan: null,
        kartRenk: template.renk,
        telefon: "",
        email: "",
        whatsapp: "",
        linkedin: "",
        instagram: "",
        website: "",
        biyografi: "",
      },
      moduller: cevPreview,
      uyeModuller: [],
    });
  }

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      firma: {
        select: {
          id: true, ad: true, website: true, logo: true,
          templates: { where: { aktif: true }, take: 1, select: { renk: true } },
        },
      },
    },
  });

  if (!member || !member.aktif) {
    return NextResponse.json({ ok: false, error: "Kart bulunamadı." }, { status: 404 });
  }

  // Aktif şablonun modülleri (şablon yoksa boş)
  const aktifTemplate = member.firma
    ? await prisma.cardTemplate.findFirst({
        where: { firmaId: member.firma.id, aktif: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
    : null;
  const moduller = aktifTemplate
    ? await prisma.firmaModul.findMany({
        where: { templateId: aktifTemplate.id, aktif: true },
        orderBy: { sira: "asc" },
        select: { id: true, tip: true, baslik: true, icerik: true },
      })
    : [];

  // Üyenin kendi eklediği modüller (aktif)
  const uyeModuller = await prisma.memberModul.findMany({
    where: { memberId: id, aktif: true },
    orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
    select: { id: true, tip: true, baslik: true, icerik: true, tanim: { select: { ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true } } },
  });

  // Görüntülenme sayacı (await etmeden)
  prisma.member.update({ where: { id }, data: { goruntulemeSayisi: { increment: 1 } } }).catch(() => {});

  // Firma aktif teması varsa onu kullan; firma yoksa üyenin varsayılan rengi
  const firmaRenk = member.firma?.templates[0]?.renk ?? null;

  const biyografi = member.showBio ? member.biyografi : "";

  // İstenen dile çevir (tr ise olduğu gibi; çeviriler DB'de önbelleğe alınır)
  const [ceviri, cevModuller, cevUyeModuller] = await Promise.all([
    tx({ unvan: member.unvan ?? "", biyografi: biyografi ?? "" }, locale),
    Promise.all(
      moduller.map(async (m) => ({
        ...m,
        baslik: (await tx({ b: m.baslik ?? "" }, locale)).b,
        icerik: await txContent(m.icerik, locale),
      })),
    ),
    Promise.all(
      uyeModuller.map(async (m) => ({
        ...m,
        baslik: (await tx({ b: m.baslik ?? "" }, locale)).b,
        icerik: await txContent(m.icerik, locale),
      })),
    ),
  ]);

  return NextResponse.json({
    ok: true,
    locale,
    card: {
      id: member.id,
      ad: member.ad,
      soyad: member.soyad,
      unvan: ceviri.unvan,
      firmaAdi: member.firma?.ad ?? "",
      avatar: member.avatar,
      kartArkaplan: member.kartArkaplan,
      kartRenk: firmaRenk ?? member.kartRenk,
      telefon: member.telefon,
      email: member.email,
      whatsapp: member.showWhatsapp ? member.whatsapp : "",
      linkedin: member.showLinkedin ? member.linkedin : "",
      instagram: member.showInstagram ? member.instagram : "",
      website: member.showWebsite ? member.website : "",
      biyografi: ceviri.biyografi,
    },
    moduller: cevModuller,
    uyeModuller: cevUyeModuller,
  });
}
