import "server-only";
import { prisma } from "@/lib/prisma";
import { sendMail, htmlLayout, row } from "@/lib/mailer";
import {
  getDomainApiConfig, kisiOlustur, domainKaydet, nameServerGuncelle, domainYenile,
  type IletisimBilgisi,
} from "@/lib/domainapi";
import {
  getCloudflareConfig, zoneOlusturVeyaBul, cnameYaz, yonlendirmeKurali, sslModuAyarla, zoneDurum,
} from "@/lib/cloudflare";

// Ödeme onaylandıktan sonra çalışan alan adı kurulum akışı.
//
// Adımlar sırayla ve IDEMPOTENT şekilde ilerler — her adım "zaten yapılmış mı"
// kontrolüyle başlar, böylece hata sonrası yeniden çalıştırmak güvenlidir
// (admin panelinden "yeniden dene" aynı fonksiyonu çağırır).
//
//   1. Registrar'da iletişim kaydı  → contactHandle
//   2. Alan adını kaydet            → registrarOrderCode, bitisTarihi
//   3. Cloudflare zone              → cfZoneId, cfNameServers
//   4. CNAME @ ve www → qontac.net  (proxied)
//   5. 301 yönlendirme kuralı       → cfRuleId
//   6. Registrar NS → Cloudflare
//   7. durum = YAYILIYOR (cron AKTIF'e çeker)

function siteKoku(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net";
}

/** Alan adının yönlendirileceği kart adresi. */
export function kartHedefUrl(memberId: string): string {
  return `${siteKoku()}/kart/${memberId}?src=domain`;
}

/** CNAME hedefi — üyenin adresi bu ana bilgisayara bağlanır. */
function cnameHedefi(): string {
  return new URL(siteKoku()).hostname; // "qontac.net"
}

async function hataYaz(id: string, mesaj: string) {
  await prisma.alanAdi.update({ where: { id }, data: { durum: "HATA", hataMesaji: mesaj.slice(0, 500) } });
  await sendMail({
    subject: `⚠️ Alan adı kurulumu başarısız — ${id}`,
    html: htmlLayout("Alan Adı Kurulum Hatası", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">Ödemesi alınmış bir alan adının kurulumu tamamlanamadı. Admin panelinden yeniden deneyin.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        ${row("Kayıt", id)}
        ${row("Hata", mesaj)}
      </table>`),
  }).catch(() => { /* mail hatası akışı bozmasın */ });
}

/**
 * Kurulumu baştan sona (veya kaldığı yerden) çalıştırır.
 * Hata durumunda kaydı HATA'ya çeker ve admin'e e-posta atar; exception fırlatmaz.
 */
export async function alanAdiKurulumBaslat(alanAdiId: string): Promise<void> {
  const kayit = await prisma.alanAdi.findUnique({ where: { id: alanAdiId } });
  if (!kayit) return;
  if (kayit.durum === "AKTIF") return;

  const iletisim = kayit.iletisim as IletisimBilgisi | null;
  if (!iletisim) return hataYaz(alanAdiId, "İletişim bilgileri kayıtlı değil.");

  const dnapi = await getDomainApiConfig();
  if (!dnapi) return hataYaz(alanAdiId, "Domain Name API yapılandırılmamış.");

  const cf = getCloudflareConfig();
  if (!cf) return hataYaz(alanAdiId, "Cloudflare yapılandırılmamış (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID).");

  await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { durum: "KAYIT_EDILIYOR", hataMesaji: "" } });

  try {
    // 1 — iletişim kaydı
    let contactHandle = kayit.contactHandle;
    if (!contactHandle) {
      contactHandle = await kisiOlustur(dnapi, iletisim);
      await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { contactHandle } });
    }

    // 3 — Cloudflare zone'u kayıttan ÖNCE açıyoruz: registrar'a vereceğimiz
    // nameserver'ları ancak zone açıldıktan sonra biliyoruz.
    let zoneId = kayit.cfZoneId;
    let nameServers = kayit.cfNameServers;
    if (!zoneId || nameServers.length === 0) {
      const zone = await zoneOlusturVeyaBul(cf, kayit.alanAdi);
      zoneId = zone.id;
      nameServers = zone.name_servers ?? [];
      await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { cfZoneId: zoneId, cfNameServers: nameServers } });
    }
    if (nameServers.length === 0) throw new Error("Cloudflare nameserver listesi boş döndü.");

    // 2 — alan adı kaydı (nameserver'lar doğrudan Cloudflare olarak verilir)
    if (!kayit.registrarOrderCode) {
      const sonuc = await domainKaydet(dnapi, {
        alanAdi: kayit.alanAdi,
        yil: kayit.yil,
        nameServers,
        iletisim,
      });
      await prisma.alanAdi.update({
        where: { id: alanAdiId },
        data: {
          registrarOrderCode: sonuc.domainId || sonuc.status || "kayitli",
          kayitTarihi: new Date(),
          bitisTarihi: sonuc.bitisTarihi ?? new Date(Date.now() + kayit.yil * 365 * 864e5),
        },
      });
    }

    // 4 — CNAME kayıtları
    const hedef = cnameHedefi();
    await cnameYaz(cf, zoneId, kayit.alanAdi, hedef);
    await cnameYaz(cf, zoneId, `www.${kayit.alanAdi}`, hedef);

    // Origin sertifikası alan adıyla eşleşmediği için SSL "Full" olmalı.
    await sslModuAyarla(cf, zoneId).catch(() => { /* ayar hatası kurulumu bozmasın */ });

    // 5 — 301 yönlendirme kuralı
    const cfRuleId = await yonlendirmeKurali(cf, zoneId, kartHedefUrl(kayit.memberId));
    await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { cfRuleId } });

    // 6 — registrar tarafında NS'leri Cloudflare'e çevir (kayıtta zaten verildi;
    // yine de garanti için tekrar yazılır — idempotent bir işlem).
    await nameServerGuncelle(dnapi, kayit.alanAdi, nameServers).catch(() => { /* kayıtta zaten verildi */ });

    // 7 — yayılım bekleniyor
    await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { durum: "YAYILIYOR", hataMesaji: "" } });
    await kurulumBildirimi(alanAdiId);
  } catch (e) {
    await hataYaz(alanAdiId, e instanceof Error ? e.message : String(e));
  }
}

/** Kurulum başladı bilgisini üyeye gönderir. */
async function kurulumBildirimi(alanAdiId: string) {
  const kayit = await prisma.alanAdi.findUnique({
    where: { id: alanAdiId },
    include: { member: { select: { email: true, ad: true } } },
  });
  if (!kayit?.member.email) return;

  await sendMail({
    to: kayit.member.email,
    subject: `Web adresiniz hazırlanıyor — ${kayit.alanAdi}`,
    html: htmlLayout("Web Adresiniz Alındı!", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">
        <strong>${kayit.alanAdi}</strong> adresi adınıza kaydedildi ve tanıtım sayfanıza bağlandı.
        Adresin dünya genelinde yayılması genellikle 1-4 saat sürer; bu süre içinde açılmazsa endişelenmeyin.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        ${row("Web Adresiniz", `www.${kayit.alanAdi}`)}
        ${row("Bitiş Tarihi", kayit.bitisTarihi ? kayit.bitisTarihi.toLocaleDateString("tr-TR") : "-")}
      </table>
      <p style="margin:16px 0 0;font-size:14px;color:#374151;">
        Panelinizdeki <strong>Web Adresin</strong> bölümünden adresinizi tanıtmak için hazırladığımız
        araçlara (QR kod, e-posta imzası, sosyal medya metinleri) ulaşabilirsiniz.
      </p>`),
  }).catch(() => {});
}

