import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDomainApiConfig, getFiyatAyarlari, musaitlikSorgula, tldMaliyetleri, DomainApiError, type TldNitelik } from "@/lib/domainapi";
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
  /** Uzantının kayıt sırasında istediği ek alanlar — satın alma formunda sorulur. */
  nitelikler: TldNitelik[];
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
  // Öneriler listenin başından alınır; her uzantı bir müsaitlik sorgusu demek,
  // bu yüzden gösterilecek sonuç sayısı sınırlı tutulur.
  for (const t of ONERILEN_TLDLER.slice(0, 6)) if (!tldler.includes(t)) tldler.push(t);

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
      // Uzantıya özel alanlar (ör. .com.tr belge bilgileri) satın alma formunda sorulur.
      const nitelikler = maliyetler[tld]?.nitelikler ?? [];

      if (!m) return { alanAdi, tld, musait: false, premium: false, fiyat: 0, satinAlinabilir: false, not: "Sorgulanamadı.", nitelikler };
      if (!m.musait) return { alanAdi, tld, musait: false, premium: m.premium, fiyat: 0, satinAlinabilir: false, not: "Bu adres alınmış.", nitelikler };
      // Premium adresler farklı fiyatlandırılır; listedeki maliyet geçerli değildir.
      if (m.premium) return { alanAdi, tld, musait: true, premium: true, fiyat: 0, satinAlinabilir: false, not: "Premium adres — bizimle iletişime geçin.", nitelikler };
      if (fiyat === 0) return { alanAdi, tld, musait: true, premium: false, fiyat: 0, satinAlinabilir: false, not: "Fiyat alınamadı.", nitelikler };

      return { alanAdi, tld, musait: true, premium: false, fiyat, satinAlinabilir: true, not: "", nitelikler };
    });

    return NextResponse.json({ ok: true, etiket, sonuclar });
  } catch (e) {
    if (e instanceof DomainApiError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
    return NextResponse.json({ ok: false, error: "Sorgulama sırasında bir hata oluştu." }, { status: 500 });
  }
}

/**
 * Satışa açık uzantıların tam listesi — uzantı kutusunu doldurmak için.
 * Kaynak, bayinin TRY fiyat tablosudur (6 saat önbellekli): fiyatı olan her
 * uzantı satılabilir demektir. Sıralama: önce ONERILEN_TLDLER'deki sıra,
 * sonra alfabetik. API yapılandırılmamışsa öneri listesine düşülür.
 */
export async function GET() {
  const session = await requireRole("uye");
  if (!session) return NextResponse.json({ ok: false, error: "Yetkisiz." }, { status: 401 });

  const cfg = await getDomainApiConfig();
  if (!cfg) return NextResponse.json({ ok: true, tldler: ONERILEN_TLDLER as DesteklenenTld[] });

  try {
    const [maliyetler, fiyatAyar] = await Promise.all([tldMaliyetleri(cfg), getFiyatAyarlari()]);

    const satilabilir = Object.entries(maliyetler)
      .filter(([, m]) => m.kayitKurus > 0)
      .map(([tld, m]) => ({
        tld,
        fiyat: satisFiyati(m.kayitKurus, fiyatAyar),
        // ".com.tr" gibi belge/ek bilgi isteyen uzantılar kutuda işaretlenir.
        ekBilgi: m.nitelikler.some(n => n.zorunlu),
      }));

    const oncelik = (t: string) => {
      const i = ONERILEN_TLDLER.indexOf(t);
      return i === -1 ? ONERILEN_TLDLER.length : i;
    };
    satilabilir.sort((a, b) => oncelik(a.tld) - oncelik(b.tld) || a.tld.localeCompare(b.tld));

    if (satilabilir.length === 0) {
      return NextResponse.json({ ok: true, tldler: ONERILEN_TLDLER as DesteklenenTld[] });
    }
    return NextResponse.json({ ok: true, tldler: satilabilir.map(t => t.tld), fiyatlar: satilabilir });
  } catch {
    // Fiyat tablosu alınamazsa kutu boş kalmasın.
    return NextResponse.json({ ok: true, tldler: ONERILEN_TLDLER as DesteklenenTld[] });
  }
}
