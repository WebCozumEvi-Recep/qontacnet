import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [leads, basvurular] = await Promise.all([
    prisma.lead.findMany({
      where: { memberId: session.sub },
      orderBy: { createdAt: "desc" },
    }),
    // Üyenin kartındaki form modüllerinden gelen başvurular da iletişim talebidir
    prisma.formBasvuru.findMany({
      where: { memberId: session.sub },
      orderBy: { createdAt: "desc" },
      select: { id: true, ad: true, email: true, telefon: true, mesaj: true, uyeOkundu: true, createdAt: true },
    }),
  ]);

  const birlesik = [
    ...leads,
    ...basvurular.map(b => ({
      id: b.id,
      ad: b.ad,
      email: b.email,
      telefon: b.telefon,
      sirket: b.mesaj ? b.mesaj.slice(0, 80) : "",
      kaynak: "FORM",
      okundu: b.uyeOkundu,
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ ok: true, leads: birlesik });
}
