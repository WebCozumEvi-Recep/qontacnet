"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const uyeNav: NavItem[] = [
  { href: "/uye", icon: "dashboard", label: "Panel" },
  { href: "/uye/kartim", icon: "credit_card", label: "Kartım" },
  { href: "/uye/modullerim", icon: "widgets", label: "Modüllerim" },
  { href: "/uye/profil", icon: "manage_accounts", label: "Profilim" },
  { href: "/uye/qr", icon: "qr_code_2", label: "QR Kodum" },
  { href: "/uye/baglantilar", icon: "group_add", label: "Bağlantılarım" },
];

const firmaNav: NavItem[] = [
  { href: "/firma", icon: "dashboard", label: "Panel" },
  { href: "/firma/uyeler", icon: "group", label: "Üyeler" },
  { href: "/firma/template", icon: "style", label: "Şablonlar" },
  { href: "/firma/basvurular", icon: "inbox", label: "Başvurular" },
  { href: "/firma/analitik", icon: "bar_chart", label: "Analitik" },
  { href: "/firma/urun-tanitim", icon: "campaign", label: "Ürün Tanıtımı" },
  { href: "/firma/ayarlar", icon: "settings", label: "Ayarlar" },
];

const adminNav: NavItem[] = [
  { href: "/admin", icon: "dashboard", label: "Genel Bakış" },
  { href: "/admin/firmalar", icon: "corporate_fare", label: "Firmalar" },
  { href: "/admin/kartlar", icon: "credit_card", label: "Kart Üretimi" },
  { href: "/admin/siparisler", icon: "local_shipping", label: "Siparişler" },
  { href: "/admin/lisanslar", icon: "workspace_premium", label: "Lisanslar" },
  { href: "/admin/gelir", icon: "trending_up", label: "Gelir Raporu" },
  { href: "/admin/urunler", icon: "inventory_2", label: "Ürünler" },
  { href: "/admin/uye-modulleri", icon: "widgets", label: "Üye Modülleri" },
  { href: "/admin/urun-tanitim", icon: "campaign", label: "Ürün Tanıtımı" },
  { href: "/admin/basvurular", icon: "mark_email_unread", label: "Başvurular" },
  { href: "/admin/sayfalar", icon: "description", label: "Özel Sayfalar" },
  { href: "/admin/ayarlar", icon: "settings", label: "Ayarlar" },
];

interface Props {
  role: "uye" | "firma" | "admin";
  open: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ role, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const nav = role === "uye" ? uyeNav : role === "firma" ? firmaNav : adminNav;
  const roleLabel = role === "uye" ? "Üye" : role === "firma" ? "Firma" : "Platform";

  const [siteText, setSiteText] = useState("QONTAC");
  const [siteLogo, setSiteLogo] = useState("");
  useEffect(() => {
    fetch("/api/site-info").then(r => r.json()).then(j => { if (j.ok) { setSiteText(j.logoText || "QONTAC"); setSiteLogo(j.logoUrl || ""); } }).catch(() => {});
  }, []);

  const ad = String(user?.data?.["ad"] ?? "");
  const soyad = String(user?.data?.["soyad"] ?? "");
  const displayName = (ad + (soyad ? " " + soyad : "")).trim() || (user?.email?.split("@")[0] ?? "");
  const displayEmail = String(user?.data?.["email"] ?? user?.email ?? "");
  const avatar = String(user?.data?.["avatar"] ?? "");
  const logo = String(user?.data?.["logo"] ?? "");

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/uye" || href === "/firma" || href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-surface-container-lowest border-r border-white/5 flex flex-col z-40 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start gap-2">
            {siteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteLogo} alt={siteText} className="h-7 w-auto object-contain" />
            ) : (
              <span className="text-xl font-bold text-primary" style={{ fontFamily: "Sora, sans-serif" }}>{siteText}</span>
            )}
            <span className="text-xs text-on-surface-variant bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {roleLabel}
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-primary-container/20 text-primary border border-primary/20"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 glass-card rounded-xl mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center flex-shrink-0">
              {(avatar || logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar || logo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{displayName}</p>
              <p className="text-xs text-on-surface-variant truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-on-surface-variant hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
