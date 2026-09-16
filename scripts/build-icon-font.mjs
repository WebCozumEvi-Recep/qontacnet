/**
 * Material Symbols subset üretici.
 *
 * Kaynak koddaki tüm ikon adlarını tarar ve yalnız onları içeren, sabit eksenli
 * (opsz 24 / wght 400 / FILL 0 / GRAD 0) bir woff2 indirir.
 * Tam değişken font ~3.9 MB; bu subset ~19 KB.
 *
 * Yeni ikon eklendiğinde çalıştır:  node scripts/build-icon-font.mjs
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const OUT = "public/fonts/material-symbols-subset.woff2";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const sh = (cmd) => execSync(cmd, { encoding: "utf8", shell: "/bin/bash" });

/** src/ altındaki tüm .ts/.tsx dosyaları. */
function kaynakDosyalari(dizin = "src") {
  const liste = [];
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    const yol = join(dizin, g.name);
    if (g.isDirectory()) liste.push(...kaynakDosyalari(yol));
    else if (/\.tsx?$/.test(g.name)) liste.push(yol);
  }
  return liste;
}

const icons = new Set();
const add = (text) => text.split(/\s+/).filter(Boolean).forEach((i) => icons.add(i));

// Dosyaları JS ile tarıyoruz — grep satır bazlı çalıştığı ve kabuk tırnakları
// kolayca bozulduğu için birden çok satıra yayılan JSX'te ikon kaçırılıyordu.
for (const dosya of kaynakDosyalari()) {
  const icerik = readFileSync(dosya, "utf8");

  // a) <span className="material-symbols-outlined ...">GÖVDE</span>
  //    Gövde düz metin ("check") ya da JSX ifadesi ({kosul ? "a" : "b"}) olabilir;
  //    ifadedeki tüm string literalleri aday sayıyoruz.
  for (const m of icerik.matchAll(/material-symbols-outlined[^>]*>([\s\S]*?)<\//g)) {
    const govde = m[1];
    const duz = govde.trim().match(/^([a-z][a-z_0-9]{2,})/);
    if (duz) add(duz[1]);
    for (const s of govde.matchAll(/"([a-z][a-z_0-9]{2,})"/g)) add(s[1]);
  }

  // b) icon / ikon / ikonAd — hem JSX prop'u (icon="x") hem nesne alanı (icon: "x")
  for (const m of icerik.matchAll(/\b(?:icon|ikon|ikonAd)\s*[:=]\s*"([a-z_0-9]+)"/g)) add(m[1]);
}

// Üye modül ikon kataloğu — üyenin seçebildiği tüm ikonlar. Dosyadaki her
// string literali aday sayıyoruz; ikon olmayanlar aşağıdaki geçerlilik
// süzgecinde zaten eleniyor.
add(
  (readFileSync("src/components/ModulIkon.tsx", "utf8").match(/"[a-z][a-z_0-9]{2,}"/g) ?? [])
    .map((s) => s.slice(1, -1))
    .join(" "),
);

// Kart baskı editörü ikonları değişkenlerden ({ikon}) basar; bu dosyalardaki tüm
// string literalleri aday sayılır (ikon olmayanlar geçerlilik süzgecinde elenir).
for (const dosya of ["src/lib/kart-baski.ts", "src/app/admin/firmalar/[id]/sablon/[sablonId]/page.tsx"]) {
  add((readFileSync(dosya, "utf8").match(/"[a-z][a-z_0-9]{2,}"/g) ?? []).map((s) => s.slice(1, -1)).join(" "));
}

// Elle eklenenler — kaynakta hiç geçmeyen ama çalışma anında kullanılabilecek
// ikonlar (ör. veritabanından gelen adlar) buraya yazılır.
add(`
  autorenew cloud_sync event_busy pending lock print badge storefront
  travel_explore campaign chat checklist edit_note share tag refresh
  cancel language download close info warning
  payments credit_card code public database verified bolt event mail
  qr_code_2 search visibility check check_circle content_copy sync error
  progress_activity work
`);

// Adayları Material Symbols'ün resmî ikon listesiyle süzüyoruz: JSX gövdesindeki
// her string literali aday saydığımız için ikon olmayan metinler ("gonderiliyor"
// gibi durum değerleri) de listeye giriyor. Google Fonts bilinmeyen ada 400
// döndüğü için bu süzme aynı zamanda yazım hatalarına karşı koruma sağlar.
const CODEPOINTS =
  "https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/" +
  "MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints";

const gecerli = new Set(
  sh(`curl -sS ${JSON.stringify(CODEPOINTS)}`)
    .split("\n")
    .map((satir) => satir.split(" ")[0])
    .filter(Boolean),
);

const disarida = [...icons].filter((i) => !gecerli.has(i)).sort();
if (disarida.length > 0) {
  // Uyarı stderr'e — `--list` çıktısı boru hattında saf ad listesi kalsın.
  console.error(`Material Symbols'te bulunmayan ${disarida.length} ad atlandı: ${disarida.join(", ")}`);
}

const names = [...icons].filter((i) => gecerli.has(i)).sort();

// `node scripts/build-icon-font.mjs --list` → font indirmeden ad listesini basar.
if (process.argv.includes("--list")) {
  console.log(names.join("\n"));
  process.exit(0);
}

console.log(`${names.length} ikon bulundu.`);

const cssUrl =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" +
  `&icon_names=${names.join(",")}&display=block`;

const css = sh(`curl -sS -A ${JSON.stringify(UA)} ${JSON.stringify(cssUrl)}`);
const fontUrl = css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/)?.[0];
if (!fontUrl) throw new Error("Google Fonts yanıtında woff2 bağlantısı bulunamadı.");

const font = execSync(`curl -sS ${JSON.stringify(fontUrl)}`, { maxBuffer: 1 << 28 });
writeFileSync(OUT, font);
console.log(`${OUT} yazıldı (${(font.length / 1024).toFixed(1)} KB).`);

// Dosya adı sabit olduğu için tarayıcı ve Cloudflare eski subset'i önbellekten
// sunabiliyor; yeni eklenen ikonlar ekranda yazı olarak kalıyordu. Font
// değiştiğinde URL'deki ?v= damgasını içerik özetiyle güncelliyoruz.
const damga = createHash("sha256").update(font).digest("hex").slice(0, 8);
const kullananlar = ["src/app/globals.css", "src/app/layout.tsx"];
for (const dosya of kullananlar) {
  const eski = readFileSync(dosya, "utf8");
  const yeni = eski.replace(
    /\/fonts\/material-symbols-subset\.woff2(\?v=[a-f0-9]+)?/g,
    `/fonts/material-symbols-subset.woff2?v=${damga}`,
  );
  if (yeni !== eski) {
    writeFileSync(dosya, yeni);
    console.log(`${dosya} güncellendi (?v=${damga}).`);
  }
}
