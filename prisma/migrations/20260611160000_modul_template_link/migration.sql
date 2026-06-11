-- 1) templateId kolonunu ekle (önce nullable)
ALTER TABLE "FirmaModul" ADD COLUMN "templateId" TEXT;

-- 2) Mevcut modülleri firmaya ait aktif şablona (yoksa ilk şablona) bağla
UPDATE "FirmaModul" m
SET "templateId" = (
  SELECT t.id FROM "CardTemplate" t
  WHERE t."firmaId" = m."firmaId"
  ORDER BY t.aktif DESC, t."createdAt" ASC
  LIMIT 1
);

-- 3) Eşleşmeyenleri (firmaya hiç şablon yoksa) sil
DELETE FROM "FirmaModul" WHERE "templateId" IS NULL;

-- 4) NOT NULL yap
ALTER TABLE "FirmaModul" ALTER COLUMN "templateId" SET NOT NULL;

-- 5) Index ve FK
DROP INDEX IF EXISTS "FirmaModul_firmaId_sira_idx";
CREATE INDEX "FirmaModul_templateId_sira_idx" ON "FirmaModul"("templateId", "sira");
ALTER TABLE "FirmaModul" ADD CONSTRAINT "FirmaModul_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "CardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
