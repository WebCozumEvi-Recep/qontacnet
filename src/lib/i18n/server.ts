import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

import tr from "./dictionaries/tr.json";
import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";
import bg from "./dictionaries/bg.json";
import ru from "./dictionaries/ru.json";

// Sözlük tipi kaynak dilden (tr) türetilir.
export type Dictionary = typeof tr;

const dictionaries: Record<Locale, Dictionary> = {
  tr,
  en: en as Dictionary,
  ar: ar as Dictionary,
  bg: bg as Dictionary,
  ru: ru as Dictionary,
};

// Çerezden aktif dili okur (yoksa varsayılan).
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

// Layout/sayfalarda tek çağrı ile dil + sözlük.
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
