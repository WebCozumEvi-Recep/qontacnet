-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "kaynak" TEXT NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "musteriAd" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "telefon" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "adres" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "googleSiteVerification" TEXT NOT NULL DEFAULT '',
    "headKod" TEXT NOT NULL DEFAULT '',
    "bodyKod" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
