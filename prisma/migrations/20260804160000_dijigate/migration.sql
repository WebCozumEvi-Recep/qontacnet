-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "odemeSaglayici" TEXT NOT NULL DEFAULT 'DIJIGATE',
ADD COLUMN     "dijigateAktif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dijigateTest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dijigateApiKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dijigateSecretKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "odemeSaglayici" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "odemeId" TEXT NOT NULL DEFAULT '';

-- Mevcut kurulumda QNB ile ödeme alınıyorsa sağlayıcıyı QNB'de bırak.
-- Kolon varsayılanı yeni kurulumlar için DIJIGATE'tir; ancak DijiGate anahtarları
-- girilmeden sağlayıcıyı değiştirmek çalışan ödemeleri durdururdu. Geçiş, anahtarlar
-- tanımlandıktan sonra admin panelinden yapılır.
UPDATE "SiteSettings" SET "odemeSaglayici" = 'QNB' WHERE "qnbAktif" = true;
