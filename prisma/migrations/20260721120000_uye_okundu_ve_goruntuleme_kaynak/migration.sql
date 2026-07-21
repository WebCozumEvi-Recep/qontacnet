-- AlterTable
ALTER TABLE "FormBasvuru" ADD COLUMN     "uyeOkundu" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "okundu" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KartGoruntuleme" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kaynak" "LeadKaynak" NOT NULL DEFAULT 'LINK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KartGoruntuleme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KartGoruntuleme_memberId_createdAt_idx" ON "KartGoruntuleme"("memberId", "createdAt");

