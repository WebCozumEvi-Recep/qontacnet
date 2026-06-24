-- Şifre sıfırlama: Üye (Member) için reset token alanları
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Member_resetToken_key" ON "Member"("resetToken");
