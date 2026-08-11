import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail, htmlLayout, row } from "@/lib/mailer";
import {
  getCloudflareConfig, anaZoneId, customHostnameOlustur, customHostnameDurum, customHostnameSil,
  type DnsKaydi,
} from "@/lib/cloudflare";

// Üyenin KENDİ kayıt kuruluşunda duran alan adını tanıtım sayfasına bağlama akışı.
//
// Satın alınan adreslerden farkı: nameserver'ları biz yönetmiyoruz, dolayısıyla
// zone açamıyoruz. Bunun yerine kendi zone'umuzda (qontac.net) Cloudflare for SaaS
// "custom hostname" açıyoruz; üye kendi DNS panelinde iki TXT doğrulama kaydı ile
// bir CNAME açtığında Cloudflare sertifikayı üretiyor ve trafik bize düşüyor.
// Gelen istek src/proxy.ts → /api/alan-adi/coz üzerinden kart sayfasına 301'leniyor.
//
// Durum akışı:  DNS_BEKLIYOR → (kayıtlar girildi, doğrulandı) → AKTIF

/** Alan adının bağlanacağı hedef ana bilgisayar — üyenin CNAME'i buraya bakar. */
export function baglantiHedefi(): string {
  return new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net").hostname;
}

/**
 * Üyeye gösterilecek DNS kayıtlarını üretir: Cloudflare'in istediği doğrulama
 * kayıtları + trafiği bize getiren CNAME'ler.
 *
 * Kök alan adı (apex) çoğu sağlayıcıda CNAME kabul etmez; oralarda ALIAS/ANAME
 * kaydı ya da sağlayıcının yönlendirme özelliği kullanılır. Bunu kaydın kendi
 * açıklamasında söylüyoruz.
 */
function dnsKayitlariUret(alanAdi: string, dogrulama: DnsKaydi[]): DnsKaydi[] {
  const hedef = baglantiHedefi();
  return [
    ...dogrulama,
    {
      tip: "CNAME",
      ad: `www.${alanAdi}`,
      deger: hedef,
      aciklama: "Ziyaretçileri tanıtım sayfanıza getirir.",
    },
    {
      tip: "CNAME",
      ad: alanAdi,
      deger: hedef,
      aciklama:
        "Kök adres (www'suz hâli). Sağlayıcınız kökte CNAME kabul etmiyorsa " +
        "ALIAS ya da ANAME tipini seçin; o da yoksa panelinizdeki yönlendirme " +
        `özelliğiyle ${alanAdi} adresini www.${alanAdi} adresine yönlendirin.`,
    },
  ];
}

export class BaglamaHatasi extends Error {}

/**
 * Alan adını üyeye bağlar ve DNS kayıtlarını hazırlar (idempotent — aynı adres
 * için tekrar çağrılırsa mevcut custom hostname'ler kullanılır).
 */
export async function haricAlanAdiBagla(memberId: string, alanAdi: string) {
  const cf = getCloudflareConfig();
  if (!cf) throw new BaglamaHatasi("Alan adı bağlama şu an kullanılamıyor.");

  const mevcut = await prisma.alanAdi.findUnique({ where: { alanAdi } });
  if (mevcut && mevcut.memberId !== memberId) {
    throw new BaglamaHatasi("Bu adres başka bir hesapta kullanımda.");
  }

  const zoneId = await anaZoneId(cf);

  // Hem kök hem www için ayrı birer custom hostname gerekiyor; ziyaretçi ikisini
  // de yazabiliyor ve sertifika ana bilgisayar başına üretiliyor.
  const hostlar = [alanAdi, `www.${alanAdi}`];
  const kayitlar = [];
  for (const h of hostlar) kayitlar.push(await customHostnameOlustur(cf, zoneId, h));

  const dogrulama = kayitlar.flatMap(k => k.dogrulama);
  // Aynı TXT adı iki hostname için de dönebilir — tekrarı göstermeyelim.
  const benzersiz = dogrulama.filter((d, i) => dogrulama.findIndex(x => x.ad === d.ad && x.deger === d.deger) === i);
  const dnsKayitlari = dnsKayitlariUret(alanAdi, benzersiz);

  const veri = {
    memberId,
    alanAdi,
    tld: alanAdi.split(".").slice(1).join("."),
    harici: true,
    durum: "DNS_BEKLIYOR" as const,
    yil: 0, // bizde kayıtlı değil — yenileme/ücret akışı yok
    satisTutar: 0,
    maliyetKurus: 0,
    cfCustomHostnameIdleri: kayitlar.map(k => k.id),
    // Json sütunu — DnsKaydi[] serileştirilebilir bir yapı, Prisma tipine dönüştürülür.
    dnsKayitlari: dnsKayitlari as unknown as Prisma.InputJsonValue,
    hataMesaji: "",
  };

  const kayit = await prisma.alanAdi.upsert({
    where: { alanAdi },
    create: veri,
    update: veri,
  });

  return { kayit, dnsKayitlari };
}

