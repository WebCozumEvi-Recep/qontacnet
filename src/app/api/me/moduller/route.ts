import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Üyenin kendi modülleri
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const moduller = await prisma.memberModul.findMany({
    where: { memberId: session.sub },
    orderBy: [{ sira: "asc" }, { createdAt: "asc" }],
    include: { tanim: { select: { ad: true, ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true } } },
  });
  return NextResponse.json({ ok: true, moduller });
}

// Katalogdan bir tanım seçerek yeni modül ekler
export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  const tanimId = String(body.tanimId ?? "");
  const tanim = await prisma.uyeModulTanim.findFirst({ where: { id: tanimId, aktif: true } });
  if (!tanim) return NextResponse.json({ ok: false, error: "Modül tanımı bulunamadı." }, { status: 400 });

  const son = await prisma.memberModul.findFirst({
    where: { memberId: session.sub },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });

  const modul = await prisma.memberModul.create({
    data: {
      memberId: session.sub,
      tanimId: tanim.id,
      tip: tanim.tip,
      baslik: tanim.ad,
      icerik: {},
      sira: (son?.sira ?? -1) + 1,
      aktif: true,
    },
    include: { tanim: { select: { ad: true, ikon: true, ikonAd: true, butonRenk: true, ikonRenk: true } } },
  });
  return NextResponse.json({ ok: true, modul });
}
