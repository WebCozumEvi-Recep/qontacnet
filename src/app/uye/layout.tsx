"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import UyeMobileNav, { UyeMobileHeader } from "@/components/dashboard/UyeMobileNav";

const pageTitles: Record<string, string> = {
  "/uye": "Panel",
  "/uye/template": "Firma Şablonu",
  "/uye/sifre": "Şifre Değiştir",
  "/uye/modullerim": "Modüllerim",
  "/uye/profil": "Profilim",
  "/uye/qr": "QR Kodum",
  "/uye/baglantilar": "İletişim Talepleri",
  "/uye/web-adresin": "Web Adresin",
};

export default function UyeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "uye")) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  const adminDon = async () => {
    await fetch("/api/auth/admin-don", { method: "POST" });
    window.location.assign("/admin/uyeler");
  };

  const title = pageTitles[pathname] ?? "Üye Paneli";

  const m = (user.data ?? {}) as { ad?: string; soyad?: string };
  const name = [m.ad, m.soyad].filter(Boolean).join(" ") || user.email || "";

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="uye" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Masaüstü üst bar */}
        <div className="hidden lg:block">
          <DashboardTopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        </div>
        {/* Mobil uygulama görünümü başlığı */}
        <UyeMobileHeader title={title} name={name} />
        {user.adminGirisi && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-400/10 border-b border-amber-400/20 text-amber-300 text-xs sm:text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="truncate">Admin olarak <b>{name}</b> hesabındasınız.</span>
            </span>
            <button onClick={adminDon} className="shrink-0 px-3 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 font-semibold">Admin&apos;e dön</button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-x-hidden">{children}</main>
      </div>
      {/* Mobil alt tab bar */}
      <UyeMobileNav />
    </div>
  );
}
