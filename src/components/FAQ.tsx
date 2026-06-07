"use client";
import { useState } from "react";

const faqs = [
  {
    q: "NFC kartlar her telefonla çalışır mı?",
    a: "Evet, son 10 yılda üretilen akıllı telefonların %95'inde NFC özelliği mevcuttur. NFC özelliği olmayan eski modeller için ise her kartın arkasında bulunan dinamik QR kod kullanılabilir.",
  },
  {
    q: "Kart bilgileri güncellenebilir mi?",
    a: "Kesinlikle. Dijital profilinizdeki tüm bilgiler anlık olarak güncellenebilir. Fiziksel kartı değiştirmenize gerek kalmadan saniyeler içinde yeni verileri yayınlayabilirsiniz.",
  },
  {
    q: "Firma olarak tüm üyeleri görebilir miyiz?",
    a: "Evet, merkezi firma paneli üzerinden tüm üyelerinizi listeleyebilir, profillerini onaylayabilir veya pasife alabilirsiniz.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="sss" className="py-xl">
      <div className="max-w-[48rem] mx-auto px-10">
        <h2
          className="text-headline-md md:text-display-lg font-bold text-center mb-xl text-on-background"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          Sıkça Sorulan Sorular
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
