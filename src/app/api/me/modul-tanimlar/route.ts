import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Üyenin ekleyebileceği aktif modül tanımları (admin kataloğu)
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const tanimlar = await prisma.uyeModulTanim.findMany({
    where: { aktif: true },
    orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
    select: { id: true, ad: true, tip: true, ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true },
  });
  return NextResponse.json({ ok: true, tanimlar });
}
