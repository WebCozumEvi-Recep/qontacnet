import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({
    ok: true,
    settings: settings ?? {
      id: "site", logoUrl: "", logoText: "QONTAC", googleSiteVerification: "", headKod: "", bodyKod: "",
      iletisimEmail: "info@qontac.net", iletisimTelefon: "+90 (850) 302 40 04", iletisimAdres: "Ümraniye, İstanbul / Türkiye",
      iletisimAciklama: "Geleceğin networking dünyasında yerinizi alın. Dijital, akıllı ve prestijli.",
      sosyalLinkedin: "", sosyalInstagram: "", sosyalX: "", sosyalFacebook: "", sosyalYoutube: "", sosyalWebsite: "",
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const data = {
    logoUrl: String(body.logoUrl ?? ""),
    logoText: String(body.logoText ?? "QONTAC").slice(0, 60),
    googleSiteVerification: String(body.googleSiteVerification ?? "").trim(),
    headKod: String(body.headKod ?? ""),
    bodyKod: String(body.bodyKod ?? ""),
    iletisimEmail: String(body.iletisimEmail ?? "").trim(),
    iletisimTelefon: String(body.iletisimTelefon ?? "").trim(),
    iletisimAdres: String(body.iletisimAdres ?? "").trim(),
    iletisimAciklama: String(body.iletisimAciklama ?? "").slice(0, 300),
    sosyalLinkedin: String(body.sosyalLinkedin ?? "").trim(),
    sosyalInstagram: String(body.sosyalInstagram ?? "").trim(),
    sosyalX: String(body.sosyalX ?? "").trim(),
    sosyalFacebook: String(body.sosyalFacebook ?? "").trim(),
    sosyalYoutube: String(body.sosyalYoutube ?? "").trim(),
    sosyalWebsite: String(body.sosyalWebsite ?? "").trim(),
  };

  const settings = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, settings });
}
