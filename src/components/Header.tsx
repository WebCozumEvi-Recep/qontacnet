"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/config";

type NavDict = {
  home: string; forFirms: string; forMembers: string; features: string;
  products: string; faq: string; contact: string; login: string; apply: string;
};

export default function Header({
  logoUrl = "",
  logoText = "QONTAC",
  nav,
  locale,
}: {
  logoUrl?: string;
  logoText?: string;
  nav: NavDict;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const navLinks = [
    { label: nav.home, href: "/", active: true },
    { label: nav.forFirms, href: "#firmalar" },
    { label: nav.forMembers, href: "#uyeler" },
    { label: nav.features, href: "#ozellikler" },
    { label: nav.products, href: "#urunler" },
    { label: nav.faq, href: "#sss" },
    { label: nav.contact, href: "#iletisim" },
  ];

  return (
    <header ref={navRef} className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <nav className="flex justify-between items-center h-20 px-4 md:px-10 max-w-container-max mx-auto">
        {/* Logo — ana sayfaya döner */}
        <Link href="/" className="flex items-center gap-xs" aria-label={logoText}>
          {logoUrl ? (
            <img src={logoUrl} alt={logoText} className="h-9 md:h-10 w-auto max-w-[150px] md:max-w-[190px] object-contain" />
          ) : (
            <span className="text-headline-md font-bold text-primary tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
              {logoText}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-md">
          {navLinks.map((l) => {
            const cls = `text-label-md transition-all ${
              l.active
                ? "text-primary font-bold border-b-2 border-primary pb-1"
                : "text-on-surface-variant font-medium hover:text-primary duration-300"
            }`;
            return l.href.startsWith("/") ? (
              <Link key={l.label} href={l.href} className={cls}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} className={cls}>{l.label}</a>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 md:gap-sm">
          <LanguageSwitcher current={locale} />
          <Link
            href="/auth/login"
            className="bg-primary-container text-on-primary-container font-bold px-3.5 py-2 md:px-6 md:py-3 rounded-xl hover:scale-105 active:scale-95 transition-all text-label-sm md:text-label-md whitespace-nowrap"
          >
            {nav.login}
          </Link>
          {/* Mobile hamburger */}
          <button className="md:hidden text-on-surface p-2" onClick={() => setOpen(!open)}>
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 border-t border-white/10 bg-surface-container-low">
          {navLinks.map((l) => {
            const cls = "block py-3 text-sm text-on-surface-variant hover:text-primary transition-colors border-b border-white/5";
            return l.href.startsWith("/") ? (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={cls}>{l.label}</Link>
            ) : (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className={cls}>{l.label}</a>
            );
          })}
          <Link
            href="/auth/login"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl text-label-md"
          >
            {nav.login}
          </Link>
        </div>
      )}
    </header>
  );
}
