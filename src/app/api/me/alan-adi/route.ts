import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

// Üyenin alan adları + bölümün açık olup olmadığı.
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const [member, ayarlar, alanAdlari, domainZiyaret] = await Promise.all([
    prisma.member.findUnique({ where: { id: session.sub }, select: { kartAktif: true, ad: true, soyad: true, unvan: true, email: true, telefon: true } }),
    prisma.siteSettings.findUnique({ where: { id: "site" }, select: { domainAktif: true } }),
    prisma.alanAdi.findMany({
      where: { memberId: session.sub, durum: { not: "IPTAL" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, alanAdi: true, tld: true, durum: true, yil: true, satisTutar: true,
        kayitTarihi: true, bitisTarihi: true, otoYenile: true, hataMesaji: true,
        cfNameServers: true, tanitimAdimlari: true, createdAt: true,
      },
    }),
    prisma.kartGoruntuleme.count({ where: { memberId: session.sub, kaynak: "DOMAIN" } }),
  ]);

  return NextResponse.json({
    ok: true,
    satisAcik: Boolean(ayarlar?.domainAktif),
    // Kalan gün sunucuda hesaplanır — istemcide render sırasında Date.now() çağrılmasın.
    kalanGun: alanAdlari.map(a => ({
      id: a.id,
      gun: a.bitisTarihi ? Math.ceil((a.bitisTarihi.getTime() - Date.now()) / 864e5) : null,
    })),
    kartAktif: Boolean(member?.kartAktif),
    profil: {
      ad: member?.ad ?? "", soyad: member?.soyad ?? "", unvan: member?.unvan ?? "",
      email: member?.email ?? "", telefon: member?.telefon ?? "",
    },
    domainZiyaret,
    alanAdlari,
  });
}

// Tanıtım kontrol listesi maddelerini işaretler/kaldırır.
export async function PATCH(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "");
  const adim = String(body.adim ?? "");
  const isaretli = Boolean(body.isaretli);
  if (!id || !adim) return NextResponse.json({ ok: false, error: "Eksik bilgi." }, { status: 400 });

  const kayit = await prisma.alanAdi.findFirst({ where: { id, memberId: session.sub } });
  if (!kayit) return NextResponse.json({ ok: false, error: "Alan adı bulunamadı." }, { status: 404 });

  const mevcut = (kayit.tanitimAdimlari ?? {}) as Record<string, boolean>;
  const guncel = { ...mevcut, [adim]: isaretli };

  await prisma.alanAdi.update({ where: { id }, data: { tanitimAdimlari: guncel } });
  return NextResponse.json({ ok: true, tanitimAdimlari: guncel });
}
