-- Üyenin kendi alan adını bağlaması (Cloudflare for SaaS custom hostname).
ALTER TYPE "AlanAdiDurum" ADD VALUE IF NOT EXISTS 'DNS_BEKLIYOR';

ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "harici" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "cfCustomHostnameIdleri" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AlanAdi" ADD COLUMN IF NOT EXISTS "dnsKayitlari" JSONB NOT NULL DEFAULT '[]';
