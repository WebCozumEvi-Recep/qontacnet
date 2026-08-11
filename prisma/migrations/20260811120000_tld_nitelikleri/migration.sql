-- Uzantıya özel zorunlu kayıt alanları (.com.tr belge bilgileri gibi).
ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "tldNitelikleri" JSONB NOT NULL DEFAULT '{}';
