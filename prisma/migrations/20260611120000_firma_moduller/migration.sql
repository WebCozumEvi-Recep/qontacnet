-- CreateEnum
CREATE TYPE "FirmaModulTip" AS ENUM ('HAKKIMIZDA', 'GALERI', 'VIDEO', 'FORM');

-- CreateTable
CREATE TABLE "FirmaModul" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "tip" "FirmaModulTip" NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "baslik" TEXT NOT NULL DEFAULT '',
    "icerik" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmaModul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormBasvuru" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "modulId" TEXT,
    "memberId" TEXT,
    "ad" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "mesaj" TEXT NOT NULL DEFAULT '',
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormBasvuru_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FirmaModul_firmaId_sira_idx" ON "FirmaModul"("firmaId", "sira");

-- CreateIndex
CREATE INDEX "FormBasvuru_firmaId_createdAt_idx" ON "FormBasvuru"("firmaId", "createdAt");

-- AddForeignKey
ALTER TABLE "FirmaModul" ADD CONSTRAINT "FirmaModul_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormBasvuru" ADD CONSTRAINT "FormBasvuru_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
