import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { firmaId: session.sub },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, ad: true, soyad: true, email: true, unvan: true, departman: true,
      aktif: true, kartRenk: true, goruntulemeSayisi: true, leadSayisi: true,
    },
  });

  const aktif = members.filter(m => m.aktif).length;
  const toplamGoruntulenme = members.reduce((a, m) => a + m.goruntulemeSayisi, 0);
  const toplamLead = members.reduce((a, m) => a + m.leadSayisi, 0);

  return NextResponse.json({
    ok: true,
    members,
    stats: { toplam: members.length, aktif, pasif: members.length - aktif, toplamGoruntulenme, toplamLead },
  });
}
