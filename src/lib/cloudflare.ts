import "server-only";
import { prisma } from "@/lib/prisma";

// Cloudflare API v4 istemcisi — üyenin satın aldığı alan adını zone olarak ekler,
// CNAME ile qontac.net'e bağlar ve kart sayfasına 301 yönlendirme kuralı kurar.
//
// Gerekli ortam değişkenleri:
//   CLOUDFLARE_API_TOKEN  — Zone:Edit, DNS:Edit, Zone Settings:Edit, Ruleset:Edit yetkileri
//   CLOUDFLARE_ACCOUNT_ID — zone'un açılacağı hesap
//
// Not: zone proxied (turuncu bulut) çalışır, TLS Cloudflare'de sonlanır. Origin'de
// qontac.net sertifikası bulunduğu için Cloudflare SSL modu "Full" olmalıdır
// ("Full (strict)" origin sertifikası ile alan adı eşleşmediğinden hata verir).

const API = "https://api.cloudflare.com/client/v4";

export class CloudflareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudflareError";
  }
}

export interface CloudflareConfig {
  token: string;
  accountId: string;
}

export function getCloudflareConfig(): CloudflareConfig | null {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) return null;
  return { token, accountId };
}

interface CfYanit<T> {
  success: boolean;
  result?: T;
  errors?: { code: number; message: string }[];
}

async function cf<T>(cfg: CloudflareConfig, yol: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + yol, {
      method: opts.method ?? "GET",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new CloudflareError("Cloudflare'e ulaşılamadı.");
  }

  const j = (await res.json().catch(() => null)) as CfYanit<T> | null;
  if (!j || !j.success) {
    const mesaj = j?.errors?.map(e => `${e.code}: ${e.message}`).join(", ") || `HTTP ${res.status}`;
    throw new CloudflareError(`Cloudflare hatası — ${mesaj}`);
  }
  return j.result as T;
}

export interface Zone {
  id: string;
  name: string;
  status: string; // "pending" | "active" | ...
  name_servers: string[];
}

/** Zone'u oluşturur; zaten varsa mevcut zone'u döner (idempotent). */
export async function zoneOlusturVeyaBul(cfg: CloudflareConfig, alanAdi: string): Promise<Zone> {
  const mevcut = await cf<Zone[]>(cfg, `/zones?name=${encodeURIComponent(alanAdi)}&account.id=${cfg.accountId}`);
  if (mevcut.length > 0) return mevcut[0];

  return cf<Zone>(cfg, "/zones", {
    method: "POST",
    body: { name: alanAdi, account: { id: cfg.accountId }, type: "full" },
  });
}

export async function zoneDurum(cfg: CloudflareConfig, zoneId: string): Promise<Zone> {
  return cf<Zone>(cfg, `/zones/${zoneId}`);
}

/**
 * CNAME kaydı ekler veya varsa günceller (idempotent).
 * `tamAd` tam ana bilgisayar adıdır: kök için "abcd.com", alt alan için "www.abcd.com".
 * Kökte Cloudflare CNAME düzleştirmesi devreye girer, bu yüzden A kaydına gerek yoktur.
 */
export async function cnameYaz(cfg: CloudflareConfig, zoneId: string, tamAd: string, hedef: string): Promise<void> {
  const mevcut = await cf<{ id: string; name: string; type: string }[]>(
    cfg,
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(tamAd)}`,
  );

  const kayit = { type: "CNAME", name: tamAd, content: hedef, ttl: 1, proxied: true };
  const eslesen = mevcut.find(r => r.name === tamAd);

  if (eslesen) {
    await cf(cfg, `/zones/${zoneId}/dns_records/${eslesen.id}`, { method: "PUT", body: kayit });
    return;
  }
  await cf(cfg, `/zones/${zoneId}/dns_records`, { method: "POST", body: kayit });
}

/**
 * Zone'a "gelen her istek → hedef adrese 301" kuralı kurar.
 * Dinamik yönlendirme phase'inin entrypoint ruleset'i tümüyle yazılır (idempotent).
 */
export async function yonlendirmeKurali(cfg: CloudflareConfig, zoneId: string, hedefUrl: string): Promise<string> {
  const ruleset = await cf<{ id: string }>(
    cfg,
    `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`,
    {
      method: "PUT",
      body: {
        rules: [
          {
            action: "redirect",
            expression: "true",
            description: "QONTAC kart sayfasına yönlendirme",
            action_parameters: {
              from_value: {
                status_code: 301,
                target_url: { value: hedefUrl },
                preserve_query_string: false,
              },
            },
          },
        ],
      },
    },
  );
  return ruleset.id;
}

// ——————————————————————————————— Cloudflare for SaaS (üyenin kendi alan adı)
//
// Üye alan adını kendi kayıt kuruluşunda tutuyorsa nameserver'ları alamayız;
// bunun yerine kendi zone'umuzda (qontac.net) o ana bilgisayar için bir
// "custom hostname" açarız. Cloudflare sahiplik ve SSL doğrulamasını TXT
// kayıtlarıyla yapar, sertifikayı kendisi üretir ve yeniler.
//
// Gerekli: hesapta Cloudflare for SaaS açık olmalı ve CLOUDFLARE_ZONE_ID
// (qontac.net zone'u) tanımlı olmalı; tanımsızsa ada göre aranır.

/**
 * qontac.net zone kimliği — custom hostname'ler bu zone altında açılır.
 * Sırayla: admin panelindeki ayar → CLOUDFLARE_ZONE_ID → Cloudflare'de ada göre arama.
 */
export async function anaZoneId(cfg: CloudflareConfig): Promise<string> {
  const ayar = await prisma.siteSettings.findUnique({
    where: { id: "site" },
    select: { cfZoneId: true },
  }).catch(() => null);
  if (ayar?.cfZoneId) return ayar.cfZoneId;

  const env = process.env.CLOUDFLARE_ZONE_ID;
  if (env) return env;

  const kok = (process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net").replace(/^https?:\/\//, "").split("/")[0];
  const zonelar = await cf<Zone[]>(cfg, `/zones?name=${encodeURIComponent(kok)}&account.id=${cfg.accountId}`);
  if (zonelar.length === 0) throw new CloudflareError(`"${kok}" zone'u Cloudflare hesabında bulunamadı.`);
  return zonelar[0].id;
}

