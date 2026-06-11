"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

const pageTitles: Record<string, string> = {
  "/firma": "Firma Paneli",
  "/firma/uyeler": "Üye Yönetimi",
  "/firma/template": "Kart Şablonları",
  "/firma/sayfa": "Sayfa Modülleri",
  "/firma/basvurular": "Başvurular",
  "/firma/analitik": "Analitik",
  "/firma/ayarlar": "Ayarlar",
};

export default function FirmaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "firma")) {
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

  const title = pageTitles[pathname] ?? "Firma Paneli";

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="firma" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardTopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
