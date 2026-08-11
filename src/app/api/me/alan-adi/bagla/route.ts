import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { haricAlanAdiCoz } from "@/lib/domain-kurallar";
import { haricAlanAdiBagla, haricAlanAdiKontrol, haricAlanAdiKaldir, BaglamaHatasi } from "@/lib/alan-adi-baglama";
import { CloudflareError } from "@/lib/cloudflare";

export const runtime = "nodejs";

// Üyenin kendi alan adını bağlama uçları:
//   POST   { alanAdi }  → bağlantıyı kurar, girilecek DNS kayıtlarını döner
//   PATCH  { id }       → DNS kayıtları girildi mi diye kontrol eder
//   DELETE ?id=         → bağlantıyı kaldırır

function hataYanit(e: unknown) {
  if (e instanceof BaglamaHatasi) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  if (e instanceof CloudflareError) {
    // Cloudflare mesajı teknik; üyeye sadeleştirilmiş hâlini gösteriyoruz.
    return NextResponse.json({ ok: false, error: "Alan adı bağlanamadı. Lütfen daha sonra tekrar deneyin." }, { status: 502 });
  }
  return NextResponse.json({ ok: false, error: "İşlem tamamlanamadı." }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cozum = haricAlanAdiCoz(String(body.alanAdi ?? ""));
  if ("hata" in cozum) return NextResponse.json({ ok: false, error: cozum.hata }, { status: 400 });

  const member = await prisma.member.findUnique({ where: { id: session.sub }, select: { kartAktif: true } });
  if (!member) return NextResponse.json({ ok: false, error: "Üye bulunamadı." }, { status: 404 });
  if (!member.kartAktif) {
    return NextResponse.json({ ok: false, error: "Adres bağlamak için önce kartınızı aktive etmelisiniz." }, { status: 400 });
  }

  // Kendi alan adımız bağlanamaz — sonsuz yönlendirme olurdu.
  const kok = (process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net").replace(/^https?:\/\//, "").split("/")[0];
  if (cozum.alanAdi === kok || cozum.alanAdi.endsWith(`.${kok}`)) {
    return NextResponse.json({ ok: false, error: "Bu adres bağlanamaz." }, { status: 400 });
  }

  // Üyenin zaten yürürlükte bir adresi varsa ikincisini bağlamıyoruz.
  const varOlan = await prisma.alanAdi.findFirst({
    where: { memberId: session.sub, durum: { notIn: ["SURESI_DOLDU", "IPTAL"] }, NOT: { alanAdi: cozum.alanAdi } },
    select: { alanAdi: true },
  });
  if (varOlan) {
    return NextResponse.json(
      { ok: false, error: `Hesabınızda zaten ${varOlan.alanAdi} adresi var. Önce onu kaldırın.` },
      { status: 409 },
    );
  }

  try {
    const { kayit, dnsKayitlari } = await haricAlanAdiBagla(session.sub, cozum.alanAdi);
    return NextResponse.json({ ok: true, id: kayit.id, alanAdi: kayit.alanAdi, dnsKayitlari });
  } catch (e) {
    return hataYanit(e);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kayit = await prisma.alanAdi.findUnique({ where: { id: String(body.id ?? "") } });
  if (!kayit || kayit.memberId !== session.sub) {
    return NextResponse.json({ ok: false, error: "Kayıt bulunamadı." }, { status: 404 });
  }

  try {
    const sonuc = await haricAlanAdiKontrol(kayit.id);
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (e) {
    return hataYanit(e);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  try {
    await haricAlanAdiKaldir(req.nextUrl.searchParams.get("id") ?? "", session.sub);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return hataYanit(e);
  }
}
