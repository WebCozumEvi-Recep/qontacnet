-- AlterTable: SiteSettings footer iletişim + sosyal medya alanları
ALTER TABLE "SiteSettings" ADD COLUMN "iletisimEmail" TEXT NOT NULL DEFAULT 'info@qontac.net';
ALTER TABLE "SiteSettings" ADD COLUMN "iletisimTelefon" TEXT NOT NULL DEFAULT '+90 (850) 302 40 04';
ALTER TABLE "SiteSettings" ADD COLUMN "iletisimAdres" TEXT NOT NULL DEFAULT 'Ümraniye, İstanbul / Türkiye';
ALTER TABLE "SiteSettings" ADD COLUMN "iletisimAciklama" TEXT NOT NULL DEFAULT 'Geleceğin networking dünyasında yerinizi alın. Dijital, akıllı ve prestijli.';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalLinkedin" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalInstagram" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalX" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalFacebook" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalYoutube" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "sosyalWebsite" TEXT NOT NULL DEFAULT '';

-- CreateTable: CustomPage
CREATE TABLE "CustomPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL DEFAULT '',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug");
CREATE INDEX "CustomPage_aktif_sira_idx" ON "CustomPage"("aktif", "sira");

-- Varsayılan kurumsal sayfalar
INSERT INTO "CustomPage" ("id", "slug", "baslik", "icerik", "aktif", "sira", "createdAt", "updatedAt") VALUES
  ('cp_hakkimizda', 'hakkimizda', 'Hakkımızda', '<p>Bu sayfanın içeriğini admin panelinden düzenleyebilirsiniz.</p>', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cp_kvkk', 'kvkk', 'KVKK', '<p>Bu sayfanın içeriğini admin panelinden düzenleyebilirsiniz.</p>', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cp_gizlilik', 'gizlilik-politikasi', 'Gizlilik Politikası', '<p>Bu sayfanın içeriğini admin panelinden düzenleyebilirsiniz.</p>', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cp_kullanim', 'kullanim-kosullari', 'Kullanım Koşulları', '<p>Bu sayfanın içeriğini admin panelinden düzenleyebilirsiniz.</p>', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
