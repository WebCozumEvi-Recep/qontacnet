import "server-only";
import { getSiteSettings } from "@/lib/site-settings";
import { SATICI_YER_TUTUCULARI, yerTutucuDoldur } from "@/lib/sozlesmeler";

/** Özel sayfa içeriğindeki {{SATICI_...}} ifadelerini site ayarlarındaki satıcı bilgileriyle doldurur. */
export async function saticiDoldur(html: string): Promise<string> {
  if (!html.includes("{{")) return html;
  const s = await getSiteSettings();
  const vergi = [s?.saticiVergiDairesi, s?.saticiVergiNo].filter(Boolean).join(" / ");
  return yerTutucuDoldur(html, SATICI_YER_TUTUCULARI.map(([k]) => k), {
    "{{SATICI_UNVAN}}": s?.saticiUnvan,
    "{{SATICI_ADRES}}": s?.saticiAdres,
    "{{SATICI_TELEFON}}": s?.saticiTelefon || s?.iletisimTelefon,
    "{{SATICI_EPOSTA}}": s?.saticiEposta || s?.iletisimEmail,
    "{{SATICI_VERGI}}": vergi,
    "{{SATICI_MERSIS}}": s?.saticiMersis,
    "{{SATICI_IADE_ADRESI}}": s?.saticiIadeAdresi || s?.saticiAdres,
    "{{TESLIMAT_MASRAFI}}": s?.saticiTeslimatMasrafi,
  });
}
