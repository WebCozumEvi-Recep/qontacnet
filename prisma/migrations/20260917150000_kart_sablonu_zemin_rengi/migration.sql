-- Kart baskı şablonunda yüz başına zemin rengi.
ALTER TABLE "KartSablonu" ADD COLUMN IF NOT EXISTS "onRenk" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "KartSablonu" ADD COLUMN IF NOT EXISTS "arkaRenk" TEXT NOT NULL DEFAULT '#ffffff';
