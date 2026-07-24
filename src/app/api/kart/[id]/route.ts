import { NextResponse } from "next/server";
import {
  getFirmaModulleri,
  getKartCekirdek,
  getSablonOnizleme,
  ONIZLE_ONEK,
} from "@/lib/kart-data";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Kart verisi (üye panelindeki "Modüllerim" ve firma şablonu önizlemeleri için).
 *
 * Public /kart/[id] sayfası veriyi artık doğrudan sunucuda okuyor; bu uç yalnız
 * panel önizlemelerine hizmet ettiğinden görüntülenme sayacı burada işlenmez —
 * üyenin kendi önizlemesi istatistikleri şişirmez.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const langParam = new URL(req.url).searchParams.get("lang");
  const locale: Locale = isLocale(langParam) ? langParam : DEFAULT_LOCALE;

  const onizleme = id.startsWith(ONIZLE_ONEK);
  const veri = onizleme
    ? await getSablonOnizleme(id.slice(ONIZLE_ONEK.length))
    : await getKartCekirdek(id, locale);

  if (!veri) {
    return NextResponse.json(
      { ok: false, error: onizleme ? "Şablon bulunamadı." : "Kart bulunamadı." },
      { status: 404 },
    );
  }

  const moduller = veri.templateId ? await getFirmaModulleri(veri.templateId, locale) : [];

  return NextResponse.json({
    ok: true,
    locale,
    ...(onizleme ? { preview: true } : {}),
    card: veri.card,
    moduller,
    uyeModuller: veri.uyeModuller,
  });
}
