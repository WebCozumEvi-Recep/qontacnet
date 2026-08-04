import "server-only";

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

/** SSL modunu "Full" yapar — origin sertifikası alan adıyla eşleşmediği için strict olmamalı. */
export async function sslModuAyarla(cfg: CloudflareConfig, zoneId: string): Promise<void> {
  await cf(cfg, `/zones/${zoneId}/settings/ssl`, { method: "PATCH", body: { value: "full" } });
  // HTTP → HTTPS yönlendirmesi, ziyaretçi http yazsa bile güvenli bağlantı kurulsun.
  await cf(cfg, `/zones/${zoneId}/settings/always_use_https`, { method: "PATCH", body: { value: "on" } }).catch(() => {});
}
