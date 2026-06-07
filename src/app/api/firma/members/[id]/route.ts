import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { id, firmaId: session.sub },
    include: { leads: { orderBy: { createdAt: "desc" } } },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const { passwordHash, ...safe } = member;
  void passwordHash;
  return NextResponse.json({ ok: true, member: safe });
}

const EDITABLE = ["ad", "soyad", "unvan", "departman", "telefon"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const owned = await prisma.member.findFirst({ where: { id, firmaId: session.sub } });
  if (!owned) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const f of EDITABLE) if (typeof body[f] === "string") data[f] = (body[f] as string).trim();
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;

  // şifre sıfırlama
  let geciciSifre: string | undefined;
  if (body.resetPassword === true) {
    geciciSifre = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
    data.passwordHash = bcrypt.hashSync(geciciSifre, 10);
  }

  const updated = await prisma.member.update({ where: { id }, data });
  const { passwordHash, ...safe } = updated;
  void passwordHash;
  return NextResponse.json({ ok: true, member: safe, geciciSifre });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const owned = await prisma.member.findFirst({ where: { id, firmaId: session.sub } });
  if (!owned) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
