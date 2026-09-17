-- Kart baskı şablonunda zeminin baskıya dahil edilip edilmeyeceği (yüz başına).
ALTER TABLE "KartSablonu" ADD COLUMN IF NOT EXISTS "onZeminBas" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "KartSablonu" ADD COLUMN IF NOT EXISTS "arkaZeminBas" BOOLEAN NOT NULL DEFAULT true;
