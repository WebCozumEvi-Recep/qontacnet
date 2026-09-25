import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { uyeOlarakGir } from "@/lib/session";

// Admin, şifre bilmeden üyenin hesabına otomatik giriş yapar. Admin oturumu saklanır;
// üye panelindeki "Admin'e dön" ile geri dönülür.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const uye = await prisma.member.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!uye) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  console.info(`[admin/uye-giris] admin=${session.email} uye=${uye.email}`);
  await uyeOlarakGir(uye);
  return NextResponse.json({ ok: true });
}
