import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const TIPLER = ["GALERI", "TEXT", "VIDEO", "LINK", "GORSEL", "FORM", "TEK_GORSEL", "HTML", "SSS", "HERO", "BASVURU"] as const;

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const tanimlar = await prisma.uyeModulTanim.findMany({
    orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, tanimlar });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  if (typeof body.ad !== "string" || !body.ad.trim())
    return NextResponse.json({ ok: false, error: "Modül adı zorunludur." }, { status: 400 });
  const tip = String(body.tip);
  if (!TIPLER.includes(tip as (typeof TIPLER)[number]))
    return NextResponse.json({ ok: false, error: "Geçersiz modül tipi." }, { status: 400 });

  const tanim = await prisma.uyeModulTanim.create({
    data: {
      ad: body.ad.trim(),
      tip: tip as (typeof TIPLER)[number],
      ikon: typeof body.ikon === "string" ? body.ikon.trim() : "",
      ikonAd: typeof body.ikonAd === "string" ? body.ikonAd.trim() : "",
      butonRenk: typeof body.butonRenk === "string" ? body.butonRenk.trim() : "#d4af37",
      ikonRenk: typeof body.ikonRenk === "string" ? body.ikonRenk.trim() : "#000000",
      sira: typeof body.sira === "number" ? body.sira : 0,
      aktif: body.aktif !== false,
    },
  });
  return NextResponse.json({ ok: true, tanim });
}
