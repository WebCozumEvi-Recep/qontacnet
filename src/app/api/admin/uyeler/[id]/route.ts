import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { uyeAlanlariniOku } from "@/lib/admin-uye";

// Üyenin bilgilerini, firmasını, aktifliğini ve (verilirse) şifresini günceller.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const uye = await prisma.member.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!uye) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const okunan = await uyeAlanlariniOku(body, { mevcutId: id });
  if ("hata" in okunan) return NextResponse.json({ ok: false, error: okunan.hata }, { status: 400 });
  const data: Record<string, unknown> = { ...okunan.data };

  if (typeof body.aktif === "boolean") data.aktif = body.aktif;
  if (typeof body.sifre === "string" && body.sifre) {
    if (body.sifre.length < 6) return NextResponse.json({ ok: false, error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
    data.passwordHash = bcrypt.hashSync(body.sifre, 10);
    // Bekleyen "şifreni belirle" bağlantısı artık geçersiz
    data.resetToken = null;
    data.resetExpiry = null;
  }

  const guncel = await prisma.member.update({
    where: { id },
    data,
    select: { id: true, ad: true, soyad: true, email: true, telefon: true, unvan: true, firmaId: true, aktif: true, resetToken: true, firma: { select: { ad: true } } },
  });
  const { resetToken, firma, ...rest } = guncel;
  return NextResponse.json({ ok: true, uye: { ...rest, firmaAd: firma?.ad ?? null, sifreBekliyor: !!resetToken } });
}
