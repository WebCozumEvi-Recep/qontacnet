import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { alanAdiKurulumBaslat } from "@/lib/alan-adi-kurulum";

export const runtime = "nodejs";

// Admin: üyelerin alan adları — listeleme, kurulumu yeniden deneme, iptal.
export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const alanAdlari = await prisma.alanAdi.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { member: { select: { id: true, ad: true, soyad: true, email: true } } },
  });

  return NextResponse.json({ ok: true, alanAdlari });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const islem = String(body.islem ?? "");

  const kayit = await prisma.alanAdi.findUnique({ where: { id } });
  if (!kayit) return NextResponse.json({ ok: false, error: "Kayıt bulunamadı." }, { status: 404 });

  if (islem === "yeniden-dene") {
    // Kurulum idempotent — tamamlanmış adımlar atlanır, kalanlardan devam eder.
    after(() => alanAdiKurulumBaslat(id));
    return NextResponse.json({ ok: true, mesaj: "Kurulum yeniden başlatıldı." });
  }

  if (islem === "iptal") {
    await prisma.alanAdi.update({ where: { id }, data: { durum: "IPTAL" } });
    return NextResponse.json({ ok: true, mesaj: "Kayıt iptal edildi." });
  }

  return NextResponse.json({ ok: false, error: "Bilinmeyen işlem." }, { status: 400 });
}
