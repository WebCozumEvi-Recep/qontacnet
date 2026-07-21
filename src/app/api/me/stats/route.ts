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

  const now = new Date();
  const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);

  const [leads, basvurular, goruntulemeler] = await Promise.all([
    prisma.lead.findMany({
      where: { memberId: session.sub },
      select: { kaynak: true, okundu: true, createdAt: true },
    }),
    prisma.formBasvuru.findMany({
      where: { memberId: session.sub },
      select: { uyeOkundu: true, createdAt: true },
    }),
    // Kaynak bazlı trafik olayları — bu ay
    prisma.kartGoruntuleme.findMany({
      where: { memberId: session.sub, createdAt: { gte: ayBasi } },
      select: { kaynak: true, createdAt: true },
    }),
  ]);

  // Talepler: lead + kart form başvuruları birlikte
  const talepler = [
    ...leads.map(l => ({ kaynak: l.kaynak as string, okundu: l.okundu, createdAt: l.createdAt })),
    ...basvurular.map(b => ({ kaynak: "FORM", okundu: b.uyeOkundu, createdAt: b.createdAt })),
  ];

  const say = (k: string) => talepler.filter(t => t.kaynak === k).length;
  const okunmamis = talepler.filter(t => !t.okundu).length;

  // Son 7 günün talep sayısı (gün gün)
  const haftalik: { gun: string; sayi: number }[] = [];
  const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  for (let i = 6; i >= 0; i--) {
    const g = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const ertesi = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
    haftalik.push({
      gun: gunAdlari[g.getDay()],
      sayi: talepler.filter(t => t.createdAt >= g && t.createdAt < ertesi).length,
    });
  }

  // Bu ayın günlük trafiği — NFC / QR / Link ayrımıyla
  const aylikTrafik: { gun: number; nfc: number; qr: number; link: number }[] = [];
  for (let d = 1; d <= now.getDate(); d++) {
    const g = new Date(now.getFullYear(), now.getMonth(), d);
    const ertesi = new Date(now.getFullYear(), now.getMonth(), d + 1);
    const gunluk = goruntulemeler.filter(v => v.createdAt >= g && v.createdAt < ertesi);
    aylikTrafik.push({
      gun: d,
      nfc: gunluk.filter(v => v.kaynak === "NFC").length,
      qr: gunluk.filter(v => v.kaynak === "QR").length,
      link: gunluk.filter(v => v.kaynak === "LINK").length,
    });
  }

  const buAy = talepler.filter(t => t.createdAt >= ayBasi).length;

  return NextResponse.json({
    ok: true,
    stats: {
      goruntulenme: member.goruntulemeSayisi,
      // Bu ay kaynak bazlı trafik
      views: {
        nfc: goruntulemeler.filter(v => v.kaynak === "NFC").length,
        qr: goruntulemeler.filter(v => v.kaynak === "QR").length,
        link: goruntulemeler.filter(v => v.kaynak === "LINK").length,
      },
      baglanti: talepler.length,
      nfc: say("NFC"),
      qr: say("QR"),
      link: say("LINK"),
      form: say("FORM"),
      okunmamis,
      buAy,
      kartAktif: member.kartAktif,
    },
    haftalik,
    aylikTrafik,
  });
}
