-- CreateEnum
CREATE TYPE "SiparisDurum" AS ENUM ('HAZIRLANIYOR', 'URETIMDE', 'KARGODA', 'TESLIM', 'IPTAL');

-- CreateEnum
CREATE TYPE "BatchDurum" AS ENUM ('URETIMDE', 'STOKTA', 'TAHSIS', 'BITTI');

-- CreateEnum
CREATE TYPE "BasvuruDurum" AS ENUM ('YENI', 'ILETISIMDE', 'DONUSUM', 'KAYIP');

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "ad" "Paket" NOT NULL,
    "aylikFiyat" INTEGER NOT NULL,
    "yillikFiyat" INTEGER NOT NULL,
    "maxUye" INTEGER NOT NULL,
    "maxTemplate" INTEGER NOT NULL,
    "ozellikler" TEXT[],
    "renk" TEXT NOT NULL DEFAULT '#00d4ff',

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardBatch" (
    "id" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "miktar" INTEGER NOT NULL,
    "uretici" TEXT NOT NULL DEFAULT '',
    "uretimTarihi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durum" "BatchDurum" NOT NULL DEFAULT 'URETIMDE',
    "tahsisFirma" TEXT,
    "seriPrefix" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "siparisNo" TEXT NOT NULL,
    "firma" TEXT NOT NULL,
    "firmaId" TEXT,
    "urun" TEXT NOT NULL,
    "adet" INTEGER NOT NULL,
    "tutar" INTEGER NOT NULL,
    "durum" "SiparisDurum" NOT NULL DEFAULT 'HAZIRLANIYOR',
    "kargoNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "firmaAdi" TEXT NOT NULL,
    "yetkili" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "uyeSayisi" TEXT NOT NULL DEFAULT '',
    "mesaj" TEXT NOT NULL DEFAULT '',
    "durum" "BasvuruDurum" NOT NULL DEFAULT 'YENI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "sira" INTEGER NOT NULL,
    "ay" TEXT NOT NULL,
    "yil" INTEGER NOT NULL DEFAULT 2026,
    "mrr" INTEGER NOT NULL,
    "yeniFirma" INTEGER NOT NULL DEFAULT 0,
    "iptal" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "License_ad_key" ON "License"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "CardBatch_kod_key" ON "CardBatch"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "Order_siparisNo_key" ON "Order"("siparisNo");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSnapshot_sira_key" ON "RevenueSnapshot"("sira");