/** Üyeye gösterilecek tek bir DNS kaydı. */
export interface DnsKaydi {
  tip: "TXT" | "CNAME";
  ad: string;
  deger: string;
  aciklama: string;
}

export interface CustomHostname {
  id: string;
  hostname: string;
  /** "pending" | "active" | "blocked" ... — sahiplik doğrulaması. */
  status: string;
  /** "pending_validation" | "active" ... — sertifika durumu. */
  sslStatus: string;
  /** Üyenin kendi DNS panelinde açması gereken doğrulama kayıtları. */
  dogrulama: DnsKaydi[];
}

interface ChYanit {
  id: string;
  hostname: string;
  status: string;
  ownership_verification?: { type?: string; name?: string; value?: string };
  ownership_verification_http?: { http_url?: string; http_body?: string };
  ssl?: {
    status?: string;
    txt_name?: string;
    txt_value?: string;
    validation_records?: { txt_name?: string; txt_value?: string }[];
  };
}

function chCoz(y: ChYanit): CustomHostname {
  const dogrulama: DnsKaydi[] = [];

  // Sahiplik doğrulaması — hostname zaten bize CNAME'liyse Cloudflare bu alanı
  // hiç döndürmez, o yüzden varlığı kontrol edilir.
  if (y.ownership_verification?.name && y.ownership_verification.value) {
    dogrulama.push({
      tip: "TXT",
      ad: y.ownership_verification.name,
      deger: y.ownership_verification.value,
      aciklama: "Alan adının size ait olduğunu doğrular.",
    });
  }

  // SSL doğrulaması — sertifika bu kayıt görülmeden üretilmez.
  const ssl = y.ssl ?? {};
  const sslKayitlari = [
    ...(ssl.txt_name && ssl.txt_value ? [{ txt_name: ssl.txt_name, txt_value: ssl.txt_value }] : []),
    ...(ssl.validation_records ?? []),
  ];
  for (const r of sslKayitlari) {
    if (!r.txt_name || !r.txt_value) continue;
    if (dogrulama.some(d => d.ad === r.txt_name)) continue;
    dogrulama.push({
      tip: "TXT",
      ad: r.txt_name,
      deger: r.txt_value,
      aciklama: "Güvenlik sertifikasının (https) üretilmesi için gerekir.",
    });
  }

  return {
    id: y.id,
    hostname: y.hostname,
    status: y.status,
    sslStatus: ssl.status || "",
    dogrulama,
  };
}

/** Custom hostname açar; aynı ad zaten varsa mevcut kaydı döner (idempotent). */
export async function customHostnameOlustur(cfg: CloudflareConfig, zoneId: string, hostname: string): Promise<CustomHostname> {
  const mevcut = await cf<ChYanit[]>(cfg, `/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`);
  const eslesen = mevcut.find(h => h.hostname === hostname);
  if (eslesen) return chCoz(eslesen);

  const y = await cf<ChYanit>(cfg, `/zones/${zoneId}/custom_hostnames`, {
    method: "POST",
    body: {
      hostname,
      ssl: {
        method: "txt", // http doğrulaması adres henüz bize bakmadığı için çalışmaz
        type: "dv",
        settings: { min_tls_version: "1.2" },
        bundle_method: "ubiquitous",
        wildcard: false,
      },
    },
  });
  return chCoz(y);
}

export async function customHostnameDurum(cfg: CloudflareConfig, zoneId: string, id: string): Promise<CustomHostname> {
  return chCoz(await cf<ChYanit>(cfg, `/zones/${zoneId}/custom_hostnames/${id}`));
}

/** Bağlantı kaldırıldığında custom hostname'i siler (sertifika da iptal olur). */
export async function customHostnameSil(cfg: CloudflareConfig, zoneId: string, id: string): Promise<void> {
  await cf(cfg, `/zones/${zoneId}/custom_hostnames/${id}`, { method: "DELETE" });
}

/** SSL modunu "Full" yapar — origin sertifikası alan adıyla eşleşmediği için strict olmamalı. */
export async function sslModuAyarla(cfg: CloudflareConfig, zoneId: string): Promise<void> {
  await cf(cfg, `/zones/${zoneId}/settings/ssl`, { method: "PATCH", body: { value: "full" } });
  // HTTP → HTTPS yönlendirmesi, ziyaretçi http yazsa bile güvenli bağlantı kurulsun.
  await cf(cfg, `/zones/${zoneId}/settings/always_use_https`, { method: "PATCH", body: { value: "on" } }).catch(() => {});
}
