-- Firmaya özel kart baskı şablonları.
CREATE TABLE IF NOT EXISTS "KartSablonu" (
  "id" TEXT NOT NULL,
  "firmaId" TEXT NOT NULL,
  "ad" TEXT NOT NULL,
  "yon" TEXT NOT NULL DEFAULT 'yatay',
  "onGorsel" TEXT NOT NULL DEFAULT '',
  "arkaGorsel" TEXT NOT NULL DEFAULT '',
  "alanlar" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KartSablonu_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "KartSablonu_firmaId_idx" ON "KartSablonu"("firmaId");
