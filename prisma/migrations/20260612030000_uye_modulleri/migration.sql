-- Üye modül sistemi: admin kataloğu + üye modül örnekleri
CREATE TYPE "UyeModulTip" AS ENUM ('GALERI', 'TEXT', 'VIDEO');

CREATE TABLE "UyeModulTanim" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "tip" "UyeModulTip" NOT NULL,
    "ikon" TEXT NOT NULL DEFAULT '',
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UyeModulTanim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UyeModulTanim_sira_idx" ON "UyeModulTanim"("sira");

CREATE TABLE "MemberModul" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tanimId" TEXT,
    "tip" "UyeModulTip" NOT NULL,
    "baslik" TEXT NOT NULL DEFAULT '',
    "icerik" JSONB NOT NULL,
    "sira" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemberModul_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberModul_memberId_sira_idx" ON "MemberModul"("memberId", "sira");

ALTER TABLE "MemberModul" ADD CONSTRAINT "MemberModul_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberModul" ADD CONSTRAINT "MemberModul_tanimId_fkey" FOREIGN KEY ("tanimId") REFERENCES "UyeModulTanim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
