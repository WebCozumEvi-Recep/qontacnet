import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const FIELDS = ["ad", "soyad", "unvan", "departman", "telefon", "whatsapp", "linkedin", "instagram", "website", "biyografi"] as const;

export async function PUT(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, string> = {};
    for (const f of FIELDS) {
      if (typeof body[f] === "string") data[f] = (body[f] as string).trim();
    }

    const updated = await prisma.member.update({
      where: { id: session.sub },
      data,
    });
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return NextResponse.json({ ok: true, member: safe });
  } catch (err) {
    console.error("[me/profile]", err);
    return NextResponse.json({ ok: false, error: "Güncellenemedi." }, { status: 500 });
  }
}
