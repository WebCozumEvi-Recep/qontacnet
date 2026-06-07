import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, type Role } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = (await req.json()) as {
      email?: string;
      password?: string;
      role?: Role;
    };

    if (!email || !password || !role) {
      return NextResponse.json({ ok: false, error: "Eksik bilgi." }, { status: 400 });
    }

    const lower = email.toLowerCase().trim();
    let record: { id: string; email: string; passwordHash: string } | null = null;

    if (role === "uye") {
      record = await prisma.member.findUnique({ where: { email: lower } });
    } else if (role === "firma") {
      record = await prisma.firma.findUnique({ where: { email: lower } });
    } else if (role === "admin") {
      record = await prisma.admin.findUnique({ where: { email: lower } });
    } else {
      return NextResponse.json({ ok: false, error: "Geçersiz rol." }, { status: 400 });
    }

    if (!record || !bcrypt.compareSync(password, record.passwordHash)) {
      return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı." }, { status: 401 });
    }

    await createSession({ sub: record.id, role, email: record.email });
    return NextResponse.json({ ok: true, role });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ ok: false, error: "Giriş yapılamadı." }, { status: 500 });
  }
}
