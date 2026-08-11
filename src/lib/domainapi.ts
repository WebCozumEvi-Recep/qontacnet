import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tlKurusaCevir } from "@/lib/domain-fiyat";

// Domain Name API (domainresellerapi.com) bayi istemcisi.
//
// Kimlik doğrulama iki başlıkla yapılır: `__reseller` (bayi id) ve `X-API-KEY`.
// Yapılandırma admin panelindeki "Alan Adı (Domain) Satışı" bölümünden (SiteSettings)
// okunur; boşsa aşağıdaki env değişkenlerine düşer:
//   DOMAINAPI_RESELLER_ID / DOMAINAPI_KEY / DOMAINAPI_TEST ("true" → OTE)
//
// Fiyatlar iki farklı uçtan gelir ve bilinçli olarak ayrıştırılmıştır:
//   • müsaitlik  → /domains/bulk-search (fiyatı USD döner, güvenilmez)
//   • TRY maliyet → /products/tlds       (bayi TRY liste fiyatı, önbelleklenir)

const OTE_BASE = "https://ote.domainresellerapi.com";
const LIVE_BASE = "https://api.domainresellerapi.com";

export class DomainApiError extends Error {
  constructor(message: string, readonly kod?: string) {
    super(message);
    this.name = "DomainApiError";
  }
}

export interface DomainApiConfig {
  baseUrl: string;
  resellerId: string;
  apiKey: string;
  test: boolean;
}

/** Aktif bayi yapılandırması. Eksikse null (alan adı satışı kapalı). */
export async function getDomainApiConfig(): Promise<DomainApiConfig | null> {
  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } }).catch(() => null);

  if (s?.domainAktif && s.domainResellerId && s.domainApiKey) {
    return {
      baseUrl: s.domainTest ? OTE_BASE : LIVE_BASE,
      resellerId: s.domainResellerId,
      apiKey: s.domainApiKey,
      test: s.domainTest,
    };
  }

  const rid = process.env.DOMAINAPI_RESELLER_ID;
  const key = process.env.DOMAINAPI_KEY;
  if (rid && key) {
    const test = process.env.DOMAINAPI_TEST !== "false";
    return { baseUrl: test ? OTE_BASE : LIVE_BASE, resellerId: rid, apiKey: key, test };
  }

  return null;
}

/** Kâr marjı ayarları — fiyat hesabı için (satisFiyati ile birlikte kullanılır). */
export async function getFiyatAyarlari(): Promise<{ karMarji: number; minKar: number }> {
  const s = await prisma.siteSettings.findUnique({ where: { id: "site" } }).catch(() => null);
  return { karMarji: s?.domainKarMarji ?? 35, minKar: s?.domainMinKar ?? 50 };
}

async function istek<T>(
  cfg: DomainApiConfig,
  yol: string,
  opts: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(cfg.baseUrl + yol);
  for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        __reseller: cfg.resellerId,
        "X-API-KEY": cfg.apiKey,
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new DomainApiError("Alan adı servisine ulaşılamadı. Lütfen tekrar deneyin.");
  }

  const metin = await res.text();
  if (!res.ok) {
    throw new DomainApiError(
      `Alan adı servisi hata döndü (${res.status}).`,
      metin.slice(0, 300),
    );
  }

  try {
    return JSON.parse(metin) as T;
  } catch {
    throw new DomainApiError("Alan adı servisinden beklenmeyen yanıt alındı.");
  }
}

// ————————————————————————————————————————————————————————————— müsaitlik

export interface MusaitlikSonuc {
  alanAdi: string;
  tld: string;
  musait: boolean;
  premium: boolean;
  /** Servis "dolu" derse nedeni (ör. "Domain exists"). */
  neden: string;
}

interface BulkYanit {
  success: boolean;
  operationMessage?: string;
  infos?: { domainName: string; tld: string; isPremium: boolean; status: string; reason: string | null }[];
}

/** Birden fazla alan adının müsaitliğini tek çağrıda sorgular. */
export async function musaitlikSorgula(cfg: DomainApiConfig, alanAdlari: string[]): Promise<MusaitlikSonuc[]> {
  if (alanAdlari.length === 0) return [];

  const yanit = await istek<BulkYanit>(cfg, "/api/v1/domains/bulk-search", {
    method: "POST",
    body: alanAdlari.map(d => ({ domainName: d, currency: "TRY" })),
  });

  if (!yanit.success) throw new DomainApiError(yanit.operationMessage || "Sorgulama başarısız.");

  return (yanit.infos ?? []).map(i => ({
    alanAdi: i.domainName.toLowerCase(),
    tld: (i.tld || "").toLowerCase(),
    musait: i.status === "AVAILABLE",
    premium: Boolean(i.isPremium),
    neden: i.reason ?? "",
  }));
}

