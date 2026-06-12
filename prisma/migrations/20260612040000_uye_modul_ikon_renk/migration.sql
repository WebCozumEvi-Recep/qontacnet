-- Üye modül tanımı: galeriden ikon + buton/ikon rengi
ALTER TABLE "UyeModulTanim" ADD COLUMN "ikonAd" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UyeModulTanim" ADD COLUMN "butonRenk" TEXT NOT NULL DEFAULT '#d4af37';
ALTER TABLE "UyeModulTanim" ADD COLUMN "ikonRenk" TEXT NOT NULL DEFAULT '#000000';
