import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  return NextResponse.json({
    ok: true,
    settings: settings ?? { id: "site", logoUrl: "", googleSiteVerification: "", headKod: "", bodyKod: "" },
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const data = {
    logoUrl: String(body.logoUrl ?? ""),
    googleSiteVerification: String(body.googleSiteVerification ?? "").trim(),
    headKod: String(body.headKod ?? ""),
    bodyKod: String(body.bodyKod ?? ""),
  };

  const settings = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, settings });
}
