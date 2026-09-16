-- Firmaya özel ürün: ana sayfada listelenmez, yalnız o firmanın satış sayfasında satılır.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "firmaId" TEXT;
CREATE INDEX IF NOT EXISTS "Product_firmaId_idx" ON "Product"("firmaId");
