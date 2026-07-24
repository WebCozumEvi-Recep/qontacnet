import { FirmaModulRender } from "@/components/FirmaModulRender";
import { getFirmaModulleri } from "@/lib/kart-data";
import type { Locale } from "@/lib/i18n/config";

/**
 * Firma şablonu modülleri — kartın altındaki ağır içerik blokları (galeri, video,
 * form...). Kart gövdesini bekletmemek için sayfada `<Suspense>` içinde render
 * edilir; kart anında görünür, bu bölüm hazır oldukça akar.
 */
export async function FirmaSablonu({
  templateId,
  locale,
  color,
  memberId,
  iletisimAdi,
}: {
  templateId: string;
  locale: Locale;
  color: string;
  memberId: string;
  iletisimAdi: string;
}) {
  const moduller = await getFirmaModulleri(templateId, locale);
  if (moduller.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {moduller.map((m) => (
        <FirmaModulRender
          key={m.id}
          modul={m as Parameters<typeof FirmaModulRender>[0]["modul"]}
          color={color}
          memberId={memberId}
          iletisimAdi={iletisimAdi}
        />
      ))}
    </div>
  );
}

/** Şablon yüklenirken kartın altında yer tutan iskelet. */
export function FirmaSablonuIskelet() {
  return (
    <div className="space-y-4 mb-6" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
      ))}
    </div>
  );
}
