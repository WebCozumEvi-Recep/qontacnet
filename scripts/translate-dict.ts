/**
 * Kaynak sözlüğü (tr.json) okur, eksik anahtarları Claude API ile diğer
 * dillere çevirip günceller. Var olan çeviriler korunur (yalnızca eksikler).
 *
 * Kullanım:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/translate-dict.ts
 *   ANTHROPIC_API_KEY=... npx tsx scripts/translate-dict.ts --force   (hepsini yeniden çevir)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DICT_DIR = join(process.cwd(), "src/lib/i18n/dictionaries");
const SOURCE = "tr";
const TARGETS = ["en", "ar", "bg", "ru"] as const;
const LANG_NAME: Record<string, string> = { en: "English", ar: "Arabic", bg: "Bulgarian", ru: "Russian" };

const force = process.argv.includes("--force");

type Json = { [k: string]: string | Json };

function flatten(obj: Json, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else Object.assign(out, flatten(v, key));
  }
  return out;
}

function setPath(obj: Json, path: string, value: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] ??= {};
    cur = cur[parts[i]] as Json;
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateBatch(fields: Record<string, string>, target: string): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY gerekli");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system:
        `Translate the JSON values into ${LANG_NAME[target]}. Keep keys identical. ` +
        "Do NOT translate brand names like QONTAC, QONTACNET, Network Card, NFC, QR. " +
        "Return ONLY valid JSON, no markdown fences.",
      messages: [{ role: "user", content: JSON.stringify(fields) }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  let out = data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
  out = out.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(out);
}

async function main() {
  const source = JSON.parse(readFileSync(join(DICT_DIR, `${SOURCE}.json`), "utf8")) as Json;
  const flatSource = flatten(source);

  for (const target of TARGETS) {
    const path = join(DICT_DIR, `${target}.json`);
    let existing: Json = {};
    try { existing = JSON.parse(readFileSync(path, "utf8")); } catch { /* yeni dosya */ }
    const flatExisting = flatten(existing);

    const missing: Record<string, string> = {};
    for (const [k, v] of Object.entries(flatSource)) {
      if (force || !flatExisting[k]) missing[k] = v;
    }

    if (Object.keys(missing).length === 0) {
      console.log(`✓ ${target}: güncel`);
      continue;
    }
    console.log(`→ ${target}: ${Object.keys(missing).length} anahtar çevriliyor...`);
    const translated = await translateBatch(missing, target);
    const result: Json = force ? {} : existing;
    // Önce tüm kaynak yapıyı koru, sonra çevirileri yerleştir
    for (const k of Object.keys(flatSource)) {
      setPath(result, k, translated[k] ?? flatExisting[k] ?? flatSource[k]);
    }
    writeFileSync(path, JSON.stringify(result, null, 2) + "\n", "utf8");
    console.log(`✓ ${target}: yazıldı`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
