import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tüm firmaların gördüğü ortak ürün tanıtım içeriği (salt-okunur)
export async function GET() {
  const tanitim = await prisma.urunTanitim.findUnique({ where: { id: "urun-tanitim" } });
  return NextResponse.json({
    ok: true,
    tanitim: tanitim ?? { ozet: "", detay: "", gorseller: [], videolar: [] },
  });
}
