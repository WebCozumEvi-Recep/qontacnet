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
    // Üye tarafı okundu takibi (firma'nın FormBasvuru.okundu alanından bağımsız)
    { ad: "Lead.okundu", sql: `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "okundu" BOOLEAN NOT NULL DEFAULT false` },
    { ad: "FormBasvuru.uyeOkundu", sql: `ALTER TABLE "FormBasvuru" ADD COLUMN IF NOT EXISTS "uyeOkundu" BOOLEAN NOT NULL DEFAULT false` },
    // Kaynak bazlı kart görüntülenme olayları (NFC/QR/Link trafiği)
    { ad: "KartGoruntuleme (tablo)", sql: `CREATE TABLE IF NOT EXISTS "KartGoruntuleme" ("id" TEXT NOT NULL, "memberId" TEXT NOT NULL, "kaynak" "LeadKaynak" NOT NULL DEFAULT 'LINK', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "KartGoruntuleme_pkey" PRIMARY KEY ("id"))` },
    { ad: "KartGoruntuleme (index)", sql: `CREATE INDEX IF NOT EXISTS "KartGoruntuleme_memberId_createdAt_idx" ON "KartGoruntuleme"("memberId", "createdAt")` },
    // Ödeme sağlayıcısı seçimi + DijiGate Gateway
    { ad: "SiteSettings.odemeSaglayici", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "odemeSaglayici" TEXT NOT NULL DEFAULT 'DIJIGATE'` },
    { ad: "SiteSettings.dijigateAktif", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "dijigateAktif" BOOLEAN NOT NULL DEFAULT false` },
    { ad: "SiteSettings.dijigateTest", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "dijigateTest" BOOLEAN NOT NULL DEFAULT true` },
    { ad: "SiteSettings.dijigateApiKey", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "dijigateApiKey" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.dijigateSecretKey", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "dijigateSecretKey" TEXT NOT NULL DEFAULT ''` },
    { ad: "Order.odemeSaglayici", sql: `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "odemeSaglayici" TEXT NOT NULL DEFAULT ''` },
    { ad: "Order.odemeId", sql: `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "odemeId" TEXT NOT NULL DEFAULT ''` },
    // QNB ile ödeme alınan mevcut kurulumda sağlayıcı QNB'de kalsın — DijiGate anahtarları
    // girilmeden geçiş yapmak çalışan ödemeleri durdurur. Geçiş admin panelinden yapılır.
    // Yalnızca bir kez etkilidir: sağlayıcı elle değiştirildikten sonra bu satır bir şey yapmaz
    // (koşul, sağlayıcının hâlâ ilk varsayılanında olmasını arar).
    {
      ad: "SiteSettings.odemeSaglayici (mevcut kurulum QNB'de kalsın)",
      sql: `UPDATE "SiteSettings" SET "odemeSaglayici" = 'QNB'
            WHERE "qnbAktif" = true AND "odemeSaglayici" = 'DIJIGATE' AND "dijigateApiKey" = ''`,
    },
    // Alan adı (domain) satışı — ayarlar
    { ad: "SiteSettings.domainAktif", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainAktif" BOOLEAN NOT NULL DEFAULT false` },
    { ad: "SiteSettings.domainTest", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainTest" BOOLEAN NOT NULL DEFAULT true` },
    { ad: "SiteSettings.domainResellerId", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainResellerId" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.domainApiKey", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainApiKey" TEXT NOT NULL DEFAULT ''` },
    { ad: "SiteSettings.domainKarMarji", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainKarMarji" INTEGER NOT NULL DEFAULT 35` },
    { ad: "SiteSettings.domainMinKar", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "domainMinKar" INTEGER NOT NULL DEFAULT 50` },
    // Alan adı tablosu
    { ad: "AlanAdiDurum (enum)", sql: `DO $$ BEGIN CREATE TYPE "AlanAdiDurum" AS ENUM ('ODEME_BEKLIYOR','KAYIT_EDILIYOR','YAYILIYOR','AKTIF','HATA','SURESI_DOLDU','IPTAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$` },
    { ad: "LeadKaynak.DOMAIN", sql: `ALTER TYPE "LeadKaynak" ADD VALUE IF NOT EXISTS 'DOMAIN'` },
    {
      ad: "AlanAdi (tablo)",
      sql: `CREATE TABLE IF NOT EXISTS "AlanAdi" (
        "id" TEXT NOT NULL,
        "memberId" TEXT NOT NULL,
        "alanAdi" TEXT NOT NULL,
        "tld" TEXT NOT NULL,
        "durum" "AlanAdiDurum" NOT NULL DEFAULT 'ODEME_BEKLIYOR',
        "yil" INTEGER NOT NULL DEFAULT 1,
        "maliyetKurus" INTEGER NOT NULL DEFAULT 0,
        "satisTutar" INTEGER NOT NULL DEFAULT 0,
        "siparisNo" TEXT,
        "registrarOrderCode" TEXT NOT NULL DEFAULT '',
        "contactHandle" TEXT NOT NULL DEFAULT '',
        "cfZoneId" TEXT NOT NULL DEFAULT '',
        "cfNameServers" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "cfRuleId" TEXT NOT NULL DEFAULT '',
        "kayitTarihi" TIMESTAMP(3),
        "bitisTarihi" TIMESTAMP(3),
        "otoYenile" BOOLEAN NOT NULL DEFAULT true,
        "hataMesaji" TEXT NOT NULL DEFAULT '',
        "iletisim" JSONB,
        "tanitimAdimlari" JSONB NOT NULL DEFAULT '{}',
        "hatirlatmalar" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AlanAdi_pkey" PRIMARY KEY ("id"))`,
    },
    { ad: "SiteSettings.cfZoneId", sql: `ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "cfZoneId" TEXT NOT NULL DEFAULT ''` },
    { ad: "AlanAdiDurum.DNS_BEKLIYOR", sql: `ALTER TYPE "AlanAdiDurum" ADD VALUE IF NOT EXISTS 'DNS_BEKLIYOR'` },
    { ad: "AlanAdi.tldNitelikleri", sql: `ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "tldNitelikleri" JSONB NOT NULL DEFAULT '{}'` },
    { ad: "AlanAdi.harici", sql: `ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "harici" BOOLEAN NOT NULL DEFAULT false` },
    { ad: "AlanAdi.cfCustomHostnameIdleri", sql: `ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "cfCustomHostnameIdleri" TEXT[] DEFAULT ARRAY[]::TEXT[]` },
    { ad: "AlanAdi.dnsKayitlari", sql: `ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "dnsKayitlari" JSONB NOT NULL DEFAULT '[]'` },
    { ad: "AlanAdi.alanAdi (unique)", sql: `CREATE UNIQUE INDEX IF NOT EXISTS "AlanAdi_alanAdi_key" ON "AlanAdi"("alanAdi")` },
    { ad: "AlanAdi.memberId (index)", sql: `CREATE INDEX IF NOT EXISTS "AlanAdi_memberId_idx" ON "AlanAdi"("memberId")` },
    { ad: "AlanAdi.durum (index)", sql: `CREATE INDEX IF NOT EXISTS "AlanAdi_durum_bitisTarihi_idx" ON "AlanAdi"("durum", "bitisTarihi")` },
    {
      ad: "AlanAdi.memberId (fk)",
      sql: `DO $$ BEGIN ALTER TABLE "AlanAdi" ADD CONSTRAINT "AlanAdi_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    },
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
