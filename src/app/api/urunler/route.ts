import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const urunler = await prisma.product.findMany({
    // Firmaya özel ürünler vitrinde gösterilmez
    where: { aktif: true, firmaId: null },
    orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
    select: { id: true, ad: true, aciklama: true, fiyat: true, gorsel: true, gorseller: true, tip: true, sira: true },
  });
  return NextResponse.json({ ok: true, urunler });
}
