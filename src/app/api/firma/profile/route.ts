import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const firma = await prisma.firma.findUnique({
    where: { id: session.sub },
    select: { id: true, ad: true, email: true, telefon: true, adres: true, website: true, sektor: true, logo: true, paket: true, durum: true },
  });
  if (!firma) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true, firma });
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, string>;
  const data: Record<string, string> = {};

  if (typeof body.ad === "string" && body.ad.trim()) data.ad = body.ad.trim();
  if (typeof body.telefon === "string") data.telefon = body.telefon.trim();
  if (typeof body.adres === "string") data.adres = body.adres.trim();
  if (typeof body.website === "string") data.website = body.website.trim();
  if (typeof body.sektor === "string") data.sektor = body.sektor.trim();

  // Şifre değiştirme
  if (body.mevcutSifre && body.yeniSifre) {
    const firma = await prisma.firma.findUnique({ where: { id: session.sub } });
    if (!firma) return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
    if (!bcrypt.compareSync(body.mevcutSifre, firma.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Mevcut şifre hatalı." }, { status: 400 });
    }
    if (body.yeniSifre.length < 6) {
      return NextResponse.json({ ok: false, error: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });
    }
    (data as Record<string, string>).passwordHash = bcrypt.hashSync(body.yeniSifre, 10);
  }

  const firma = await prisma.firma.update({
    where: { id: session.sub },
    data,
    select: { id: true, ad: true, email: true, telefon: true, adres: true, website: true, sektor: true, logo: true, paket: true, durum: true },
  });

  return NextResponse.json({ ok: true, firma });
}
