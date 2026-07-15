-- AlterTable
ALTER TABLE "CardBatch" ADD COLUMN     "tahsisFirmaId" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "kartAktif" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "firmaId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PhysicalCard" (
    "id" TEXT NOT NULL,
    "seriNo" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "firmaId" TEXT,
    "memberId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "aktivasyonAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCard_seriNo_key" ON "PhysicalCard"("seriNo");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCard_token_key" ON "PhysicalCard"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCard_memberId_key" ON "PhysicalCard"("memberId");

-- AddForeignKey
ALTER TABLE "PhysicalCard" ADD CONSTRAINT "PhysicalCard_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CardBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalCard" ADD CONSTRAINT "PhysicalCard_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
