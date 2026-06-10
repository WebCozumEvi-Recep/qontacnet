"use client";
import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Ana Sayfa", href: "#", active: true },
  { label: "Sistem", href: "#sistem" },
  { label: "Firmalar İçin", href: "#firmalar" },
  { label: "Üyeler İçin", href: "#uyeler" },
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Ürünler", href: "#urunler" },
  { label: "Paketler", href: "#paketler" },
  { label: "S.S.S.", href: "#sss" },
  { label: "İletişim", href: "#iletisim" },
];

export default function Header({ logoUrl = "" }: { logoUrl?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <nav className="flex justify-between items-center h-20 px-10 max-w-container-max mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-xs">
          {logoUrl ? (
            <img src={logoUrl} alt="QONTAC" className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-headline-md font-bold text-primary tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
              QONTAC
            </span>
          )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-md">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`text-label-md transition-all ${
                l.active
                  ? "text-primary font-bold border-b-2 border-primary pb-1"
                  : "text-on-surface-variant font-medium hover:text-primary duration-300"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-sm">
          <Link href="/auth/login" className="hidden lg:block text-on-surface-variant font-medium hover:text-primary transition-colors text-label-md px-4 py-2">
            Giriş Yap
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all text-label-md"
          >
            Firma Başvurusu
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
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-on-surface-variant hover:text-primary transition-colors border-b border-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#demo"
            className="mt-4 block text-center bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl text-label-md"
          >
            Firma Başvurusu
          </a>
        </div>
      )}
    </header>
  );
}
