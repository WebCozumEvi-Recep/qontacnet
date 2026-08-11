-- Cloudflare zone kimliği (üyenin kendi alan adını bağlama için).
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "cfZoneId" TEXT NOT NULL DEFAULT '';
