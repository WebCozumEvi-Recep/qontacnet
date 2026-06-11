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

async function templateMine(templateId: string, firmaId: string) {
  const t = await prisma.cardTemplate.findUnique({ where: { id: templateId } });
  return t && t.firmaId === firmaId ? t : null;
}

export async function GET(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("templateId") ?? "";
  if (!templateId) return NextResponse.json({ ok: false, error: "templateId gerekli." }, { status: 400 });

  if (!(await templateMine(templateId, session.sub))) {
    return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });
  }

  const moduller = await prisma.firmaModul.findMany({
    where: { templateId },
    orderBy: { sira: "asc" },
  });
  return NextResponse.json({ ok: true, moduller });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { tip?: string; templateId?: string };
  const tip = body.tip as Tip;
  const templateId = String(body.templateId ?? "");
  if (!TIPLER.includes(tip)) return NextResponse.json({ ok: false, error: "Geçersiz modül tipi." }, { status: 400 });
  if (!templateId) return NextResponse.json({ ok: false, error: "templateId gerekli." }, { status: 400 });
  if (!(await templateMine(templateId, session.sub))) {
    return NextResponse.json({ ok: false, error: "Şablon bulunamadı." }, { status: 404 });
  }

  const son = await prisma.firmaModul.findFirst({
    where: { templateId },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });

  const modul = await prisma.firmaModul.create({
    data: {
      firmaId: session.sub,
      templateId,
      tip,
      sira: (son?.sira ?? 0) + 1,
      aktif: true,
      baslik: VARSAYILAN_BASLIK[tip],
      icerik: VARSAYILAN_ICERIK[tip] as object,
    },
  });
  return NextResponse.json({ ok: true, modul });
}
