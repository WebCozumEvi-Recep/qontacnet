import { NextResponse } from "next/server";
import { aktifSozlesmeler } from "@/lib/sozlesme-durum";

export const dynamic = "force-dynamic";

// Public: satın alma formunda hangi sözleşmelerin gösterileceği (yalnız aktif olanlar).
export async function GET() {
  return NextResponse.json({ ok: true, sozlesmeler: await aktifSozlesmeler() });
}
