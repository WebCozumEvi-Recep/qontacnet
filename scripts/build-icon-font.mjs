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
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "public/fonts/material-symbols-subset.woff2";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const sh = (cmd) => execSync(cmd, { encoding: "utf8", shell: "/bin/bash" });

const icons = new Set();
const add = (text) => text.split(/\s+/).filter(Boolean).forEach((i) => icons.add(i));

// 1) <span className="material-symbols-outlined">ikon_adi</span>
add(
  sh(
    `grep -rhoE 'material-symbols-outlined[^>]*>[^<{]*' --include='*.tsx' src/ ` +
      `| sed -E 's/.*>[[:space:]]*//' | grep -oE '^[a-z_0-9]+' || true`,
  ),
);

// 1b) <span className="material-symbols-outlined">{kosul ? "ikon_a" : "ikon_b"}</span>
// İkon adının JSX ifadesi içinde geçtiği durumlar — (1) numaralı desen `{` görünce durur.
add(
  sh(
    `grep -rhoE 'material-symbols-outlined[^>]*>\\{[^}]*\\}' --include='*.tsx' src/ ` +
      `| grep -oE '"[a-z_0-9]+"' | tr -d '"' || true`,
  ),
);

// 2) { icon: "ikon_adi" } / { ikonAd: "..." } biçimindeki prop tanımları
add(
  sh(
    `grep -rhoE '(icon|ikonAd|ikon): "[a-z_0-9]+"' --include='*.tsx' --include='*.ts' src/ ` +
      `| grep -oE '"[a-z_0-9]+"' | tr -d '"' || true`,
  ),
);

// 3) Üye modül ikon kataloğu (DB'den seçilebilen ikonlar)
const galeri = readFileSync("src/components/ModulIkon.tsx", "utf8").match(
  /IKON_GALERI = \[([\s\S]*?)\];/,
);
if (galeri) add(galeri[1].match(/"[a-z_0-9]+"/g).map((s) => s.slice(1, -1)).join(" "));

// 4) Elle eklenenler — grep desenleri satır bazlı çalıştığı için, ikon adı
// birden çok satıra yayılan bir JSX ifadesinde geçiyorsa yakalanamaz.
// Böyle ikonları buraya yazın.
add(`
  autorenew cloud_sync event_busy pending lock print badge storefront
  travel_explore campaign chat checklist edit_note share tag refresh
  cancel language download close info warning
  payments credit_card code public database verified bolt event mail
  qr_code_2 search visibility check check_circle content_copy sync error
  progress_activity work
`);

const names = [...icons].sort();
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
