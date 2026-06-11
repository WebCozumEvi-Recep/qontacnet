import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// body: { ids: string[] } — yeni sıraya göre id dizisi
export async function POST(req: NextRequest) {
  const session = await requireRole("firma");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as { ids?: unknown };
  if (!Array.isArray(body.ids) || body.ids.some(x => typeof x !== "string")) {
    return NextResponse.json({ ok: false, error: "ids dizisi gerekli." }, { status: 400 });
  }
  const ids = body.ids as string[];

  // Yalnızca bu firmaya ait modülleri güncelle
  const oncekiler = await prisma.firmaModul.findMany({
    where: { id: { in: ids }, firmaId: session.sub },
    select: { id: true },
  });
  const geçerli = new Set(oncekiler.map(m => m.id));

  await prisma.$transaction(
    ids
      .filter(id => geçerli.has(id))
      .map((id, idx) => prisma.firmaModul.update({ where: { id }, data: { sira: idx + 1 } })),
  );

  return NextResponse.json({ ok: true });
}
