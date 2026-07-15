import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// DB şemasını admin panelinden günceller. Yalnız admin.
//
// Neden CLI değil: canlı Next.js "standalone" derlemesinde prisma CLI binary'si
// bulunmaz (spawn ENOENT). Bu yüzden şema eşitlemesini runtime Prisma Client ile,
// idempotent DDL çalıştırarak yaparız — hepsi "IF NOT EXISTS" olduğundan eksik
// olanı ekler, var olanı atlar; tekrar basmak güvenlidir ve veri silmez.
//
// Yeni bir şema değişikliği eklendiğinde ilgili idempotent satırı bu listeye ekleyin.
export const runtime = "nodejs";

const ENUM_UYE_MODUL = ["GALERI", "TEXT", "VIDEO", "LINK", "GORSEL", "FORM", "TEK_GORSEL", "HTML", "SSS", "HERO", "BASVURU"];
const ENUM_FIRMA_MODUL = ["HAKKIMIZDA", "GALERI", "VIDEO", "FORM", "HTML", "TEK_GORSEL", "SSS", "HERO"];

function ddlListesi(): { ad: string; sql: string }[] {
  const list: { ad: string; sql: string }[] = [
    // QNB Sanal POS kolonları
    { ad: "SiteSettings.qnbAktif", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbAktif" BOOLEAN NOT NULL DEFAULT false` },
    { ad: "SiteSettings.qnbTest", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbTest" BOOLEAN NOT NULL DEFAULT true` },
    { ad: "SiteSettings.qnbMerchantId", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbMerchantId" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.qnbUserCode", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbUserCode" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.qnbMerchantPass", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbMerchantPass" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.qnbMbrId", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbMbrId" TEXT NOT NULL DEFAULT '5'` },
    { ad: "SiteSettings.qnbTerminalId", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbTerminalId" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.qnbApiPassword", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbApiPassword" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.qnbCurrency", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbCurrency" TEXT NOT NULL DEFAULT '949'` },
    { ad: "SiteSettings.qnbLang", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "qnbLang" TEXT NOT NULL DEFAULT 'tr'` },
    // NFC kart kilit anahtarı
    { ad: "SiteSettings.nfcKilitAnahtari", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "nfcKilitAnahtari" TEXT NOT NULL DEFAULT ''` },
  ];
  // Enum değerleri (üye + firma modül tipleri)
  for (const v of ENUM_UYE_MODUL) list.push({ ad: `UyeModulTip.${v}`, sql: `ALTER TYPE "UyeModulTip" ADD VALUE IF NOT EXISTS '${v}'` });
  for (const v of ENUM_FIRMA_MODUL) list.push({ ad: `FirmaModulTip.${v}`, sql: `ALTER TYPE "FirmaModulTip" ADD VALUE IF NOT EXISTS '${v}'` });
  return list;
}

export async function POST() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const satirlar: string[] = [];
  let hataVar = false;
  for (const { ad, sql } of ddlListesi()) {
    try {
      await prisma.$executeRawUnsafe(sql);
      satirlar.push(`✓ ${ad}`);
    } catch (e) {
      hataVar = true;
      satirlar.push(`✗ ${ad} — ${(e instanceof Error ? e.message : String(e)).split("\n")[0]}`);
    }
  }

  const cikti = satirlar.join("\n");
  return NextResponse.json({
    ok: !hataVar,
    error: hataVar ? "Bazı adımlar uygulanamadı — çıktıyı inceleyin." : undefined,
    cikti: `${satirlar.filter(s => s.startsWith("✓")).length}/${satirlar.length} adım tamam.\n\n${cikti}`,
  });
}
