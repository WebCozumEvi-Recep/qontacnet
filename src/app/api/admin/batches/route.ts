import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const batches = await prisma.cardBatch.findMany({ orderBy: { uretimTarihi: "desc" } });
  return NextResponse.json({ ok: true, batches });
}
