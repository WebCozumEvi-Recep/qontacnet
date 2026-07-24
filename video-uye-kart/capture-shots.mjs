// Demo üye ile giriş yapıp üye panelinin ekranlarını PNG olarak yakalar.
// Chrome (puppeteer-core ile) kullanır; dev sunucusu localhost:3000'de açık olmalı.
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = new URL("./public/shots/", import.meta.url).pathname;
const W = 1440, H = 900;

const pages = [
  { path: "/uye", file: "01-panel.png", wait: 1200 },
  { path: "/uye/kartim", file: "02-kartim.png", wait: 1500 },
  { path: "/uye/modullerim", file: "03-moduller.png", wait: 1200 },
  { path: "/uye/profil", file: "04-profil.png", wait: 1200 },
  { path: "/uye/qr", file: "05-qr.png", wait: 1500 },
  { path: "/uye/baglantilar", file: "06-baglantilar.png", wait: 1200 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
  args: [`--window-size=${W},${H}`],
});
const page = await browser.newPage();

// 1) Giriş — login API'sini sayfa bağlamında çağır (oturum çerezi yerleşsin)
await page.goto(`${BASE}/auth/login`, { waitUntil: "networkidle2" });
const res = await page.evaluate(async () => {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@qontac.net", password: "123456", role: "uye" }),
  });
  return { status: r.status, body: await r.json() };
});
console.log("giriş:", JSON.stringify(res));
if (!res.body?.ok) { console.error("Giriş başarısız!"); await browser.close(); process.exit(1); }

// 2) Her sayfayı gez ve yakala
for (const p of pages) {
  await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle2" });
  await sleep(p.wait); // animasyon/yükleme otursun
  await page.screenshot({ path: OUT + p.file });
  console.log("yakalandı:", p.file);
}

await browser.close();
console.log("Bitti →", OUT);
