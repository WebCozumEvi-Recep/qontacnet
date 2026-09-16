import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Üyenin firmasını ve aktifliğini günceller.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;

  const body = (await req.json()) as Record<string, unknown>;
  const data: { firmaId?: string | null; aktif?: boolean } = {};
  if ("firmaId" in body) {
    data.firmaId = typeof body.firmaId === "string" && body.firmaId ? body.firmaId : null;
    if (data.firmaId && !(await prisma.firma.findUnique({ where: { id: data.firmaId }, select: { id: true } }))) {
      return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
    }
  }
  if (typeof body.aktif === "boolean") data.aktif = body.aktif;

  const uye = await prisma.member.findUnique({ where: { id }, select: { id: true } });
  if (!uye) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const guncel = await prisma.member.update({
    where: { id },
    data,
    select: { id: true, firmaId: true, aktif: true, firma: { select: { ad: true } } },
  });
  return NextResponse.json({ ok: true, uye: { ...guncel, firmaAd: guncel.firma?.ad ?? null } });
}
