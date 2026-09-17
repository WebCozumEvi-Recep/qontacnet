-- Satılan kartın baskısının yapıldığı an (elle işaretlenir).
ALTER TABLE "PhysicalCard" ADD COLUMN IF NOT EXISTS "basildiAt" TIMESTAMP(3);
