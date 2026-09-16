-- Toplu üretim partisi yerine satış yapıldıkça tek tek açılan kartlar.
ALTER TABLE "PhysicalCard" ALTER COLUMN "batchId" DROP NOT NULL;
ALTER TABLE "PhysicalCard" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "PhysicalCard" ADD COLUMN IF NOT EXISTS "notlar" TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS "PhysicalCard_firmaId_idx" ON "PhysicalCard"("firmaId");
CREATE INDEX IF NOT EXISTS "PhysicalCard_orderId_idx" ON "PhysicalCard"("orderId");

-- Eski partili kartlarda firma yalnızca partide duruyorsa karta taşı.
UPDATE "PhysicalCard" pc SET "firmaId" = cb."tahsisFirmaId"
FROM "CardBatch" cb
WHERE pc."batchId" = cb."id" AND pc."firmaId" IS NULL AND cb."tahsisFirmaId" IS NOT NULL;
