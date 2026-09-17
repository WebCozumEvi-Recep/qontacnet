import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { dir } from "@/lib/i18n/config";

const inter = Inter({ subsets: ["latin"], variable: "--inter" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--sora" });

// Favicon ayardan okunur; ayarlar önbellekli olduğu için DB'ye gidilmez.
export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = (await getSiteSettings())?.faviconUrl ?? "";

  return {
    title: "QONTAC Network Card | Akıllı Dijital Kartvizit Sistemi",
    description:
      "QONTAC Network Card ile üyelerinize NFC ve QR destekli, firma onaylı, kişiselleştirilebilir dijital temsilci sayfaları sunun.",
    keywords: "NFC kartvizit, dijital kartvizit, network marketing, QR kod kartvizit",
    ...(faviconUrl ? { icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } } : {}),
    openGraph: {
      title: "QONTAC Network Card",
      description: "Network ekipleriniz için akıllı dijital kartvizit sistemi.",
      url: "https://qontac.net",
      siteName: "QONTAC",
      locale: "tr_TR",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Oturum sunucuda çözülür; istemci ayrıca /api/auth/me çağırmaz.
  // Çerezi olmayan ziyaretçide DB'ye hiç gidilmez.
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  return (
    <html lang={locale} dir={dir(locale)} className="dark scroll-smooth">
      <head>
        {/* İkon fontu self-host; preload ile ilk boyamadan önce hazır olur */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/material-symbols-subset.woff2?v=dfe3edf0"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} ${sora.variable}`}>
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
