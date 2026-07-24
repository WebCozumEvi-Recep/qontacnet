"use client";
// Kart sayfası dil seçici. Dil sunucuda çözüldüğü için burada yalnız gezinme var:
// seçim ?lang= parametresine yazılır ve sayfa sunucudan yeni dille getirilir.
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

export function DilSecici({ aktif }: { aktif: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sec = (l: Locale) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", l);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="fixed top-3 left-3 z-50 flex gap-1 rounded-full px-1.5 py-1 backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => sec(l)}
          title={LOCALE_LABELS[l].native}
          aria-label={LOCALE_LABELS[l].native}
          aria-current={aktif === l ? "true" : undefined}
          className={`w-7 h-7 rounded-full text-sm leading-none transition-all ${aktif === l ? "ring-2 ring-white/70 scale-110" : "opacity-60 hover:opacity-100"}`}
        >
          {LOCALE_LABELS[l].flag}
        </button>
      ))}
    </div>
  );
}
