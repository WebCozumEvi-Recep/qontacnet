import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  // Görüntülenme sayacı (await etmeden)
  prisma.member.update({ where: { id }, data: { goruntulemeSayisi: { increment: 1 } } }).catch(() => {});

  // Firma aktif teması varsa onu kullan; firma yoksa üyenin varsayılan rengi
  const firmaRenk = member.firma?.templates[0]?.renk ?? null;

  return NextResponse.json({
    ok: true,
    card: {
      id: member.id,
      ad: member.ad,
      soyad: member.soyad,
      unvan: member.unvan,
      firmaAdi: member.firma?.ad ?? "",
      avatar: member.avatar,
      kartRenk: firmaRenk ?? member.kartRenk,
      telefon: member.telefon,
      email: member.email,
      whatsapp: member.showWhatsapp ? member.whatsapp : "",
      linkedin: member.showLinkedin ? member.linkedin : "",
      instagram: member.showInstagram ? member.instagram : "",
      website: member.showWebsite ? member.website : "",
      biyografi: member.showBio ? member.biyografi : "",
    },
    moduller,
  });
}
