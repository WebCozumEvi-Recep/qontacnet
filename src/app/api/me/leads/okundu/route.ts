import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Bir iletişim talebini okundu/okunmadı işaretler.
// id önce Lead'de aranır; bulunamazsa kart form başvurusunda (uyeOkundu) denenir.
export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    const body = (await req.json()) as { id?: string; okundu?: boolean };
    const id = String(body.id ?? "");
    const okundu = Boolean(body.okundu);
    if (!id) return NextResponse.json({ ok: false, error: "id zorunlu." }, { status: 400 });

    const lead = await prisma.lead.updateMany({
      where: { id, memberId: session.sub },
      data: { okundu },
    });
    if (lead.count === 0) {
      const form = await prisma.formBasvuru.updateMany({
        where: { id, memberId: session.sub },
        data: { uyeOkundu: okundu },
      });
      if (form.count === 0) {
        return NextResponse.json({ ok: false, error: "Talep bulunamadı." }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Güncellenemedi." }, { status: 500 });
  }
}
