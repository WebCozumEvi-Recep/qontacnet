import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { translateFields, TranslateError } from "@/lib/i18n/translate";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

// Bir özel sayfanın başlık + içeriğini istenen dile otomatik çevirir (taslak).
// Kaydetmez; admin önizleyip düzenledikten sonra PUT ile kaydeder.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const { locale } = (await req.json().catch(() => ({}))) as { locale?: string };
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
    return NextResponse.json({ ok: false, error: "Geçersiz hedef dil." }, { status: 400 });
  }

  const sayfa = await prisma.customPage.findUnique({ where: { id }, select: { baslik: true, icerik: true } });
  if (!sayfa) return NextResponse.json({ ok: false, error: "Sayfa bulunamadı." }, { status: 404 });

  try {
    const out = await translateFields(
      { baslik: sayfa.baslik, icerik: sayfa.icerik || "" },
      locale,
      { isHtml: true, sourceLocale: DEFAULT_LOCALE },
    );
    return NextResponse.json({ ok: true, locale, ceviri: out });
  } catch (e) {
    const msg = e instanceof TranslateError ? e.message : "Çeviri başarısız.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
