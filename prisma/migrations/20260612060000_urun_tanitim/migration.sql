-- Ürün tanıtımı: tüm firma sitelerinde aynı görünen, admin yönetimli tekil içerik
CREATE TABLE "UrunTanitim" (
    "id" TEXT NOT NULL DEFAULT 'urun-tanitim',
    "ozet" TEXT NOT NULL DEFAULT '',
    "detay" TEXT NOT NULL DEFAULT '',
    "gorseller" JSONB NOT NULL DEFAULT '[]',
    "videolar" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UrunTanitim_pkey" PRIMARY KEY ("id")
);
