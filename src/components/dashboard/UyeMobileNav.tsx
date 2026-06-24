"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GOLD = "#e6c34d";
const MUTED = "#7a808c";

const tabs = [
  { href: "/uye", icon: "grid_view", label: "Panel", exact: true },
  { href: "/uye/kartim", icon: "credit_card", label: "Kartım" },
  { href: "/uye/modullerim", icon: "widgets", label: "Modüller" },
  { href: "/uye/qr", icon: "qr_code_2", label: "QR Kod" },
  { href: "/uye/baglantilar", icon: "group_add", label: "Bağlantı" },
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

/** Mobil üst başlık — /uye'de QONTAC logosu, diğer ekranlarda sayfa başlığı + profil avatarı. */
export function UyeMobileHeader({ title, initials }: { title: string; initials: string }) {
  const pathname = usePathname();
  const anaSayfa = pathname === "/uye";
  return (
    <header className="lg:hidden sticky top-0 z-20 h-14 flex items-center justify-between px-[18px] border-b border-white/[0.05] bg-surface-container-lowest/85 backdrop-blur-xl">
      {anaSayfa ? (
        <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: 1.5, color: GOLD }}>
          QONTAC
        </span>
      ) : (
        <h1 className="text-on-surface font-bold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>{title}</h1>
      )}
      <Link
        href="/uye/profil"
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: "linear-gradient(135deg,#3a2f1a,#2a2433)", color: GOLD, border: "1px solid rgba(230,195,77,0.3)" }}
      >
        {initials}
      </Link>
    </header>
  );
}
