-- NFC kart kilit anahtarı (gizli). Kartların PWD/PACK parolası bu anahtardan türetilir.
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "nfcKilitAnahtari" TEXT NOT NULL DEFAULT '';
