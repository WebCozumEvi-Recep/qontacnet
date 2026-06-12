import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    // kartRenk ve templateId artık firma tarafından belirlenir, üye değiştiremez
    for (const f of ["showWhatsapp", "showLinkedin", "showInstagram", "showWebsite", "showBio"]) {
      if (typeof body[f] === "boolean") data[f] = body[f];
    }

    // Üyenin yüklediği profil kutusu arkaplan görseli (boş string = kaldır)
    if (typeof body.kartArkaplan === "string") data.kartArkaplan = body.kartArkaplan;

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
