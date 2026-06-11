import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { eski?: string; yeni?: string };
  const eski = String(body.eski ?? "");
  const yeni = String(body.yeni ?? "");

  if (!eski || !yeni) return NextResponse.json({ ok: false, error: "Eski ve yeni şifre gerekli." }, { status: 400 });
  if (yeni.length < 6) return NextResponse.json({ ok: false, error: "Yeni şifre en az 6 karakter olmalı." }, { status: 400 });

  const member = await prisma.member.findUnique({ where: { id: session.sub } });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  if (!bcrypt.compareSync(eski, member.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Mevcut şifre hatalı." }, { status: 400 });
  }

  await prisma.member.update({
    where: { id: session.sub },
    data: { passwordHash: bcrypt.hashSync(yeni, 10) },
  });

  return NextResponse.json({ ok: true });
}
