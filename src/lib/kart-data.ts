import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { tx, txContent } from "@/lib/i18n/auto";
import type { Locale } from "@/lib/i18n/config";

export type KartKaynak = "NFC" | "QR" | "LINK" | "DOMAIN";

export interface KartBilgisi {
  id: string;
  ad: string;
  soyad: string;
  unvan: string;
  firmaAdi: string;
  takim: string;
  kartRenk: string;
  telefon: string;
  email: string;
  whatsapp: string;
  linkedin: string;
  instagram: string;
  website: string;
  biyografi: string;
  avatar: string | null;
  kartArkaplan: string | null;
}

export interface KartModul {
  id: string;
  tip: string;
  baslik: string;
  icerik: Record<string, unknown>;
}

export interface KartUyeModul extends KartModul {
  tanim: { ikon: string; ikonAd: string; butonRenk: string; ikonRenk: string } | null;
}

const UYE_MODUL_SELECT = {
  id: true,
  tip: true,
  baslik: true,
  icerik: true,
  tanim: { select: { ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true } },
} as const;

/**
 * Kartın ilk boyamada gereken çekirdek verisi: üye + kendi modül butonları.
 *
 * `cache()` ile aynı istek içinde tekrar çağrılırsa (ör. generateMetadata + sayfa)
 * DB'ye yalnız bir kez gider.
 */
export const getKartCekirdek = cache(async (id: string, locale: Locale) => {
  // Üye, aktif şablon ve üye modülleri birbirinden bağımsız — paralel çekilir.
  const [member, uyeModullerRaw] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      select: {
        id: true, ad: true, soyad: true, unvan: true, departman: true, aktif: true,
        kartRenk: true, telefon: true, email: true, whatsapp: true, linkedin: true,
        instagram: true, website: true, biyografi: true, avatar: true, kartArkaplan: true,
        showBio: true, showWhatsapp: true, showLinkedin: true, showInstagram: true, showWebsite: true,
        firma: {
          select: {
            id: true, ad: true, varsayilanAvatar: true, varsayilanArkaplan: true,
            templates: { where: { aktif: true }, take: 1, orderBy: { createdAt: "asc" }, select: { id: true, renk: true } },
          },
        },
      },
    }),
    prisma.memberModul.findMany({
      where: { memberId: id, aktif: true },
      orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
      select: UYE_MODUL_SELECT,
    }),
  ]);

  if (!member || !member.aktif) return null;

  const biyografi = member.showBio ? member.biyografi : "";
  const ceviri = await tx({ unvan: member.unvan ?? "", biyografi: biyografi ?? "" }, locale);

  const card: KartBilgisi = {
    id: member.id,
    ad: member.ad,
    soyad: member.soyad,
    unvan: ceviri.unvan,
    firmaAdi: member.firma?.ad ?? "",
    // Kart üzerinde firma tam unvanı yerine üyenin profilde girdiği takım adı gösterilir
    takim: member.departman ?? "",
    // Üye kendi görselini yüklemediyse firmanın varsayılanı gösterilir
    avatar: member.avatar || member.firma?.varsayilanAvatar || "",
    kartArkaplan: member.kartArkaplan || member.firma?.varsayilanArkaplan || "",
    kartRenk: member.firma?.templates[0]?.renk ?? member.kartRenk,
    telefon: member.telefon,
    email: member.email,
    whatsapp: member.showWhatsapp ? member.whatsapp : "",
    linkedin: member.showLinkedin ? member.linkedin : "",
    instagram: member.showInstagram ? member.instagram : "",
    website: member.showWebsite ? member.website : "",
    biyografi: ceviri.biyografi,
  };

  return {
    card,
    templateId: member.firma?.templates[0]?.id ?? null,
    uyeModuller: (await ceviriliModuller(uyeModullerRaw, locale)) as KartUyeModul[],
  };
});

/** `/kart/onizle-<templateId>` — firma panelindeki şablon önizlemesinin id öneki. */
export const ONIZLE_ONEK = "onizle-";

/**
 * Şablon önizlemesi: gerçek üye yerine örnek profil üzerinde şablonun tam kart
 * görünümünü döndürür. Alanlar sabit yer tutucu olduğu için dile bağlı değildir;
 * şablon modüllerinin çevirisini `getFirmaModulleri` yapar.
 */
export const getSablonOnizleme = cache(async (templateId: string) => {
  const template = await prisma.cardTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, renk: true, firma: { select: { ad: true } } },
  });
  if (!template) return null;

  const card: KartBilgisi = {
    id: `${ONIZLE_ONEK}${templateId}`,
    ad: "Ad", soyad: "Soyad", unvan: "Unvan",
    firmaAdi: template.firma?.ad ?? "", takim: "",
    kartRenk: template.renk,
    telefon: "", email: "", whatsapp: "", linkedin: "", instagram: "", website: "",
    biyografi: "", avatar: null, kartArkaplan: null,
  };
  return { card, templateId: template.id, uyeModuller: [] as KartUyeModul[] };
});

/**
 * Firma şablonu modülleri — kartın altında görünen ağır içerik blokları.
 * Kart gövdesini bekletmemek için ayrı çekilir ve Suspense ile akıtılır.
 */
export const getFirmaModulleri = cache(async (templateId: string, locale: Locale): Promise<KartModul[]> => {
  const moduller = await prisma.firmaModul.findMany({
    where: { templateId, aktif: true },
    orderBy: { sira: "asc" },
    select: { id: true, tip: true, baslik: true, icerik: true },
  });
  return ceviriliModuller(moduller, locale);
});

/** Modül başlık ve içeriklerini aktif dile çevirir. */
async function ceviriliModuller<T extends { baslik: string | null; icerik: unknown }>(
  moduller: T[],
  locale: Locale,
): Promise<(Omit<T, "baslik" | "icerik"> & { baslik: string; icerik: Record<string, unknown> })[]> {
  // Başlıklar tek bir tx çağrısında toplanır — modül başına ayrı DB sorgusu olmaz.
  const basliklar: Record<string, string> = {};
  moduller.forEach((m, i) => (basliklar[`b${i}`] = m.baslik ?? ""));
  const [cevBaslik, cevIcerik] = await Promise.all([
    tx(basliklar, locale),
    Promise.all(moduller.map((m) => txContent(m.icerik, locale))),
  ]);

  return moduller.map((m, i) => ({
    ...m,
    baslik: cevBaslik[`b${i}`] ?? "",
    icerik: (cevIcerik[i] ?? {}) as Record<string, unknown>,
  }));
}

/** Görüntülenme sayacı + kaynak bazlı trafik kaydı. Yanıtı bloklamaz. */
export async function kartGoruntulemeKaydet(id: string, kaynak: KartKaynak): Promise<void> {
  await Promise.allSettled([
    prisma.member.update({ where: { id }, data: { goruntulemeSayisi: { increment: 1 } } }),
    prisma.kartGoruntuleme.create({ data: { memberId: id, kaynak } }),
  ]);
}
