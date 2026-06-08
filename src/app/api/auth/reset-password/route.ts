import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json()) as { token?: string; password?: string };
  if (!token || !password) return NextResponse.json({ ok: false, error: "Eksik bilgi." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ ok: false, error: "Şifre en az 6 karakter olmalı." }, { status: 400 });

  const firma = await prisma.firma.findUnique({ where: { resetToken: token } });
  if (!firma || !firma.resetExpiry || firma.resetExpiry < new Date()) {
    return NextResponse.json({ ok: false, error: "Bağlantı geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  await prisma.firma.update({
    where: { id: firma.id },
    data: { passwordHash: bcrypt.hashSync(password, 10), resetToken: null, resetExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
