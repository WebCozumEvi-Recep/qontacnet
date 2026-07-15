-- Şifre sıfırlama: Firma için reset token alanları
ALTER TABLE "Firma" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "Firma" ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Firma_resetToken_key" ON "Firma"("resetToken");
