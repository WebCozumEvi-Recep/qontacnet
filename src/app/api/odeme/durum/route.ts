import { NextResponse } from "next/server";
import { kartBilgisiGerekliMi, odemeAcikMi } from "@/lib/odeme";

export const runtime = "nodejs";

// Public — ödeme formunun kart alanlarını gösterip göstermeyeceğini belirler.
// DijiGate'te kart bilgisi bizim formumuzda alınır; QNB 3DHost'ta banka sayfasında.
// Sağlayıcı adı veya anahtarlar dışarı sızdırılmaz, yalnızca davranış bilgisi döner.
export async function GET() {
  const [acik, kartGerekli] = await Promise.all([odemeAcikMi(), kartBilgisiGerekliMi()]);
  return NextResponse.json({ ok: true, acik, kartGerekli });
}
