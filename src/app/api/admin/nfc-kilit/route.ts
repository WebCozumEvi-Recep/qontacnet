import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// NFC kart kilit anahtarı — yalnız admin.
// Güvenlik: anahtarın kendisi tarayıcıya GERİ GÖNDERİLMEZ; sadece "kayıtlı mı" bilgisi döner.
// Boş gönderilirse mevcut anahtar korunur.

export async function GET() {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const s = await prisma.siteSettings.findUnique({ where: { id: "site" }, select: { nfcKilitAnahtari: true } });
  return NextResponse.json({ ok: true, settings: { nfcKilitAnahtariSet: Boolean(s?.nfcKilitAnahtari) } });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("admin");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  // Yeni anahtar girildiyse güncelle; boş gelirse mevcut korunur.
  const yeni = String(body.nfcKilitAnahtari ?? "").trim();
  if (yeni) data.nfcKilitAnahtari = yeni;
  // Açıkça temizleme isteği
  if (body.temizle === true) data.nfcKilitAnahtari = "";

  const s = await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, settings: { nfcKilitAnahtariSet: Boolean(s.nfcKilitAnahtari) } });
}
