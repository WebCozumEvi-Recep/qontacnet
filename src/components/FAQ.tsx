"use client";
import { useState } from "react";
import { FAQ_DATA } from "@/lib/i18n/ui-text";

export default function FAQ({
  title = FAQ_DATA.title,
  faqs = FAQ_DATA.faqs,
}: {
  title?: string;
  faqs?: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="sss" className="py-xl">
      <div className="max-w-[48rem] mx-auto px-10">
        <h2
          className="text-headline-md md:text-display-lg font-bold text-center mb-xl text-on-background"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          {title}
        </h2>

        <div className="space-y-sm">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <button
                className="w-full p-md text-left flex justify-between items-center group"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="text-headline-sm font-semibold text-lg text-on-surface"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {faq.q}
                </span>
                <span
                  className={`material-symbols-outlined text-primary transition-transform duration-300 flex-shrink-0 ml-4 ${
                    open === i ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>
              {open === i && (
                <div className="px-md pb-md text-on-surface-variant text-sm border-t border-white/10 pt-md">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
