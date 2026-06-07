import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const firmalar = await prisma.firma.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { members: true } } },
  });

  const list = await Promise.all(
    firmalar.map(async (f) => {
      const aktifKart = await prisma.member.count({ where: { firmaId: f.id, aktif: true } });
      const { passwordHash, _count, ...rest } = f;
      void passwordHash;
      return { ...rest, uyeSayisi: _count.members, aktifKart };
    })
  );

  return NextResponse.json({ ok: true, firmalar: list });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  if (typeof body.ad !== "string" || !body.ad.trim())
    return NextResponse.json({ ok: false, error: "Firma adı zorunludur." }, { status: 400 });
  if (typeof body.email !== "string" || !body.email.trim())
    return NextResponse.json({ ok: false, error: "E-posta zorunludur." }, { status: 400 });
  if (typeof body.passwordHash !== "string" || !body.passwordHash.trim())
    return NextResponse.json({ ok: false, error: "Şifre zorunludur." }, { status: 400 });

  const existing = await prisma.firma.findUnique({ where: { email: String(body.email).trim() } });
  if (existing) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı." }, { status: 400 });

  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(String(body.passwordHash), 10);

  const firma = await prisma.firma.create({
    data: {
      ad: String(body.ad).trim(),
      email: String(body.email).trim(),
      passwordHash: hash,
      telefon: typeof body.telefon === "string" ? body.telefon.trim() : "",
      adres: typeof body.adres === "string" ? body.adres.trim() : "",
      website: typeof body.website === "string" ? body.website.trim() : "",
      sektor: typeof body.sektor === "string" ? body.sektor.trim() : "",
      temsilci: typeof body.temsilci === "string" ? body.temsilci.trim() : "",
      paket: (["BASLANGIC", "PROFESYONEL", "KURUMSAL"].includes(String(body.paket)) ? body.paket : "BASLANGIC") as "BASLANGIC" | "PROFESYONEL" | "KURUMSAL",
      durum: (["AKTIF", "DENEME", "ASKIDA", "IPTAL"].includes(String(body.durum)) ? body.durum : "DENEME") as "AKTIF" | "DENEME" | "ASKIDA" | "IPTAL",
    },
  });

  const { passwordHash: _pw, ...rest } = firma;
  void _pw;
  return NextResponse.json({ ok: true, firma: { ...rest, uyeSayisi: 0, aktifKart: 0 } });
}
