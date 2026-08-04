import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kartHedefUrl } from "@/lib/alan-adi-kurulum";

export const runtime = "nodejs";

// Üyenin kişisel alan adı için uygulama içi yedek yönlendirme.
// Normalde Cloudflare'deki 301 kuralı devreye girer; kural uygulanmazsa istek
// src/proxy.ts tarafından buraya yönlendirilir ve aynı 301 burada üretilir.
export async function GET(req: NextRequest) {
  // Host, proxy'nin eklediği başlıktan okunur: rewrite sonrası `nextUrl.searchParams`
  // özgün isteğin sorgu dizesini yansıttığı için oradan gelen ?host= güvenilmez.
  // Sorgu parametresi yalnızca doğrudan çağrı/test için yedek olarak durur.
  const ham = req.headers.get("x-alan-adi-host")
    || req.nextUrl.searchParams.get("host")
    || req.headers.get("host")
    || "";

  const host = ham.toLowerCase().split(":")[0].replace(/^www\./, "");

  const koke = process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";
  if (!host) return NextResponse.redirect(koke, 302);

  const kayit = await prisma.alanAdi.findUnique({
    where: { alanAdi: host },
    select: { memberId: true, durum: true },
  });

  // Bilinmeyen ya da henüz yayına alınmamış adresler ana sayfaya düşer.
  if (!kayit || (kayit.durum !== "AKTIF" && kayit.durum !== "YAYILIYOR")) {
    return NextResponse.redirect(koke, 302);
  }

  return NextResponse.redirect(kartHedefUrl(kayit.memberId), 301);
}
