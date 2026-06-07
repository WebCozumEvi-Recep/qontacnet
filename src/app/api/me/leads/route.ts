import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where: { memberId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, leads });
}
