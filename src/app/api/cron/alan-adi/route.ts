import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, htmlLayout, row } from "@/lib/mailer";
import { yayilimKontrol } from "@/lib/alan-adi-kurulum";
import { haricAlanAdiKontrol } from "@/lib/alan-adi-baglama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Alan adı bakım görevi — sunucudaki crontab günde bir kez çağırır:
//   0 6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://qontac.net/api/cron/alan-adi
//
// Yaptıkları:
//   1. YAYILIYOR durumundakilerin Cloudflare zone'unu kontrol edip AKTIF'e çeker
//      ve DNS_BEKLIYOR durumundaki bağlı adreslerin doğrulamasını yoklar
//   2. Süresi dolanları SURESI_DOLDU'ya çeker
//   3. Bitişe 60/30/7 gün kala üyeye hatırlatma e-postası gönderir (her eşik bir kez)

const ESIKLER = [60, 30, 7];

function yetkili(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!yetkili(req)) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const simdi = Date.now();
  const rapor = { yayilim: 0, baglanan: 0, suresiDolan: 0, hatirlatma: 0 };

  // 1 — yayılım kontrolü
  const yayiliyor = await prisma.alanAdi.findMany({ where: { durum: "YAYILIYOR" }, select: { id: true } });
  for (const a of yayiliyor) {
    if (await yayilimKontrol(a.id)) rapor.yayilim++;
  }

  // 1b — üyenin kendi adresi: DNS kayıtları girildiyse yayına al.
  // Üye "kontrol et" demeyi unutsa da adres kendiliğinden açılsın.
  const dnsBekleyen = await prisma.alanAdi.findMany({
    where: { durum: "DNS_BEKLIYOR", harici: true },
    select: { id: true },
  });
  for (const a of dnsBekleyen) {
    const sonuc = await haricAlanAdiKontrol(a.id).catch(() => null);
    if (sonuc?.hazir) rapor.baglanan++;
  }

  // 2 — süresi dolanlar
  const dolan = await prisma.alanAdi.updateMany({
    // Bağlanan adreslerin süresini biz takip etmiyoruz (harici: false).
    where: { durum: { in: ["AKTIF", "YAYILIYOR"] }, harici: false, bitisTarihi: { lt: new Date(simdi) } },
    data: { durum: "SURESI_DOLDU" },
  });
  rapor.suresiDolan = dolan.count;

  // 3 — yenileme hatırlatmaları
  const enUzak = new Date(simdi + Math.max(...ESIKLER) * 864e5);
  const yaklasanlar = await prisma.alanAdi.findMany({
    where: { durum: "AKTIF", harici: false, otoYenile: true, bitisTarihi: { not: null, lte: enUzak } },
    include: { member: { select: { email: true, ad: true } } },
  });

  for (const a of yaklasanlar) {
    if (!a.bitisTarihi || !a.member.email) continue;
    const kalan = Math.ceil((a.bitisTarihi.getTime() - simdi) / 864e5);

    // Geçilen en küçük eşik — 45 gün kalmışsa 60'lık hatırlatma gönderilir.
    const esik = ESIKLER.find(e => kalan <= e && !a.hatirlatmalar.includes(e));
    if (esik === undefined) continue;

    await sendMail({
      to: a.member.email,
      subject: `Web adresinizin süresi ${kalan} gün sonra doluyor — ${a.alanAdi}`,
      html: htmlLayout("Web Adresinizi Yenileyin", `
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">
          <strong>${a.alanAdi}</strong> adresinizin kayıt süresi ${kalan} gün sonra doluyor.
          Süresi dolan adresler başkaları tarafından alınabilir — yenilemeyi geciktirmeyin.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${row("Web Adresiniz", `www.${a.alanAdi}`)}
          ${row("Bitiş Tarihi", a.bitisTarihi.toLocaleDateString("tr-TR"))}
        </table>
        <p style="margin:16px 0 0;font-size:14px;color:#374151;">
          Yenilemek için panelinizdeki <strong>Web Adresin</strong> bölümüne girin.
        </p>`),
    }).catch(() => { /* mail hatası döngüyü durdurmasın */ });

    await prisma.alanAdi.update({
      where: { id: a.id },
      data: { hatirlatmalar: [...a.hatirlatmalar, esik] },
    });
    rapor.hatirlatma++;
  }

  return NextResponse.json({ ok: true, ...rapor });
}
