-- Satıcı (yasal) bilgileri: admin > Ayarlar'dan girilir, sözleşmelere otomatik yerleşir.
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiUnvan" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiAdres" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiTelefon" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiEposta" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiVergiDairesi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiVergiNo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiMersis" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiIadeAdresi" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "saticiTeslimatMasrafi" TEXT NOT NULL DEFAULT 'Satıcıya';

-- Taslak sözleşmelerdeki köşeli parantezli alanları otomatik ifadelere çevir.
-- Yalnız hâlâ değiştirilmemiş işaretler dönüşür; elle yazılan metinlere dokunulmaz.
UPDATE "CustomPage" SET "icerik" =
  replace(replace(replace(replace(replace(replace(replace(replace("icerik",
    '[Şirket unvanı]', '{{SATICI_UNVAN}}'),
    '[Şirket adresi]', '{{SATICI_ADRES}}'),
    '[Telefon]', '{{SATICI_TELEFON}}'),
    '[E-posta]', '{{SATICI_EPOSTA}}'),
    '[Vergi dairesi / numarası]', '{{SATICI_VERGI}}'),
    '[MERSİS numarası]', '{{SATICI_MERSIS}}'),
    '[İade adresi]', '{{SATICI_IADE_ADRESI}}'),
    '[Satıcıya / Alıcıya]', '{{TESLIMAT_MASRAFI}}'),
  "updatedAt" = now()
WHERE "id" IN ('sozlesme-on-bilgilendirme', 'sozlesme-mesafeli-satis', 'sozlesme-uyelik', 'sozlesme-iptal-iade')
  AND "icerik" LIKE '%[%]%';
