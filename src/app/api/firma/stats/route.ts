import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { firmaId: session.sub },
    select: { id: true, ad: true, soyad: true, unvan: true, aktif: true, goruntulemeSayisi: true, leadSayisi: true },
  });
  const memberIds = members.map(m => m.id);

  const leads = await prisma.lead.findMany({
    where: { memberId: { in: memberIds } },
    select: { kaynak: true, createdAt: true },
  });

  const aktif = members.filter(m => m.aktif).length;
  const toplamGoruntulenme = members.reduce((a, m) => a + m.goruntulemeSayisi, 0);
  const toplamLead = members.reduce((a, m) => a + m.leadSayisi, 0);

  // Son 12 ay lead trendi
  const now = new Date();
  const monthly: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthly.push(leads.filter(l => l.createdAt >= d && l.createdAt < next).length);
  }

  const kaynakDagilim = {
    NFC: leads.filter(l => l.kaynak === "NFC").length,
    QR: leads.filter(l => l.kaynak === "QR").length,
    LINK: leads.filter(l => l.kaynak === "LINK").length,
  };

  const topMembers = [...members]
    .sort((a, b) => b.goruntulemeSayisi - a.goruntulemeSayisi)
    .slice(0, 4);

  return NextResponse.json({
    ok: true,
    stats: { toplamUye: members.length, aktif, toplamGoruntulenme, toplamLead },
    monthly,
    kaynakDagilim,
    topMembers,
  });
}
