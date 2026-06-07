-- CreateEnum
CREATE TYPE "Paket" AS ENUM ('BASLANGIC', 'PROFESYONEL', 'KURUMSAL');

-- CreateEnum
CREATE TYPE "FirmaDurum" AS ENUM ('AKTIF', 'DENEME', 'ASKIDA', 'IPTAL');

-- CreateEnum
CREATE TYPE "LeadKaynak" AS ENUM ('NFC', 'QR', 'LINK');

-- CreateEnum
CREATE TYPE "AdminRol" AS ENUM ('SUPER_ADMIN', 'OPERASYON', 'DESTEK');

-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefon" TEXT NOT NULL DEFAULT '',
    "adres" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "sektor" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "temsilci" TEXT NOT NULL DEFAULT '',
    "paket" "Paket" NOT NULL DEFAULT 'BASLANGIC',
    "durum" "FirmaDurum" NOT NULL DEFAULT 'DENEME',
    "paketBaslangic" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paketBitis" TIMESTAMP(3),
    "mrr" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefon" TEXT NOT NULL DEFAULT '',
    "unvan" TEXT NOT NULL DEFAULT '',
    "departman" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "instagram" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "biyografi" TEXT NOT NULL DEFAULT '',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "kartRenk" TEXT NOT NULL DEFAULT '#00d4ff',
    "templateId" TEXT,
    "showWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "showLinkedin" BOOLEAN NOT NULL DEFAULT true,
    "showInstagram" BOOLEAN NOT NULL DEFAULT true,
    "showWebsite" BOOLEAN NOT NULL DEFAULT true,
    "showBio" BOOLEAN NOT NULL DEFAULT true,
    "goruntulemeSayisi" INTEGER NOT NULL DEFAULT 0,
    "leadSayisi" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "AdminRol" NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTemplate" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "renk" TEXT NOT NULL DEFAULT '#00d4ff',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "sirket" TEXT NOT NULL DEFAULT '',
    "kaynak" "LeadKaynak" NOT NULL DEFAULT 'LINK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Firma_email_key" ON "Firma"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTemplate" ADD CONSTRAINT "CardTemplate_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
