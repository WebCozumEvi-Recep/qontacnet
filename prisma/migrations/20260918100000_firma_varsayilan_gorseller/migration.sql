-- Firma üyeleri kendi görselini yükleyene kadar kartta gösterilen varsayılan profil fotoğrafı ve arkaplan.
ALTER TABLE "Firma" ADD COLUMN IF NOT EXISTS "varsayilanAvatar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Firma" ADD COLUMN IF NOT EXISTS "varsayilanArkaplan" TEXT NOT NULL DEFAULT '';
