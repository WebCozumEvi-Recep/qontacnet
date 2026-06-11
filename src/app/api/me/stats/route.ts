import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const member = await prisma.member.findUnique({
    where: { id: session.sub },
    select: { goruntulemeSayisi: true, kartAktif: true },
  });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });

  const leads = await prisma.lead.findMany({
    where: { memberId: session.sub },
    select: { kaynak: true, createdAt: true },
  });

  const nfc = leads.filter(l => l.kaynak === "NFC").length;
  const qr = leads.filter(l => l.kaynak === "QR").length;
  const link = leads.filter(l => l.kaynak === "LINK").length;

  // Son 7 günün bağlantı sayısı (gün gün)
  const now = new Date();
  const haftalik: { gun: string; sayi: number }[] = [];
  const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  for (let i = 6; i >= 0; i--) {
    const g = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const ertesi = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
    haftalik.push({
      gun: gunAdlari[g.getDay()],
      sayi: leads.filter(l => l.createdAt >= g && l.createdAt < ertesi).length,
    });
  }

  // Bu ay eklenen bağlantı
  const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);
  const buAy = leads.filter(l => l.createdAt >= ayBasi).length;

  return NextResponse.json({
    ok: true,
    stats: {
      goruntulenme: member.goruntulemeSayisi,
      baglanti: leads.length,
      nfc,
      qr,
      link,
      buAy,
      kartAktif: member.kartAktif,
    },
    haftalik,
  });
}