// ————————————————————————————————————————————————————————————— TLD fiyatları

interface TldYanit {
  items?: {
    name: string;
    minRegistrationPeriod: number;
    maxRegistrationPeriod: number;
    prices?: {
      priceGroup: string;
      register?: { period: number; price: number; currency: string }[];
      renew?: { period: number; price: number; currency: string }[];
    }[];
    attributes?: {
      key: string;
      description?: string | null;
      isRequired: boolean;
      type?: string | null;
      options?: { value?: string | null; description?: string | null }[] | null;
    }[];
  }[];
}

/**
 * Uzantıya özel ek alan (registrar'ın `tldAttributes` sözlüğü). Örneğin `.com.tr`
 * kaydında istenen belge/marka bilgileri bu şekilde gelir; kayıt isteğinde
 * `{key: değer}` olarak gönderilir.
 */
export interface TldNitelik {
  anahtar: string;
  aciklama: string;
  zorunlu: boolean;
  /** Serviste tanımlı tip ("String", "Select" vb.) — seçenek varsa liste gösterilir. */
  tip: string;
  secenekler: { deger: string; aciklama: string }[];
}

export interface TldMaliyet {
  /** 1 yıllık kayıt maliyeti (TRY, kuruş). 0 ise fiyat bulunamadı. */
  kayitKurus: number;
  /** 1 yıllık yenileme maliyeti (TRY, kuruş). */
  yenilemeKurus: number;
  /** Uzantının kayıt sırasında istediği ek alanlar (çoğu uzantıda boş). */
  nitelikler: TldNitelik[];
}

function birYillikKurus(liste: { period: number; price: number; currency: string }[] | undefined): number {
  const kayit = (liste ?? []).find(p => p.period === 1 && p.currency === "TRY");
  return kayit ? tlKurusaCevir(kayit.price) : 0;
}

async function tldMaliyetleriniCek(cfg: DomainApiConfig): Promise<Record<string, TldMaliyet>> {
  const yanit = await istek<TldYanit>(cfg, "/api/v1/products/tlds", {
    query: { Currency: "TRY", MaxResultCount: "1000" },
  });

  const harita: Record<string, TldMaliyet> = {};
  for (const item of yanit.items ?? []) {
    // Bayi grubunun fiyatı bizim maliyetimizdir; yoksa ilk grubu kullan.
    const grup = (item.prices ?? []).find(p => p.priceGroup === "Reseller") ?? (item.prices ?? [])[0];
    if (!grup) continue;
    harita[item.name.toLowerCase()] = {
      kayitKurus: birYillikKurus(grup.register),
      yenilemeKurus: birYillikKurus(grup.renew),
      nitelikler: (item.attributes ?? []).map(a => ({
        anahtar: a.key,
        aciklama: a.description || a.key,
        zorunlu: Boolean(a.isRequired),
        tip: a.type || "String",
        secenekler: (a.options ?? [])
          .map(o => ({ deger: o.value ?? "", aciklama: o.description || o.value || "" }))
          .filter(o => o.deger),
      })).filter(a => a.anahtar),
    };
  }
  return harita;
}

/**
 * TLD maliyet tablosu — 6 saat önbelleklenir. Liste 700'e yakın uzantı içerir ve
 * nadiren değişir; her sorguda çekmek gereksiz gecikme yaratır.
 * Önbellek anahtarı test/canlı ortamına göre ayrılır.
 */
export async function tldMaliyetleri(cfg: DomainApiConfig): Promise<Record<string, TldMaliyet>> {
  const cached = unstable_cache(
    () => tldMaliyetleriniCek(cfg),
    ["domain-tld-fiyat", cfg.test ? "ote" : "live"],
    { revalidate: 21600, tags: ["domain-tld-fiyat"] },
  );
  return cached();
}

// ————————————————————————————————————————————————————————————— kişi & kayıt

export interface IletisimBilgisi {
  ad: string;
  soyad: string;
  firma: string;
  email: string;
  adres: string;
  sehir: string;
  ilce: string;
  postaKodu: string;
  ulke: string; // ISO-2, örn. "TR"
  telefonUlkeKodu: string; // "+90"
  telefon: string;
}

function contactDto(b: IletisimBilgisi) {
  return {
    firstName: b.ad,
    lastName: b.soyad,
    companyName: b.firma || `${b.ad} ${b.soyad}`.trim(),
    eMail: b.email,
    address: b.adres,
    phoneCountryCode: b.telefonUlkeKodu.replace(/^\+/, ""),
    phone: b.telefon,
    faxCountryCode: "",
    fax: "",
    postalCode: b.postaKodu,
    country: b.ulke,
    city: b.sehir,
    state: b.ilce || b.sehir,
    discloseFlag: false, // WHOIS gizliliği: kişisel veriler yayınlanmasın
  };
}