/** Yayılım kontrolü — zone aktifleştiyse durumu AKTIF'e çeker. */
export async function yayilimKontrol(alanAdiId: string): Promise<boolean> {
  const kayit = await prisma.alanAdi.findUnique({ where: { id: alanAdiId } });
  const cf = getCloudflareConfig();
  if (!kayit || !cf || !kayit.cfZoneId || kayit.durum !== "YAYILIYOR") return false;

  try {
    const zone = await zoneDurum(cf, kayit.cfZoneId);
    if (zone.status !== "active") return false;
    await prisma.alanAdi.update({ where: { id: alanAdiId }, data: { durum: "AKTIF", hataMesaji: "" } });

    const uye = await prisma.member.findUnique({ where: { id: kayit.memberId }, select: { email: true } });
    if (uye?.email) {
      await sendMail({
        to: uye.email,
        subject: `Web adresiniz yayında — ${kayit.alanAdi}`,
        html: htmlLayout("Web Adresiniz Yayında!", `
          <p style="margin:0 0 16px;font-size:14px;color:#374151;">
            <strong>www.${kayit.alanAdi}</strong> artık çalışıyor. Adresi yazan herkes tanıtım sayfanızı görecek.
          </p>
          <p style="margin:0;font-size:14px;color:#374151;">
            Panelinizdeki <strong>Web Adresin</strong> bölümünden tanıtım araçlarına göz atın.
          </p>`),
      }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

/** Yenileme ödemesi onaylandığında çalışır. */
export async function alanAdiYenilemeTamamla(alanAdiId: string): Promise<void> {
  const kayit = await prisma.alanAdi.findUnique({ where: { id: alanAdiId } });
  if (!kayit) return;

  const dnapi = await getDomainApiConfig();
  if (!dnapi) return hataYaz(alanAdiId, "Domain Name API yapılandırılmamış.");

  try {
    const sonuc = await domainYenile(dnapi, kayit.alanAdi, kayit.yil);
    await prisma.alanAdi.update({
      where: { id: alanAdiId },
      data: {
        durum: "AKTIF",
        hataMesaji: "",
        hatirlatmalar: [],
        bitisTarihi: sonuc.bitisTarihi
          ?? new Date((kayit.bitisTarihi?.getTime() ?? Date.now()) + kayit.yil * 365 * 864e5),
      },
    });
  } catch (e) {
    await hataYaz(alanAdiId, e instanceof Error ? e.message : String(e));
  }
}
