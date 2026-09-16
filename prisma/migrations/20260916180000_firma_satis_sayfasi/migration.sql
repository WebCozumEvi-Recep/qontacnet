-- Firma satış sayfası (/f/<id>): firmaya tanımlı ürün, siparişten açılan üye hesabı.
ALTER TABLE "Firma" ADD COLUMN IF NOT EXISTS "urunId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "memberId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "hesapToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_hesapToken_key" ON "Order"("hesapToken");
