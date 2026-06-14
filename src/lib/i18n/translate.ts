import "server-only";
import { LOCALE_LABELS, type Locale } from "./config";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // hızlı + ucuz; çeviri için yeterli

const LANG_NAME: Record<Locale, string> = {
  tr: "Turkish",
  en: "English",
  ar: "Arabic",
  bg: "Bulgarian",
  ru: "Russian",
};

export class TranslateError extends Error {}

/**
 * Tek bir metni hedef dile çevirir. HTML korunur, marka adları aynı kalır.
 * sourceLocale belirtilmezse model otomatik algılar.
 */
export async function translateText(
  text: string,
  target: Locale,
  opts: { isHtml?: boolean; sourceLocale?: Locale } = {},
): Promise<string> {
  if (!text.trim()) return text;
  if (target === opts.sourceLocale) return text;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new TranslateError("ANTHROPIC_API_KEY tanımlı değil");

  const fromClause = opts.sourceLocale ? `from ${LANG_NAME[opts.sourceLocale]} ` : "";
  const htmlClause = opts.isHtml
    ? " The text is HTML; preserve all tags, attributes and structure exactly, translate only the human-readable text content."
    : "";

  const system =
    `You are a professional translator. Translate the user's text ${fromClause}into ${LANG_NAME[target]} (${LOCALE_LABELS[target].native}).` +
    " Keep the meaning natural and idiomatic. Do NOT translate brand/product names like 'QONTAC', 'QONTACNET', 'Network Card', 'NFC', 'QR'." +
    htmlClause +
    " Return ONLY the translation, with no preamble, quotes, or explanation.";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranslateError(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const out = data.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!out) throw new TranslateError("Boş çeviri yanıtı");
  return out.trim();
}

/**
 * Birden çok alanı tek istekte çevirir (JSON map). Sözleşme/kart gibi
 * çok alanlı içerikler için verimli.
 */
export async function translateFields(
  fields: Record<string, string>,
  target: Locale,
  opts: { isHtml?: boolean; sourceLocale?: Locale } = {},
): Promise<Record<string, string>> {
  const entries = Object.entries(fields).filter(([, v]) => v?.trim());
  if (entries.length === 0) return { ...fields };
  if (target === opts.sourceLocale) return { ...fields };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new TranslateError("ANTHROPIC_API_KEY tanımlı değil");

  const fromClause = opts.sourceLocale ? `from ${LANG_NAME[opts.sourceLocale]} ` : "";
  const htmlClause = opts.isHtml
    ? " Some values contain HTML; preserve all tags exactly and translate only visible text."
    : "";

  const system =
    `You are a professional translator. You receive a JSON object whose values must be translated ${fromClause}into ${LANG_NAME[target]} (${LOCALE_LABELS[target].native}).` +
    " Translate ONLY the values, keep the keys identical. Do NOT translate brand/product names like 'QONTAC', 'QONTACNET', 'Network Card', 'NFC', 'QR'." +
    htmlClause +
    " Return ONLY a valid JSON object with the same keys, no markdown fences, no explanation.";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: JSON.stringify(Object.fromEntries(entries)) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TranslateError(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  let out = data.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("") ?? "";
  out = out.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(out);
  } catch {
    throw new TranslateError("Çeviri JSON olarak ayrıştırılamadı");
  }
  // Çevrilemeyen alanlar orijinal kalsın.
  return { ...fields, ...parsed };
}
