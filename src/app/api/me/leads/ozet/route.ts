import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Sidebar rozeti için hafif uç: okunmamış iletişim talebi sayısı
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [lead, form] = await Promise.all([
    prisma.lead.count({ where: { memberId: session.sub, okundu: false } }),
    prisma.formBasvuru.count({ where: { memberId: session.sub, uyeOkundu: false } }),
  ]);
  return NextResponse.json({ ok: true, okunmamis: lead + form });
}
