import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Üyelerin satın aldığı kişisel alan adları normalde Cloudflare'deki 301 kuralıyla
// kart sayfasına yönlendirilir. Kural bir sebeple uygulanmazsa istek bize kendi
// Host başlığıyla düşer; burada yakalayıp uygulama içi yedek yönlendirmeye alırız.
//
// Not (Next 16): bu dosya eski `middleware.ts` konvansiyonunun yerini alır.
// Veritabanı erişimi burada YAPILMAZ — proxy paylaşılan modüllere dayanmamalıdır;
// Host çözümlemesi /api/alan-adi/coz route handler'ında yapılır.

/** Kendi alan adlarımız — bunlar normal uygulama trafiğidir. */
function bizimHostMu(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) return true;

  const kok = (process.env.NEXT_PUBLIC_BASE_URL || "https://qontac.net").replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  return h === kok || h === `www.${kok}` || h.endsWith(`.${kok}`);
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host || bizimHostMu(host)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/api/alan-adi/coz";
  url.search = "";

  // Host'u başlıkla taşıyoruz: rewrite sonrası route handler'ın gördüğü sorgu dizesi
  // özgün isteğinkidir, dolayısıyla ?host= oraya ulaşmaz.
  const headers = new Headers(request.headers);
  headers.set("x-alan-adi-host", host);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Statik dosyalar ve API yolları hariç her istek. Yabancı Host ile gelen
  // API çağrısı zaten beklenmiyor; hariç tutmak yönlendirme döngüsünü de önler.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.[\\w]+$).*)"],
};
