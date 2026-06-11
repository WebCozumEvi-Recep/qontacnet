-- AlterTable
ALTER TABLE "FormBasvuru" ADD COLUMN "durum" TEXT NOT NULL DEFAULT 'yeni';
ALTER TABLE "FormBasvuru" ADD COLUMN "notlar" JSONB NOT NULL DEFAULT '[]';
