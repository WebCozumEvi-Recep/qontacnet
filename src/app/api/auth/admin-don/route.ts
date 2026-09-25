import { NextResponse } from "next/server";
import { adminOturumunaDon } from "@/lib/session";

// Admin'in üye hesabına geçmeden önceki oturumunu geri yükler.
export async function POST() {
  const ok = await adminOturumunaDon();
  if (!ok) return NextResponse.json({ ok: false, error: "Saklı admin oturumu bulunamadı." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
