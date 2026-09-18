"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const GOLD = "#e6c34d";
const MUTED = "#7a808c";

const tabs = [
  { href: "/uye", icon: "grid_view", label: "Panel", exact: true },
  { href: "/uye/profil", icon: "person", label: "Profilim" },
  { href: "/uye/modullerim", icon: "widgets", label: "Modüllerim" },
  { href: "/uye/baglantilar", icon: "group_add", label: "Talepler" },
];

function aktifMi(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

/** Mobil alt tab bar — tasarım handoff'undaki uygulama görünümüne uyar. Yalnızca mobilde görünür. */
export default function UyeMobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-[84px] flex items-start pt-[11px] px-2 z-40 border-t border-white/[0.06]"
      style={{ background: "rgba(13,15,21,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      {tabs.map(t => {
        const a = aktifMi(pathname, t.href, t.exact);
        const c = a ? GOLD : MUTED;
        return (
          <Link key={t.href} href={t.href} className="flex-1 flex flex-col items-center gap-[5px]">
            <span className="material-symbols-outlined" style={{ color: c, fontSize: 24 }}>{t.icon}</span>
            <span style={{ color: c, fontSize: 10, fontWeight: 600 }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const ayarlar = [
  { href: "/uye/template", icon: "palette", label: "Firma Şablonu" },
  { href: "/uye/web-adresin", icon: "language", label: "Web Adresin" },
  { href: "/uye/sifre", icon: "lock", label: "Şifre Değiştir" },
];

/** Mobil üst başlık — /uye'de QONTAC logosu, diğer ekranlarda sayfa başlığı; sağda isim + ayarlar menüsü. */
export function UyeMobileHeader({ title, name }: { title: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const anaSayfa = pathname === "/uye";

  useEffect(() => setAcik(false), [pathname]);
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [acik]);

  const cikis = async () => {
    setAcik(false);
    await logout();
    router.push("/auth/login");
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between gap-3 px-[18px] border-b border-white/[0.05] bg-surface-container-lowest/85 backdrop-blur-xl">
      {anaSayfa ? (
        <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: 1.5, color: GOLD }}>
          QONTAC
        </span>
      ) : (
        <h1 className="text-on-surface font-bold text-lg truncate" style={{ fontFamily: "Sora, sans-serif" }}>{title}</h1>
      )}
      <div ref={ref} className="relative flex items-center gap-2 min-w-0">
        <span className="text-on-surface text-sm font-semibold truncate max-w-[140px]">{name}</span>
        <button
          type="button"
          onClick={() => setAcik(v => !v)}
          aria-label="Ayarlar"
          aria-expanded={acik}
          className="w-[38px] h-[38px] shrink-0 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#3a2f1a,#2a2433)", color: GOLD, border: "1px solid rgba(230,195,77,0.3)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
        </button>
        {acik && (
          <div
            className="absolute right-0 top-[46px] w-56 rounded-xl border border-white/[0.08] py-1.5 shadow-2xl"
            style={{ background: "rgba(20,22,30,0.98)" }}
          >
            {ayarlar.map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-white/[0.05]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: pathname === a.href ? GOLD : MUTED }}>{a.icon}</span>
                {a.label}
              </Link>
            ))}
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              type="button"
              onClick={cikis}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
              Çıkış
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
