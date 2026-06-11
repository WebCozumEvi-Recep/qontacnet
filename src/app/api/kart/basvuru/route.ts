import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: kart sayfasındaki firma form modülünden gelen başvuru
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const memberId = String(body.memberId || "");
    const modulId = String(body.modulId || "");
    const ad = String(body.ad || "").trim();
    const email = String(body.email || "").trim();
    const telefon = String(body.telefon || "").trim();
    const mesaj = String(body.mesaj || "").trim();

    if (!memberId || !ad || (!email && !telefon)) {
      return NextResponse.json({ ok: false, error: "Ad ve iletişim bilgisi zorunlu." }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { firmaId: true },
    });
    if (!member?.firmaId) {
      return NextResponse.json({ ok: false, error: "Firma bulunamadı." }, { status: 404 });
    }

    await prisma.formBasvuru.create({
      data: {
        firmaId: member.firmaId,
        modulId: modulId || null,
        memberId,
        ad: ad.slice(0, 200),
        email: email.slice(0, 200),
        telefon: telefon.slice(0, 50),
        mesaj: mesaj.slice(0, 2000),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Başvuru gönderilemedi." }, { status: 500 });
  }
}
