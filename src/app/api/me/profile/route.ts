import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createSession } from "@/lib/session";

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

    if (typeof body.email === "string") {
      const yeniEmail = body.email.trim().toLowerCase();
      if (!yeniEmail || !yeniEmail.includes("@")) {
        return NextResponse.json({ ok: false, error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
      }
      if (yeniEmail !== session.email.toLowerCase()) {
        const baska = await prisma.member.findUnique({ where: { email: yeniEmail }, select: { id: true } });
        if (baska && baska.id !== session.sub) {
          return NextResponse.json({ ok: false, error: "Bu e-posta başka bir üye tarafından kullanılıyor." }, { status: 409 });
        }
        data.email = yeniEmail;
      }
    }

    const updated = await prisma.member.update({
      where: { id: session.sub },
      data,
    });
    // Email değiştiyse session cookie'yi yeni email ile yeniden bas
    if (data.email && data.email !== session.email) {
      await createSession({ sub: session.sub, role: session.role, email: data.email });
    }
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return NextResponse.json({ ok: true, member: safe });
  } catch (err) {
    console.error("[me/profile]", err);
    return NextResponse.json({ ok: false, error: "Güncellenemedi." }, { status: 500 });
  }
}
