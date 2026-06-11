"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

const pageTitles: Record<string, string> = {
  "/admin": "Platform Genel Bakış",
  "/admin/firmalar": "Firma Yönetimi",
  "/admin/kartlar": "Kart Üretimi & Stok",
  "/admin/siparisler": "Sipariş Takibi",
  "/admin/lisanslar": "Lisans Yönetimi",
  "/admin/gelir": "Gelir Raporları",
  "/admin/basvurular": "Başvurular",
  "/admin/sayfalar": "Özel Sayfalar",
  "/admin/ayarlar": "Platform Ayarları",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
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

  let title = pageTitles[pathname];
  if (!title) {
    if (pathname.startsWith("/admin/firmalar/")) title = "Firma Detayı";
    else title = "Platform Paneli";
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardTopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
