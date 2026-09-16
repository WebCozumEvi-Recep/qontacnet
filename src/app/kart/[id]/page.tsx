import type { Metadata } from "next";
import { Suspense } from "react";
import { after } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KartAksiyonlar } from "./KartAksiyonlar";
import { FirmaSablonu, FirmaSablonuIskelet } from "./FirmaSablonu";
import type { UyeModul } from "@/components/UyeModulLightbox";
import { getKartCekirdek, getSablonOnizleme, kartGoruntulemeKaydet, ONIZLE_ONEK, type KartKaynak } from "@/lib/kart-data";
import { getSiteSettings } from "@/lib/site-settings";
import { getLocale } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";

type SearchParams = Promise<{ lang?: string; src?: string }>;
type Params = Promise<{ id: string }>;

/** Dil: ?lang= > NEXT_LOCALE çerezi > tr */
async function cozulenDil(searchParams: SearchParams): Promise<Locale> {
  const { lang } = await searchParams;
  return isLocale(lang) ? lang : await getLocale();
}

/** Gerçek kart ya da şablon önizlemesi — ikisi de aynı görünümü besler. */
function kartVerisi(id: string, locale: Locale) {
  return id.startsWith(ONIZLE_ONEK)
    ? getSablonOnizleme(id.slice(ONIZLE_ONEK.length))
    : getKartCekirdek(id, locale);
}

function kaynakCoz(src: string | undefined): KartKaynak {
  if (src === "nfc") return "NFC";
  if (src === "qr") return "QR";
  if (src === "domain") return "DOMAIN"; // üyenin kendi web adresinden gelen ziyaret
  return "LINK";
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { id } = await params;
  const veri = await kartVerisi(id, await cozulenDil(searchParams));
  if (!veri) return { title: "Kart bulunamadı | QONTAC" };

  const { card } = veri;
  const adSoyad = `${card.ad} ${card.soyad}`.trim();
  const aciklama = card.biyografi || [card.unvan, card.takim || card.firmaAdi].filter(Boolean).join(" · ");
  return {
    title: `${adSoyad} | QONTAC Dijital Kartvizit`,
    description: aciklama,
    openGraph: {
      title: adSoyad,
      description: aciklama,
      type: "profile",
      ...(card.avatar ? { images: [card.avatar] } : {}),
    },
  };
}

export default async function KartPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { src } = await searchParams;
  const locale = await cozulenDil(searchParams);

  // Kart çekirdeği ve site logosu paralel; logo önbellekten geldiği için DB'ye gitmez.
  const [veri, ayarlar] = await Promise.all([kartVerisi(id, locale), getSiteSettings()]);
  if (!veri) notFound();

  const { card, templateId, uyeModuller } = veri;
  const color = card.kartRenk;
  const siteText = ayarlar?.logoText || "QONTAC";

  // Sayaç ve trafik kaydı yanıt gönderildikten sonra yazılır — sayfayı bekletmez.
  // Önizlemede gerçek üye yok, kayıt tutulmaz.
  if (!id.startsWith(ONIZLE_ONEK)) after(() => kartGoruntulemeKaydet(id, kaynakCoz(src)));

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#050816" }}>
      <div className="fixed top-0 left-0 w-full h-64 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}20 0%, transparent 70%)` }} />

      <div className="w-full max-w-sm mx-auto px-4 py-8 relative z-10">
        <div className="glass-card rounded-[2rem] p-6 mb-4 text-center relative overflow-hidden">
          {card.kartArkaplan && (
            <>
              <div className="absolute inset-0 pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url(${card.kartArkaplan})` }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(5,8,22,0.45) 0%, rgba(5,8,22,0.78) 100%)" }} />
            </>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}15 0%, transparent 60%)` }} />
          <div className="absolute inset-0 shimmer opacity-10" />
          <div className="relative z-10 inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center mx-auto" style={{ borderColor: `${color}50`, background: `${color}15` }}>
              {card.avatar ? (
                <Image
                  src={card.avatar}
                  alt={`${card.ad} ${card.soyad}`}
                  width={96}
                  height={96}
                  priority
                  sizes="96px"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <span className="material-symbols-outlined text-5xl" style={{ color }}>person</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background flex items-center justify-center" style={{ background: color }}>
              <span className="material-symbols-outlined text-sm text-black">verified</span>
            </div>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-on-surface mb-1" style={{ fontFamily: "Sora, sans-serif" }}>{card.ad} {card.soyad}</h1>
            <p className="text-sm font-medium mb-1" style={{ color }}>{card.unvan}</p>
            <p className="text-sm text-on-surface-variant">{card.takim || card.firmaAdi}</p>
            {card.biyografi && (
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed border-t border-white/10 pt-3">{card.biyografi}</p>
            )}
          </div>
        </div>

        <KartAksiyonlar card={card} uyeModuller={uyeModuller as UyeModul[]} kaynak={kaynakCoz(src)} />

        {templateId && (
          <Suspense fallback={<FirmaSablonuIskelet />}>
            <FirmaSablonu templateId={templateId} locale={locale} color={color} memberId={card.id} iletisimAdi={card.ad} />
          </Suspense>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-on-surface-variant/50 hover:text-on-surface-variant transition-all">
            <span className="font-bold tracking-widest" style={{ fontFamily: "Sora, sans-serif" }}>{siteText}</span>
            <span>·</span><span>Dijital Kartvizit Oluştur</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
