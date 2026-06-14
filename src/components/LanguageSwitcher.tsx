"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function pick(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    setPending(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-label={LOCALE_LABELS[current].native}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-white/5 transition-colors text-label-md disabled:opacity-50"
      >
        <span className="text-base leading-none">{LOCALE_LABELS[current].flag}</span>
        <span className="hidden sm:inline uppercase font-semibold text-xs">{current}</span>
        <span className="material-symbols-outlined text-base leading-none">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl glass-card border border-white/10 shadow-xl overflow-hidden z-50">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                l === current ? "text-primary font-semibold" : "text-on-surface-variant"
              }`}
            >
              <span className="text-base leading-none">{LOCALE_LABELS[l].flag}</span>
              {LOCALE_LABELS[l].native}
              {l === current && <span className="material-symbols-outlined text-base ml-auto">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
