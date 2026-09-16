-- Firmalar satışta aracıdır; lisans/paket ve deneme süresi kavramı kaldırıldı.
-- Paket/MRR kolonları şemada kalır ama kullanılmaz. Denemedeki firmalar aktif olur.
UPDATE "Firma" SET "durum" = 'AKTIF' WHERE "durum" = 'DENEME';
