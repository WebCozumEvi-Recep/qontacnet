import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  const batches = await prisma.cardBatch.findMany({ orderBy: { uretimTarihi: "desc" } });
  return NextResponse.json({ ok: true, batches });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const { kod, miktar, seriPrefix, uretici, uretimTarihi, durum, tahsisFirma } = body;

  if (typeof kod !== "string" || !kod.trim()) return NextResponse.json({ ok: false, error: "Batch kodu zorunludur." }, { status: 400 });
  if (typeof miktar !== "number" || miktar < 1) return NextResponse.json({ ok: false, error: "Geçerli bir miktar girin." }, { status: 400 });

  const existing = await prisma.cardBatch.findUnique({ where: { kod: kod.trim() } });
  if (existing) return NextResponse.json({ ok: false, error: "Bu batch kodu zaten kullanılıyor." }, { status: 400 });

  const DURUMLAR = ["URETIMDE", "STOKTA", "TAHSIS", "IPTAL"];
  const batch = await prisma.cardBatch.create({
    data: {
      kod: kod.trim(),
      miktar,
      seriPrefix: typeof seriPrefix === "string" ? seriPrefix.trim() : "",
      uretici: typeof uretici === "string" ? uretici.trim() : "",
      uretimTarihi: typeof uretimTarihi === "string" && uretimTarihi ? new Date(uretimTarihi) : new Date(),
      durum: typeof durum === "string" && DURUMLAR.includes(durum) ? (durum as "URETIMDE" | "STOKTA" | "TAHSIS" | "IPTAL") : "URETIMDE",
      tahsisFirma: typeof tahsisFirma === "string" && tahsisFirma ? tahsisFirma : null,
    },
  });

  return NextResponse.json({ ok: true, batch });
}
