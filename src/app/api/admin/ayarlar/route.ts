import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { ad?: string; email?: string; yeniSifre?: string; mevcutSifre?: string };

  const admin = await prisma.admin.findUnique({ where: { id: session.sub } });
  if (!admin) return NextResponse.json({ ok: false, error: "Admin bulunamadı." }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (typeof body.ad === "string" && body.ad.trim()) data.ad = body.ad.trim();

  if (typeof body.email === "string" && body.email.trim()) {
    const emailTrim = body.email.trim().toLowerCase();
    if (emailTrim !== admin.email) {
      const exists = await prisma.admin.findUnique({ where: { email: emailTrim } });
      if (exists) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kullanımda." }, { status: 400 });
    }
    data.email = emailTrim;
  }

  if (body.yeniSifre) {
    if (!body.mevcutSifre) return NextResponse.json({ ok: false, error: "Mevcut şifre gerekli." }, { status: 400 });
    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(body.mevcutSifre, admin.passwordHash);
    if (!ok) return NextResponse.json({ ok: false, error: "Mevcut şifre yanlış." }, { status: 400 });
    data.passwordHash = await bcrypt.hash(body.yeniSifre, 10);
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: "Değiştirilecek alan yok." }, { status: 400 });

  const updated = await prisma.admin.update({ where: { id: session.sub }, data });
  const { passwordHash: _pw, ...rest } = updated;
  void _pw;
  return NextResponse.json({ ok: true, admin: rest });
}
