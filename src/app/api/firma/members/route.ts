import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function tempPassword() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const { ad, soyad, email, unvan, departman, telefon } = (await req.json()) as Record<string, string>;
    if (!ad || !email) return NextResponse.json({ ok: false, error: "Ad ve e-posta zorunlu." }, { status: 400 });

    const lower = email.toLowerCase().trim();
    const exists = await prisma.member.findUnique({ where: { email: lower } });
    if (exists) return NextResponse.json({ ok: false, error: "Bu e-posta zaten kayıtlı." }, { status: 409 });

    const gecici = tempPassword();
    const member = await prisma.member.create({
      data: {
        firmaId: session.sub,
        ad, soyad: soyad || "", email: lower,
        unvan: unvan || "", departman: departman || "", telefon: telefon || "",
        passwordHash: bcrypt.hashSync(gecici, 10),
        aktif: true,
      },
    });
    return NextResponse.json({ ok: true, memberId: member.id, geciciSifre: gecici });
  } catch (err) {
    console.error("[firma/members POST]", err);
    return NextResponse.json({ ok: false, error: "Üye eklenemedi." }, { status: 500 });
  }
}

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
