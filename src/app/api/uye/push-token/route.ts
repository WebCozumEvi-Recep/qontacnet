import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Mobil uygulama (WebView içinden, oturum çerezi ile) Expo push token'ını kaydeder.
export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const { token, platform } = (await req.json().catch(() => ({}))) as { token?: string; platform?: string };
  if (!token || typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
    return NextResponse.json({ ok: false, error: "Geçersiz token." }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    update: { memberId: session.sub, platform: platform ?? "" },
    create: { token, memberId: session.sub, platform: platform ?? "" },
  });

  return NextResponse.json({ ok: true });
}
