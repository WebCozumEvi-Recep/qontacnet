-- Çok dilli destek: otomatik çeviri önbelleği + sözleşme/özel sayfa çevirileri

-- CustomPage: dil başına { baslik, icerik } çeviri kolonu
ALTER TABLE "CustomPage" ADD COLUMN "ceviriler" JSONB NOT NULL DEFAULT '{}';

-- Otomatik çeviri önbelleği
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Translation_locale_hash_key" ON "Translation"("locale", "hash");
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");