/**
 * Cloudflare tarafındaki doğrulama durumunu okur; sahiplik ve sertifika tamamsa
 * kaydı AKTIF'e çeker. Üye "Kontrol et" dediğinde ve cron'da çağrılır.
 */
export async function haricAlanAdiKontrol(alanAdiId: string): Promise<{ hazir: boolean; dnsKayitlari: DnsKaydi[]; not: string }> {
  const kayit = await prisma.alanAdi.findUnique({ where: { id: alanAdiId } });
  if (!kayit || !kayit.harici) return { hazir: false, dnsKayitlari: [], not: "Kayıt bulunamadı." };

  const cf = getCloudflareConfig();
  if (!cf) return { hazir: false, dnsKayitlari: [], not: "Alan adı bağlama şu an kullanılamıyor." };

  const zoneId = await anaZoneId(cf);
  const durumlar = [];
  for (const id of kayit.cfCustomHostnameIdleri) {
    durumlar.push(await customHostnameDurum(cf, zoneId, id));
  }
  if (durumlar.length === 0) return { hazir: false, dnsKayitlari: [], not: "Bağlantı kaydı eksik — adresi yeniden bağlayın." };

  // Kök adres bazı sağlayıcılarda CNAME alamadığı için tek başına takılabilir;
  // www hazırsa adres çalışıyor sayılır.
  const wwwKayit = durumlar.find(d => d.hostname.startsWith("www.")) ?? durumlar[0];
  const hazir = wwwKayit.status === "active" && wwwKayit.sslStatus === "active";

  const dogrulama = durumlar.flatMap(d => d.dogrulama);
  const benzersiz = dogrulama.filter((d, i) => dogrulama.findIndex(x => x.ad === d.ad && x.deger === d.deger) === i);
  const dnsKayitlari = dnsKayitlariUret(kayit.alanAdi, benzersiz);

  await prisma.alanAdi.update({
    where: { id: alanAdiId },
    data: {
      dnsKayitlari: dnsKayitlari as unknown as Prisma.InputJsonValue,
      ...(hazir && kayit.durum !== "AKTIF"
        ? { durum: "AKTIF" as const, kayitTarihi: kayit.kayitTarihi ?? new Date(), hataMesaji: "" }
        : {}),
    },
  });

  if (hazir && kayit.durum !== "AKTIF") await baglandiBildirimi(alanAdiId);

  const not = hazir
    ? "Adresiniz yayında."
    : wwwKayit.status !== "active"
      ? "Doğrulama kayıtları henüz görünmüyor. DNS değişiklikleri genellikle 5 dakika–2 saat içinde yayılır."
      : "Sahiplik doğrulandı, güvenlik sertifikası hazırlanıyor. Bu adım birkaç dakika sürer.";

  return { hazir, dnsKayitlari, not };
}

/** Bağlantıyı kaldırır — custom hostname'ler silinir, kayıt düşer. */
export async function haricAlanAdiKaldir(alanAdiId: string, memberId: string): Promise<void> {
  const kayit = await prisma.alanAdi.findUnique({ where: { id: alanAdiId } });
  if (!kayit || !kayit.harici || kayit.memberId !== memberId) return;

  const cf = getCloudflareConfig();
  if (cf) {
    const zoneId = await anaZoneId(cf).catch(() => "");
    if (zoneId) {
      for (const id of kayit.cfCustomHostnameIdleri) {
        await customHostnameSil(cf, zoneId, id).catch(() => { /* silinmiş olabilir */ });
      }
    }
  }
  await prisma.alanAdi.delete({ where: { id: alanAdiId } });
}

async function baglandiBildirimi(alanAdiId: string) {
  const kayit = await prisma.alanAdi.findUnique({
    where: { id: alanAdiId },
    include: { member: { select: { email: true } } },
  });
  if (!kayit?.member.email) return;

  await sendMail({
    to: kayit.member.email,
    subject: `Web adresiniz yayında — ${kayit.alanAdi}`,
    html: htmlLayout("Adresiniz Bağlandı!", `
      <p style="margin:0 0 16px;font-size:14px;color:#374151;">
        <strong>www.${kayit.alanAdi}</strong> adresi tanıtım sayfanıza bağlandı ve çalışıyor.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        ${row("Web Adresiniz", `www.${kayit.alanAdi}`)}
      </table>
      <p style="margin:16px 0 0;font-size:14px;color:#374151;">
        Panelinizdeki <strong>Web Adresin</strong> bölümünden tanıtım araçlarına (QR kod,
        e-posta imzası, hazır metinler) ulaşabilirsiniz.
      </p>`),
  }).catch(() => {});
}
