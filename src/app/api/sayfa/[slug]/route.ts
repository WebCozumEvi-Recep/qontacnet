import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tx } from "@/lib/i18n/auto";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// Tek bir özel sayfanın içeriğini seçili dile göre döndürür.
// Sözleşme popup'ları (KVKK, Kullanım Koşulları) bunu kullanır.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const langParam = req.nextUrl.searchParams.get("lang");
  const locale = isLocale(langParam) ? langParam : await getLocale();

  let sayfa;
  try {
    sayfa = await prisma.customPage.findUnique({ where: { slug } });
  } catch {
    return NextResponse.json({ ok: false, error: "Sayfa okunamadı." }, { status: 500 });
  }
  if (!sayfa || !sayfa.aktif) {
    return NextResponse.json({ ok: false, error: "Sayfa bulunamadı." }, { status: 404 });
  }

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

  return NextResponse.json({ ok: true, slug, locale, baslik, icerik });
}
