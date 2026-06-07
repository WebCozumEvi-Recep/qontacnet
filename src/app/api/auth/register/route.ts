import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

interface Payload {
  ad?: string;
  soyad?: string;
  email?: string;
  password?: string;
  role?: "uye" | "firma";
  firmaAdi?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { ad, soyad, email, password, role, firmaAdi } = (await req.json()) as Payload;

    if (!ad || !email || !password || !role) {
      return NextResponse.json({ ok: false, error: "Zorunlu alanlar eksik." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
    }

    const lower = email.toLowerCase().trim();
    const passwordHash = bcrypt.hashSync(password, 10);

    if (role === "firma") {
      const exists = await prisma.firma.findUnique({ where: { email: lower } });
      if (exists) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı." }, { status: 409 });

      const firma = await prisma.firma.create({
        data: { ad: firmaAdi || ad, email: lower, passwordHash, temsilci: ad, durum: "DENEME", paket: "BASLANGIC" },
      });
      await createSession({ sub: firma.id, role: "firma", email: firma.email });
      return NextResponse.json({ ok: true, role: "firma" });
    }

    // role === "uye": kayıt için bir firmaya bağlanması gerekir.
    // Demo amaçlı: ilk firmaya bağla (gerçek akışta davet/kod ile olur).
    const exists = await prisma.member.findUnique({ where: { email: lower } });
    if (exists) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı." }, { status: 409 });

    const firma = await prisma.firma.findFirst({ orderBy: { createdAt: "asc" } });
    if (!firma) {
      return NextResponse.json({ ok: false, error: "Henüz kayıtlı firma yok. Önce firma başvurusu gerekir." }, { status: 400 });
    }

    const member = await prisma.member.create({
      data: { firmaId: firma.id, ad, soyad: soyad || "", email: lower, passwordHash },
    });
    await createSession({ sub: member.id, role: "uye", email: member.email });
    return NextResponse.json({ ok: true, role: "uye" });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ ok: false, error: "Kayıt yapılamadı." }, { status: 500 });
  }
}
