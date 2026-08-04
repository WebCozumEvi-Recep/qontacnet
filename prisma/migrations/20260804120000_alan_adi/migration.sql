-- CreateEnum
CREATE TYPE "AlanAdiDurum" AS ENUM ('ODEME_BEKLIYOR', 'KAYIT_EDILIYOR', 'YAYILIYOR', 'AKTIF', 'HATA', 'SURESI_DOLDU', 'IPTAL');

-- AlterEnum
ALTER TYPE "LeadKaynak" ADD VALUE 'DOMAIN';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "domainAktif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "domainApiKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "domainKarMarji" INTEGER NOT NULL DEFAULT 35,
ADD COLUMN     "domainMinKar" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "domainResellerId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "domainTest" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AlanAdi" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlanAdi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlanAdi_alanAdi_key" ON "AlanAdi"("alanAdi");

-- CreateIndex
CREATE INDEX "AlanAdi_memberId_idx" ON "AlanAdi"("memberId");

-- CreateIndex
CREATE INDEX "AlanAdi_durum_bitisTarihi_idx" ON "AlanAdi"("durum", "bitisTarihi");

-- AddForeignKey
ALTER TABLE "AlanAdi" ADD CONSTRAINT "AlanAdi_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
