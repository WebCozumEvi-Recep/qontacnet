-- QNB Finansbank Sanal POS ayarları (admin panelinden yönetilir)
ALTER TABLE "SiteSettings" ADD COLUMN "qnbAktif" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "qnbTest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "qnbMerchantId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbUserCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbMerchantPass" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbMbrId" TEXT NOT NULL DEFAULT '5';
