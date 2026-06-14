import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";
import { getI18n } from "@/lib/i18n/server";
import { tx } from "@/lib/i18n/auto";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

async function getSayfa(slug: string) {
  try {
    return await prisma.customPage.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sayfa = await getSayfa(slug);
  return { title: sayfa?.baslik ? `${sayfa.baslik} — QONTAC` : "QONTAC" };
}

export default async function CustomPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [sayfa, s, { locale, t }] = await Promise.all([getSayfa(slug), getSiteSettings(), getI18n()]);
  if (!sayfa || !sayfa.aktif) notFound();

  // Dil seçimi: tr kaynak; elle girilmiş çeviri varsa onu kullan; yoksa otomatik çevir.
  let baslik = sayfa.baslik;
  let icerik = sayfa.icerik || "";
  if (locale !== DEFAULT_LOCALE) {
    const ceviriler = (sayfa.ceviriler ?? {}) as Record<string, { baslik?: string; icerik?: string }>;
    const elle = ceviriler[locale];
    if (elle?.baslik || elle?.icerik) {
      baslik = elle.baslik || sayfa.baslik;
      icerik = elle.icerik || sayfa.icerik || "";
    } else {
      const auto = await tx({ baslik: sayfa.baslik, icerik: sayfa.icerik || "" }, locale, { isHtml: true });
      baslik = auto.baslik;
      icerik = auto.icerik;
    }
  }

  return (
    <>
      <Header logoUrl={s?.logoUrl || ""} logoText={s?.logoText || "QONTAC"} nav={t.nav} locale={locale} />
      <main className="pt-20 min-h-[70vh]">
        <article className="max-w-[820px] mx-auto px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-8" style={{ fontFamily: "Sora, sans-serif" }}>
            {baslik}
          </h1>
          <div className="ck-content prose-custom" dangerouslySetInnerHTML={{ __html: icerik }} />
        </article>
      </main>
      <Footer />
    </>
  );
}
