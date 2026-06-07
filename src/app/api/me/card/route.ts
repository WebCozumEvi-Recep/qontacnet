import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (typeof body.kartRenk === "string") data.kartRenk = body.kartRenk;
    if (typeof body.templateId === "string") data.templateId = body.templateId;
    for (const f of ["showWhatsapp", "showLinkedin", "showInstagram", "showWebsite", "showBio"]) {
      if (typeof body[f] === "boolean") data[f] = body[f];
    }

    const updated = await prisma.member.update({
      where: { id: session.sub },
      data,
    });
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return NextResponse.json({ ok: true, member: safe });
  } catch (err) {
    console.error("[me/card]", err);
    return NextResponse.json({ ok: false, error: "Güncellenemedi." }, { status: 500 });
  }
}
