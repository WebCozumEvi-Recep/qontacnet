import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token, password, role } = (await req.json()) as { token?: string; password?: string; role?: "firma" | "uye" };
  if (!token || !password) return NextResponse.json({ ok: false, error: "Eksik bilgi." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ ok: false, error: "Şifre en az 6 karakter olmalı." }, { status: 400 });

  const passwordHash = bcrypt.hashSync(password, 10);

  if (role === "uye") {
    const member = await prisma.member.findUnique({ where: { resetToken: token } });
    if (!member || !member.resetExpiry || member.resetExpiry < new Date()) {
      return NextResponse.json({ ok: false, error: "Bağlantı geçersiz veya süresi dolmuş." }, { status: 400 });
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash, resetToken: null, resetExpiry: null },
    });
    return NextResponse.json({ ok: true });
  }

  const firma = await prisma.firma.findUnique({ where: { resetToken: token } });
  if (!firma || !firma.resetExpiry || firma.resetExpiry < new Date()) {
    return NextResponse.json({ ok: false, error: "Bağlantı geçersiz veya süresi dolmuş." }, { status: 400 });
  }
  await prisma.firma.update({
    where: { id: firma.id },
    data: { passwordHash, resetToken: null, resetExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
