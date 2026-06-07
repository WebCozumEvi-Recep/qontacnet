import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const urunler = await prisma.product.findMany({ orderBy: [{ sira: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ ok: true, urunler });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  if (typeof body.ad !== "string" || !body.ad.trim())
    return NextResponse.json({ ok: false, error: "Ürün adı zorunludur." }, { status: 400 });

  const urun = await prisma.product.create({
    data: {
      ad: String(body.ad).trim(),
      aciklama: typeof body.aciklama === "string" ? body.aciklama.trim() : "",
      fiyat: typeof body.fiyat === "number" ? body.fiyat : 0,
      gorsel: typeof body.gorsel === "string" ? body.gorsel.trim() : "",
      aktif: body.aktif !== false,
      tip: typeof body.tip === "string" ? body.tip.trim() : "NFC_KART",
      sira: typeof body.sira === "number" ? body.sira : 0,
    },
  });
  return NextResponse.json({ ok: true, urun });
}
