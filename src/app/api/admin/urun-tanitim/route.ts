import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const ID = "urun-tanitim";

type Medya = { url: string; baslik?: string; ad?: string };
function normalizeMedya(v: unknown): Medya[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map(x => ({
      url: typeof x.url === "string" ? x.url.trim() : "",
      baslik: typeof x.baslik === "string" ? x.baslik.trim() : "",
      ad: typeof x.ad === "string" ? x.ad.trim() : "",
    }))
    .filter(m => m.url)
    .slice(0, 50);
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const tanitim = await prisma.urunTanitim.upsert({
    where: { id: ID },
    update: {},
    create: { id: ID },
  });
  return NextResponse.json({ ok: true, tanitim });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  const data = {
    ozet: typeof body.ozet === "string" ? body.ozet : "",
    detay: typeof body.detay === "string" ? body.detay : "",
    gorseller: normalizeMedya(body.gorseller),
    videolar: normalizeMedya(body.videolar),
  };
  const tanitim = await prisma.urunTanitim.upsert({
    where: { id: ID },
    update: data,
    create: { id: ID, ...data },
  });
  return NextResponse.json({ ok: true, tanitim });
}
