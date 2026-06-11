import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const sayfalar = await prisma.customPage.findMany({ orderBy: [{ sira: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ ok: true, sayfalar });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { baslik?: string; slug?: string };
  const baslik = String(body.baslik ?? "").trim();
  if (!baslik) return NextResponse.json({ ok: false, error: "Başlık gerekli." }, { status: 400 });

  let slug = body.slug ? slugify(body.slug) : slugify(baslik);
  if (!slug) slug = `sayfa-${Date.now()}`;

  // Slug çakışmasını çöz
  const mevcut = await prisma.customPage.findUnique({ where: { slug } });
  if (mevcut) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  const enBuyuk = await prisma.customPage.aggregate({ _max: { sira: true } });
  const sayfa = await prisma.customPage.create({
    data: { baslik, slug, sira: (enBuyuk._max.sira ?? 0) + 1 },
  });
  return NextResponse.json({ ok: true, sayfa });
}
