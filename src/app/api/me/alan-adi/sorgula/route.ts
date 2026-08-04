import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDomainApiConfig, getFiyatAyarlari, musaitlikSorgula, tldMaliyetleri, DomainApiError } from "@/lib/domainapi";
import { satisFiyati } from "@/lib/domain-fiyat";
import { etiketNormalize, etiketHatasi, girilenTld, tldDestekleniyorMu, ONERILEN_TLDLER, type DesteklenenTld } from "@/lib/domain-kurallar";

export const runtime = "nodejs";

export interface SorguSonucu {
  alanAdi: string;
  tld: string;
  musait: boolean;
  premium: boolean;
  /** Yıllık satış fiyatı (tam TL). Satın alınamıyorsa 0. */
  fiyat: number;
  satinAlinabilir: boolean;
  not: string;
}

export async function POST(req: NextRequest) {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const girdi = String(body.ad ?? "");

  const etiket = etiketNormalize(girdi);
  const hata = etiketHatasi(etiket);
  if (hata) return NextResponse.json({ ok: false, error: hata }, { status: 400 });

  const cfg = await getDomainApiConfig();
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Alan adı satışı henüz yapılandırılmadı." }, { status: 503 });
  }

  // Sıralama: kutudan seçilen uzantı > adresin içine yazılan uzantı > öneriler.
  // İlk sıradaki, arayüzde "öne çıkan sonuç" olarak gösterilir.
  const secilen = String(body.tld ?? "").toLowerCase().replace(/^\./, "");
  const yazilan = girilenTld(girdi);

  const tldler: string[] = [];
  if (secilen && tldDestekleniyorMu(secilen)) tldler.push(secilen);
  if (yazilan && tldDestekleniyorMu(yazilan) && !tldler.includes(yazilan)) tldler.push(yazilan);
  for (const t of ONERILEN_TLDLER) if (!tldler.includes(t)) tldler.push(t);

  const adaylar = tldler.map(t => `${etiket}.${t}`);

  try {
    const [musaitlik, maliyetler, fiyatAyar] = await Promise.all([
      musaitlikSorgula(cfg, adaylar),
      tldMaliyetleri(cfg),
      getFiyatAyarlari(),
    ]);

    const musaitlikHarita = new Map(musaitlik.map(m => [m.alanAdi, m]));

    const sonuclar: SorguSonucu[] = tldler.map(tld => {
      const alanAdi = `${etiket}.${tld}`;
      const m = musaitlikHarita.get(alanAdi);
      const maliyet = maliyetler[tld]?.kayitKurus ?? 0;
      const fiyat = maliyet > 0 ? satisFiyati(maliyet, fiyatAyar) : 0;

      if (!m) return { alanAdi, tld, musait: false, premium: false, fiyat: 0, satinAlinabilir: false, not: "Sorgulanamadı." };
      if (!m.musait) return { alanAdi, tld, musait: false, premium: m.premium, fiyat: 0, satinAlinabilir: false, not: "Bu adres alınmış." };
      // Premium adresler farklı fiyatlandırılır; listedeki maliyet geçerli değildir.
      if (m.premium) return { alanAdi, tld, musait: true, premium: true, fiyat: 0, satinAlinabilir: false, not: "Premium adres — bizimle iletişime geçin." };
      if (fiyat === 0) return { alanAdi, tld, musait: true, premium: false, fiyat: 0, satinAlinabilir: false, not: "Fiyat alınamadı." };

      return { alanAdi, tld, musait: true, premium: false, fiyat, satinAlinabilir: true, not: "" };
    });

    return NextResponse.json({ ok: true, etiket, sonuclar });
  } catch (e) {
    if (e instanceof DomainApiError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
    return NextResponse.json({ ok: false, error: "Sorgulama sırasında bir hata oluştu." }, { status: 500 });
  }
}

// Desteklenen uzantıların listesi — istemcinin ön doğrulaması için.
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  return NextResponse.json({ ok: true, tldler: ONERILEN_TLDLER as DesteklenenTld[] });
}
