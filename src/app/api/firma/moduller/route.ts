import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const TIPLER = ["HAKKIMIZDA", "GALERI", "VIDEO", "FORM"] as const;
type Tip = typeof TIPLER[number];

const VARSAYILAN_ICERIK: Record<Tip, Record<string, unknown>> = {
  HAKKIMIZDA: { metin: "", gorsel: "" },
  GALERI: { gorseller: [] },
  VIDEO: { videoUrl: "", aciklama: "" },
  FORM: { aciklama: "Bilgilerinizi bırakın, sizinle iletişime geçelim.", gonderButon: "Gönder" },
};

const VARSAYILAN_BASLIK: Record<Tip, string> = {
  HAKKIMIZDA: "Hakkımızda",
  GALERI: "Kampanyalar",
  VIDEO: "Kurumsal Video",
  FORM: "Başvuru Formu",
};

export async function GET() {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const moduller = await prisma.firmaModul.findMany({
    where: { firmaId: session.sub },
    orderBy: { sira: "asc" },
  });
  return NextResponse.json({ ok: true, moduller });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { tip?: string };
  const tip = body.tip as Tip;
  if (!TIPLER.includes(tip)) {
    return NextResponse.json({ ok: false, error: "Geçersiz modül tipi." }, { status: 400 });
  }

  // En büyük sıra + 1
  const son = await prisma.firmaModul.findFirst({
    where: { firmaId: session.sub },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });

  const modul = await prisma.firmaModul.create({
    data: {
      firmaId: session.sub,
      tip,
      sira: (son?.sira ?? 0) + 1,
      aktif: true,
      baslik: VARSAYILAN_BASLIK[tip],
      icerik: VARSAYILAN_ICERIK[tip],
    },
  });
  return NextResponse.json({ ok: true, modul });
}
