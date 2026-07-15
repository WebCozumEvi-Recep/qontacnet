"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import UyeMobileNav, { UyeMobileHeader } from "@/components/dashboard/UyeMobileNav";

const pageTitles: Record<string, string> = {
  "/uye": "Panel",
  "/uye/kartim": "Kartım",
  "/uye/template": "Kart Şablonu",
  "/uye/modullerim": "Modüllerim",
  "/uye/profil": "Profilim",
  "/uye/qr": "QR Kodum",
  "/uye/baglantilar": "Bağlantılarım",
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

  const title = pageTitles[pathname] ?? "Üye Paneli";

  const m = (user.data ?? {}) as { ad?: string; soyad?: string };
  const initials = `${(m.ad ?? user.email ?? "Ü").charAt(0)}${(m.soyad ?? "").charAt(0)}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="uye" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Masaüstü üst bar */}
        <div className="hidden lg:block">
          <DashboardTopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        </div>
        {/* Mobil uygulama görünümü başlığı */}
        <UyeMobileHeader title={title} initials={initials} />
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 overflow-x-hidden">{children}</main>
      </div>
      {/* Mobil alt tab bar */}
      <UyeMobileNav />
    </div>
  );
}