/** Registrar tarafında iletişim kaydı oluşturur ve handle döner. */
export async function kisiOlustur(cfg: DomainApiConfig, bilgi: IletisimBilgisi): Promise<string> {
  const yanit = await istek<{ handle: string; isSuccess: boolean; operationMessage?: string }>(
    cfg,
    "/api/v1/contacts",
    { method: "POST", body: { contact: contactDto(bilgi) } },
  );
  if (!yanit.isSuccess || !yanit.handle) {
    throw new DomainApiError(yanit.operationMessage || "İletişim kaydı oluşturulamadı.");
  }
  return yanit.handle;
}

export interface KayitSonuc {
  domainId: string;
  status: string;
  bitisTarihi: Date | null;
}

/**
 * Alan adını kaydeder. Dört iletişim rolü de (registrant/admin/billing/tech)
 * aynı kişiye bağlanır — üye kendi adına kaydettiriyor.
 *
 * `nitelikler`, uzantıya özel zorunlu alanlardır (`.com.tr` gibi); servise
 * `tldAttributes` sözlüğü olarak geçer, boşsa alan hiç gönderilmez.
 */
export async function domainKaydet(
  cfg: DomainApiConfig,
  opts: {
    alanAdi: string;
    yil: number;
    nameServers: string[];
    iletisim: IletisimBilgisi;
    nitelikler?: Record<string, string>;
  },
): Promise<KayitSonuc> {
  const kisi = contactDto(opts.iletisim);
  const yanit = await istek<{ success: boolean; message?: string; domainId?: string; status?: string; expirationDate?: string }>(
    cfg,
    "/api/v1/domains/register-with-contacts",
    {
      method: "POST",
      body: {
        domainName: opts.alanAdi,
        period: opts.yil,
        nameServers: opts.nameServers,
        contacts: ["Registrant", "Administrative", "Billing", "Technical"].map(rol => ({ ...kisi, contactType: rol })),
        ...(opts.nitelikler && Object.keys(opts.nitelikler).length > 0
          ? { tldAttributes: opts.nitelikler }
          : {}),
        useTrusteeContact: false,
      },
    },
  );

  if (!yanit.success) throw new DomainApiError(yanit.message || "Alan adı kaydedilemedi.");
  return {
    domainId: yanit.domainId ?? "",
    status: yanit.status ?? "",
    bitisTarihi: yanit.expirationDate ? new Date(yanit.expirationDate) : null,
  };
}

/** Alan adının nameserver'larını değiştirir (Cloudflare'e yönlendirmek için). */
export async function nameServerGuncelle(cfg: DomainApiConfig, alanAdi: string, nameServers: string[]): Promise<void> {
  const yanit = await istek<{ success?: boolean; message?: string; operationMessage?: string }>(
    cfg,
    "/api/v1/domains/dns/name-server",
    { method: "PUT", body: { domainName: alanAdi, nameServers } },
  );
  if (yanit.success === false) {
    throw new DomainApiError(yanit.message || yanit.operationMessage || "Nameserver güncellenemedi.");
  }
}

export interface DomainBilgi {
  alanAdi: string;
  status: string;
  bitisTarihi: Date | null;
  nameservers: string[];
}

export async function domainBilgi(cfg: DomainApiConfig, alanAdi: string): Promise<DomainBilgi> {
  const y = await istek<{ domainName?: string; status?: string; expirationDate?: string; nameservers?: string[] }>(
    cfg,
    "/api/v1/domains/info",
    { query: { DomainName: alanAdi } },
  );
  return {
    alanAdi: y.domainName ?? alanAdi,
    status: y.status ?? "",
    bitisTarihi: y.expirationDate ? new Date(y.expirationDate) : null,
    nameservers: y.nameservers ?? [],
  };
}

/** Alan adını uzatır. Ödeme onaylandıktan sonra çağrılır. */
export async function domainYenile(cfg: DomainApiConfig, alanAdi: string, yil: number): Promise<KayitSonuc> {
  const yanit = await istek<{ success: boolean; message?: string; domainId?: string; status?: string; expirationDate?: string }>(
    cfg,
    "/api/v1/domains/renew",
    { method: "POST", body: { domainName: alanAdi, period: yil } },
  );
  if (!yanit.success) throw new DomainApiError(yanit.message || "Alan adı yenilenemedi.");
  return {
    domainId: yanit.domainId ?? "",
    status: yanit.status ?? "",
    bitisTarihi: yanit.expirationDate ? new Date(yanit.expirationDate) : null,
  };
}
